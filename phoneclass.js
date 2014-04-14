'use srtict';

var libxmljs = require('libxmljs'),
	fs = require('fs'),
	_ = require('lodash');


exports.PhoneClass = function() {

	var phoneTypes = ['fixedLine', 'mobile', 'personalNumber']; // phones we are iterested in

/*
 * Load country settings
 */
 	var shema = {};
	(function() {
		var xml = libxmljs.parseXml(fs.readFileSync('PhoneNumberMetadata.xml'));
		xml.get('/phoneNumberMetadata/territories').childNodes().forEach(function(item) {
			if(item.name() !== 'territory') { return; }
			
			var territory = {
				id: item.attr('id').value(),
				countryCode: item.attr('countryCode').value(),
				types: {},
				phoneLength: null
			}
			_.each(phoneTypes, function(val) {
				var t = item.get(val+'/nationalNumberPattern');
				var e = item.get(val+'/exampleNumber');
				if(!t || !e) { return; }
				territory.types[val] = {
					regexp: new RegExp(t.text().replace(/[\s\n]/gm,'')),
					example: e.text()
				}
				if(!territory.phoneLength) // may be we should divide length to every pattern?
					territory.phoneLength = territory.types[val].example.length;
			});
			shema[territory.id] = territory;
		});
	})();

/*
 * Append numbers to code till full length
 */
	var padPhone = function(code, length, isMax) {
		if(code.length > length) { throw new Error('phone length should be lower than '+length); }
		return code + (new Array(length - code.length + 1).join(isMax?'9':'0'));
	}


/*
 * Try to find country id by number (or its part). First guess returned
 * return example: '123' => { id: 'US', code: '1', line: '23' } or undefined
 */
	var countryFromNumber = function(num) {
		if(typeof num == 'number') num = num.toString();
		var guess = [];
		_.each(shema, function(item) {
			if(item.countryCode === num.substring(0, item.countryCode.length)) {
				guess.push({
					id: item.id,
					code: item.countryCode,
					line: num.substring(item.countryCode.length)
				});
			}
		});
		if(!guess.length) { return; } // first pass - code not found
		if(guess.length === 1) { // only one found - ideal
			return guess[0];
		}
	
		return _.find(guess, function(item) {
			var ter = shema[item.id];
			return _.find(ter.types, function(type, key) {
				var testPhone = item.line + type.example.substring(item.line.length);
				return type.regexp.test(testPhone);
			});
		});
	}

	var isCodeInRange = function(code, range) {
		for(var i in range) {
			if(range[i].test(code)) {
				return true;
			}
		}
	}

/*
 * Return all available ranges for this partial number
 */
	var iterateFromCode = function(num) {
		var stat = countryFromNumber(num);
		if(!stat) { return; }
		var pat = shema[stat.country].types.regexp;
		console.log(stat);

		var recursiveIterate = function(code) {
			if(code.length >= stat.length) { return; }
			
			if(isCodeInRange(code, pat)) {
				console.log('found main code we can handle: %s', code);
				return;
			}
			for(var i=0; i<=9; i++) {
				var str = code.concat(i);
				if(!isCodeInRange(str, pat)) {
					recursiveIterate(str);
				} else {
					console.log('found code we can handle: %s', str);
				}
			}
		};

		recursiveIterate(num);
		// if(code.length >= MAX_LENGTH) { return; }
		// if(isCodeInRange(code)) {
		// 	console.log('found main code we can handle: %s', code);
		// 	return;
		// }
		// for(var i=0; i<=9; i++) {
		// 	var str = code.concat(i);
		// 	if(!isCodeInRange(str)) {
		// 		iterateFromCode(str);
		// 	} else {
		// 		console.log('found code we can handle: %s', str);
		// 	}
		// }
	}
/*
 * 
 */
	this.nextPhone = function() {

	}


/*
 * 
 */
	this.isPhoneValid = function(phone) {
		
	}


}


// var nextPhoneInCode = function(code) {
// 	if(!_codes[code]) {
// 		_codes[code] = {
// 			min: padPhone(code),
// 			max: padPhone(code, true)
// 		}
// 	}
// 	_codes[code].current = _codes[code].current ? ++_codes[code].current : _codes[code].min;
// 	if(_codes[code].current > _codes[code].max) {
// 		delete _codes[code];
// 		return;
// 	}
// 	return _codes[code].current;
// }
