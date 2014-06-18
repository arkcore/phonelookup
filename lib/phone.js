'use srtict';

var _ = require('lodash-node');
var utils = require('./utils');

var E161 = {
	'a': 2, 'b': 2, 'c': 2,
	'd': 3, 'e': 3, 'f': 3,
	'g': 4, 'h': 4, 'i': 4,
	'j': 5, 'k': 5, 'l': 5,
	'm': 6, 'n': 6, 'o': 6,
	'p': 7, 'q': 7, 'r': 7, 's': 7,
	't': 8, 'u': 8, 'v': 8,
	'w': 9, 'x': 9, 'y': 9, 'z': 9
};

var UNICODE_DIGITS = /[\uFF10-\uFF19\u0660-\u0669\u06F0-\u06F9]/g;
var VALID_ALPHA_PATTERN = /[a-zA-Z]/g;

function Phone(phoneTypes) {
	var _this = this;
	this.schema = utils.loadSchema(phoneTypes);

	this.Iterator = function Iterator(_start, _current) {
		var _start = parseInt(_start);
		var _current = parseInt(_current);

		var country = _this._countryFromNumber(_start);
		if(!country) throw new Error('no country found for code '+_start);
		var _pat = _.pluck(_this.schema[country.id].types, 'expr');
		var length = country.type.example.length;
		var opt = {
			start: parseInt(country.code + utils.padPhone(country.line, length)),
			end: parseInt(country.code + utils.padPhone(country.line, length, true))
		}
		var current = _current ? _current : opt.start - 1;

		this.getNext = function() {
			if(current >= opt.end) return;
			current++;
			if(!(current % 10)) { // test block, if wrong - switch to next
				if(!utils.isCodeInRange(current, _pat)) {
				/*
				/* 2do: fix "Maximum call stack size exceeded" => make async
				*/
					current += 9;
					return this.getNext();
				}
			}
		};
	};
};

/*
 * Try to find country id by number (or its part). First guess returned
 * return example: '123' => { id: 'US', code: '1', line: '23'} or undefined
 */
Phone.prototype._countryFromNumber = function(num) {
	var _this = this;
	if(typeof num == 'number') num = num.toString();
	var guess = [];
	_.each(this.schema, function(v) {
		if(v.countryCode === num.substring(0, v.countryCode.length)) {
			guess.push({
				id: v.id,
				code: v.countryCode,
				line: num.substring(v.countryCode.length),
				formats: v.formats
			});
		}
	});
	if(!guess.length) { return; } // first pass - code not found
	/*
	 * 2do: fix: countryFromNumber(781) - success, countryFromNumber(78) - fail
	 */
	return _.find(guess, function(v) {
		var ter = _this.schema[v.id];
		return _.find(ter.types, function(type, key) {
			if(type.expr.test(v.line + type.example.substring(v.line.length))) {
				v.type = type;
				return true;
			}
		});
	});
};



/*
 * convert number to international format
 */
Phone.prototype.format = function(phone) {
	phone = this.normalize(phone);
	var info = this._countryFromNumber(phone);
	if(!info) return undefined;
	var line = info.line;
	var format;
	info.formats.forEach(function(v) {
		if(v.leadingDigits && !v.leadingDigits.test(line)) return
		if(!v.pattern.test(line)) return
		format = utils.replaceMaskArr(v.pattern.exec(line), v.format);
	});
	return format ? '+'+info.code+' '+format : undefined;
};

/*
 * return 'true' if phone 'can' exist (by length)
 */
Phone.prototype.isValid = function(phone) {
	var info = this._countryFromNumber(phone);
	return info && phone.length === (info.type.example.length + info.code.length) ? true : false;
};
/*
 * convert string to phone
 */
Phone.prototype.normalize = function(phone) {
	phone = phone.toString();
	if(phone % 1 !== 0) { // if is not numeric - replace alphas
		phone = phone.replace(VALID_ALPHA_PATTERN, function(v) {
			return String(E161[v.toLowerCase()] || 0);
		});
	}
	phone = phone.replace(/\D/g,''); // remove all not numbers from string
	return phone;
};

module.exports = Phone;
