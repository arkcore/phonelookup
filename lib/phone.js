'use srtict';

var _ = require('lodash-node');
var utils = require('./utils');

function Phone() {
	var _this = this;
	this.schema = utils.loadSchema();

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
				line: num.substring(v.countryCode.length)
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
Phone.prototype.phoneFormat = function() {
	throw new Error('phoneFormat not implemented yet');
};

/*
 * return 'true' if phone 'can' exist
 */
Phone.prototype.isPhoneValid = function(phone) {
	var info = this.countryFromNumber(phone);
	return info && phone.length === (info.type.example.length + info.code.length);
};

module.exports = Phone;
