'use strict';

var _ = require('lodash');
var utils = require('./utils');
var Errors = require('node-common-errors');

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

function generateRandomNumber (route) {
    var number = route.example,
        phone, l = number.length,
        expr = route.expr;

    // mutate sample number
    for (var i = l; i > 0; i--) {
        number = number.substr(0, i - 1) + _.random(0, 9) + number.substr(i);
        if (!expr.test(number)) {
            break;
        }

        phone = number;
    }

    return { number: route.countryCode + phone, depth: l - i };
}

function Phone(phoneTypes) {
    this.schema = utils.loadSchema(phoneTypes);
}

Phone.prototype.getSuitableRoutes = function (num, numParts) {

    if (/^\d+$/.test(num)) { // number, like '1'
        return _.filter(this.schema, function (country) {
            return country.countryCode === numParts[country.countryCodeLength];
        });
    }

    var countryData = this.schema[num];
    return countryData ? [countryData] : [];
};

Phone.prototype.isIdValid = function (countryId) {
    return !!this.schema[countryId];
};

/**
 * Accepts phone number in a free-form format and a country-code
 * Returns multiple possible token expansion
 * @param {String} phone
 * @param {String} country - defaults to detecting ourselves based on the passed prefix
 */
Phone.prototype.phoneTokensByCountry = function (phone, country) {
    // normalize
    if (!country) {
        return this.info(phone, true);
    }

    country = country && country.toUpperCase();
    if (!this.isIdValid(country)) {
        throw new Errors.BadRequest('Passed country id is unsupported: ' + country || '_empty_');
    }

    var route = this.schema[country];
    var countryCode = route.countryCode;
    var countryCodeLength = route.countryCodeLength;
    var num = this.normalize(phone);
    var expansions = [num];

    if (!num) {
        throw new Errors.BadRequest('Passed string didnt contain any numbers');
    }

    var potentialCountryCode = num.substr(0, countryCodeLength);
    var line = num;

    if (potentialCountryCode === countryCode) {
        line = num.substring(countryCodeLength);
    } else {
        num = countryCode + line;
    }

    _.each(route.types, function (typeData) {
        var expr = typeData.expr;
        if (!expr.test(line) && !expr.test(num)) {
            return;
        }

        expansions.push(num, line);
    });

    // make sure tokens are unique
    return _.uniq(expansions);
};

/*
 * Try to find info by number (or its part).
 * return sample: { id: 'US', phone: '18773975248', code: '1', line: '8773975248',
 *   type: 'tollFree', format: '+1 (877) 397-5248' }
 */
Phone.prototype.info = function (phone, returnExpansions) {
    var num = this.normalize(phone);
    if (!num) {
        return;
    }

    var numParts = {
        1: num[0],
        2: num.substr(0, 2),
        3: num.substr(0, 3)
    };

    var guess = this.getSuitableRoutes(num, numParts);
    if (!guess.length) {
        return;
    }

    var guess2 = [];
    var numEndings = {
        1: num.substring(1),
        2: num.substring(2),
        3: num.substring(3)
    };

    _.each(guess, function processGuess(item) {
        var line = numEndings[item.countryCodeLength];

        _.each(item.types, function compareItem(v, k) {
            var found = v.expr.test(line);

            if (!found) {
                return;
            }

            if(line.length !== item.phoneLength) {
                // this cant be our phone anyway
                // except germany - there are strange rules
                if(item.id !== 'DE') {
                    return;
                }
            }

            var result = {
                id: item.id,
                phone: num,
                code: item.countryCode,
                line: line,
                type: k,
                format: _.find(item.formats, function (v) {
                    return v.pattern.test(line);
                })
            };

            guess2.push(result);
        });

    });

    if (returnExpansions) {
        if (guess2.length === 0) {
            return [ num ];
        }

        var expansions = {};
        expansions[num] = true;
        guess2.forEach(function (item) {
            expansions[item.phone] = true;
            expansions[item.line] = true;
        });

        return _.keys(expansions);
    }

    // one item found or no item found
    if (guess2.length <= 1) {
        return this._format(guess2[0]);
    }

    // more than one item found - similar numbers or incorrect schema
    // lets find one with format
    // FIXME: add option to return multiple guesses
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
Phone.prototype.normalize = function (phone) {
    phone = phone.toString();
    if (phone % 1 !== 0) { // if is not numeric - replace alphas
        phone = phone.replace(/^\D*/, '').replace(VALID_ALPHA_PATTERN, function(v) {
            return (E161[v.toLowerCase()] || '0').toString();
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
Phone.prototype.random = function(code, steps) {

    var guess = this.getSuitableRoutes(code);
    if (!guess.length) {
        return;
    }

    var routes = []; // search routes with examples
    _.each(guess, function (country) {
        _.each(country.types, function (route) {
            if (route.example) {
                route.countryCode = country.countryCode;
                routes.push(route);
            }
        });
    });
    // routes = _.shuffle(routes);

    var maxDepth = 0, number,
        _steps = steps || 30;

    while (routes.length && _steps--) {
        var rand = generateRandomNumber(_.sample(routes));
        if (rand.depth > maxDepth) {
            number = rand.number;
        }
    }

    return number;
};

module.exports = Phone;
