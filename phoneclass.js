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
					expr: new RegExp(t.text().replace(/[\s\n]/gm,'')),
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
		if(typeof code == 'number') code = code.toString();
		if(code.length > length) { throw new Error('phone length should be lower than '+length); }
		return code + (new Array(length - code.length + 1).join(isMax?'9':'0'));
	}


/*
 * Try to find country id by number (or its part). First guess returned
 * return example: '123' => { id: 'US', code: '1', line: '23'} or undefined
 */
	var countryFromNumber = function(num) {
		if(typeof num == 'number') num = num.toString();
		var guess = [];
		_.each(shema, function(v) {
			if(v.countryCode === num.substring(0, v.countryCode.length)) {
				guess.push({
					id: v.id,
					code: v.countryCode,
					line: num.substring(v.countryCode.length)
				});
			}
		});
		if(!guess.length) { return; } // first pass - code not found
		/*
		 * 2do: fix: countryFromNumber(781) - success, countryFromNumber(78) - fail
		 */
		return _.find(guess, function(v) {
			var ter = shema[v.id];
			return _.find(ter.types, function(type, key) {
				if(type.expr.test(v.line + type.example.substring(v.line.length))) {
					v.type = type;
					return true;
				}
			});
		});
	}


	var isCodeInRange = function(code, range) {
		return !!_.find(range, function(v) {
			return v.test(code);
		})
	}

/*
 * Return all available ranges for this partial number
 */
	// var iterateFromCode = function(num, cb) { // cb(err, nextPhone)
	// 	if(typeof num == 'number') num = num.toString();
	// 	var info = countryFromNumber(num);
	// 	if(!info) { return; }
	// 	var _pat = _.pluck(shema[info.id].types, 'expr');

	// 	var recursiveIterate = function recursiveIterate(code) {
	// 		if(code.length >= info.length) { return; }
			
	// 		if(isCodeInRange(code, _pat)) {
	// 			console.log('found main code we can handle: %s', code);
	// 			return;
	// 		}
	// 		for(var i=0; i<=9; i++) {
	// 			var str = code.concat(i);
	// 			if(!isCodeInRange(str, _pat)) {
	// 				recursiveIterate(str);
	// 			} else {
	// 				console.log('found code we can handle: %s', str);
	// 			}
	// 		}
	// 	};
	// 	recursiveIterate(num);
	// }

	this.Iterator = function Iterator(_start, _current) {
		var _start = parseInt(_start);
		var _current = parseInt(_current);

		var country = countryFromNumber(_start);
		if(!country) throw new Error('no country found for code '+_start);
		var _pat = _.pluck(shema[country.id].types, 'expr');
		var length = country.type.example.length;
		var opt = {
			start: parseInt(country.code + padPhone(country.line, length)),
			end: parseInt(country.code + padPhone(country.line, length, true))
		}
		var current = _current ? _current : opt.start - 1;

		this.getNext = function() {
			if(current >= opt.end) return;
			current++;
			if(!(current % 10)) { // test block, if wrong - switch to next
				if(!isCodeInRange(current, _pat)) {
					/*
					* 2do: test
					*/
					current += 9;
					return this.getNext();
				}

			}
			return current;
		}
	}

/*
 * convert number to international format
 */
	this.formatPhone = function() {

	}


/*
 * return 'true' if phone 'can' exist
 */
	this.isPhoneValid = function(phone) {
		var info = countryFromNumber(phone);
		return info && phone.length === (info.type.example.length + info.code.length);
	}


}
