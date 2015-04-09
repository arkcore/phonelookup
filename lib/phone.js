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
}

Phone.prototype.getSuitableRoutes = function(num) {

    if(parseInt(num)) { // number, like '1'
        return _.filter(this.schema, function(v) {
            return v.countryCode === num.substring(0, v.countryCode.length);
        });
    }

    // code, like 'US'
    return _.filter(this.schema, function(v) {
        return v.id === num;
    });

};

/*
 * Try to find info by number (or its part).
 * return sample: { id: 'US', phone: '18773975248', code: '1', line: '8773975248',
 *   type: 'tollFree', format: '+1 (877) 397-5248' }
 */
Phone.prototype.info = function(phone) {
    var num = this.normalize(phone);
    if (!num) { return; }

    var guess = this.getSuitableRoutes(num);
    if (!guess.length) { return; }

    var guess2 = [];
    _.each(guess, function(item) {
        var line = num.substring(item.countryCode.length);
        _.each(item.types, function(v, k) {
            var found = v.expr.test(line);
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

/**
 * Return random phone for specified country code
 *
 * @param {string}  country code in format '+1' or '1'
 */
Phone.prototype.random = function(code) {

    var guess = this.getSuitableRoutes(code);
    if (!guess.length) { return; }

    var routes = []; // search routes with examples
    _.each(guess, function (country) {
        _.each(country.types, function (route) {
            if(route.example) {
                route.countryCode = country.countryCode;
                routes.push(route);
            }
        });
    });
    routes = _.shuffle(routes);

    function generateRandomNumber () {
        var route = routes.shift(),
            number = route.example,
            expr = route.expr;

        // mutate sample number
        for(var i = number.length; i > 0; i--) {
            number = number.substr(0, i - 1) + _.random(0, 9) + number.substr(i);
            if(!expr.test(number)) { break; }
        }
        return { number: route.countryCode + number, depth: i };
    }

    var maxDepth = 0, number, steps = 10;

    while(routes.length && --steps) {
        var rand = generateRandomNumber();
        if(rand.depth > maxDepth) {
            number = rand.number;
        }
    }
    return number;
};

module.exports = Phone;
