'use strict';

var _ = require('lodash');
var utils = require('./utils');

var E161 = {
    'a': 2,
    'b': 2,
    'c': 2,
    'd': 3,
    'e': 3,
    'f': 3,
    'g': 4,
    'h': 4,
    'i': 4,
    'j': 5,
    'k': 5,
    'l': 5,
    'm': 6,
    'n': 6,
    'o': 6,
    'p': 7,
    'q': 7,
    'r': 7,
    's': 7,
    't': 8,
    'u': 8,
    'v': 8,
    'w': 9,
    'x': 9,
    'y': 9,
    'z': 9
};

var VALID_ALPHA_PATTERN = /[a-zA-Z]/g;

function Phone(phoneTypes) {
    this.schema = utils.loadSchema(phoneTypes);

    /*
     * 2do: test and fix: countryFromNumber(781) - success, countryFromNumber(78) - fail
     */
    this.Iterator = function Iterator(/*_start, _current*/) {
        throw new Error('deprecated, in testing atm');
        // _start = parseInt(_start);
        // _current = parseInt(_current);
        //
        // var country = _this._countryFromNumber(_start, true);
        // if(!country) throw new Error('no country found for code '+_start);
        // var _pat = _.pluck(_this.schema[country.id].types, 'expr');
        // var length = country.type.example.length;
        // var opt = {
        // 	start: parseInt(country.code + utils.padPhone(country.line, length)),
        // 	end: parseInt(country.code + utils.padPhone(country.line, length, true))
        // };
        // var current = _current ? _current : opt.start - 1;
        //
        // this.getNext = function() {
        // 	if(current >= opt.end) return;
        // 	current++;
        // 	if(current % 10 === 0) { // test block, if wrong - switch to next
        // 		if(!utils.isCodeInRange(current, _pat)) {
        // 		/*
        // 		/* 2do: fix "Maximum call stack size exceeded" => make async
        // 		*/
        // 			current += 9;
        // 			return this.getNext();
        // 		}
        // 	}
        // };
    };
}

/*
 * Try to find info by number (or its part).
 * return sample: { id: 'US', phone: '18773975248', code: '1', line: '8773975248',
 *   type: 'tollFree', format: '+1 (877) 397-5248' }
 */
Phone.prototype.info = function(phone, smooth) {
    var num = this.normalize(phone);
    if (!num) { return; }

    var guess = _.filter(this.schema, function(v) {
        return v.countryCode === num.substring(0, v.countryCode.length);
    });
    if (!guess.length) { return; }

    var guess2 = [];
    _.each(guess, function(item) {
        var line = num.substring(item.countryCode.length);
        // console.log('phone: %s, code: %s', num, item.countryCode);
        _.each(item.types, function(v, k) {
            // console.log('test %s against %s (%s), result: %s', line, v.expr, k, v.expr.test(line));
            var found = v.expr.test(
                smooth ? line + v.example.substring(num.length) : line
            );
            if (!found) { return; }
            var result = {
                id: item.id,
                phone: num,
                code: item.countryCode,
                line: line,
                type: k,
                format: _.find(item.formats, function(v) {
                    return v.pattern.test(line);
                })
            };
            guess2.push(result);
        });
    });

    // one item found or no item found
    if (guess2.length <= 1) {
        return this._format(guess2[0]);
    }
    // more than one item found - similar numbers or incorrect schema
    // lets find one with format
    var ret = _.find(guess2, 'format');
    return this._format(ret ? ret : guess2[0]);
};

Phone.prototype._format = function(cfn) {
    if (cfn && cfn.format) {
        var formatted = utils.replaceMaskArr(
            cfn.format.pattern.exec(cfn.line), cfn.format.format
        );
        cfn.format = formatted ? '+' + cfn.code + ' ' + formatted : undefined;
    }
    return cfn;
};

/*
 * return 'true' if phone 'can' exist (by length)
 */
// Phone.prototype.isValid = function(phone) {
// 	if(!utils.isDec(phone))
// 		phone = this.normalize(phone);
//
// 	var info = this._countryFromNumber(phone);
// 	return info && phone.length === (info.type.example.length + info.code.length) ? true : false;
// };

/*
 * convert string to phone
 */
Phone.prototype.normalize = function(phone) {
    phone = phone.toString();
    if (phone % 1 !== 0) { // if is not numeric - replace alphas
        phone = phone.replace(VALID_ALPHA_PATTERN, function(v) {
            return String(E161[v.toLowerCase()] || 0);
        });
    }
    phone = phone.replace(/\D/g, ''); // remove all not numbers from string
    return phone;
};

module.exports = Phone;
