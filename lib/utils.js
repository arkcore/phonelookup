'use strict';

var libxmljs;
try {
    libxmljs = require('libxmljs');
} catch (e) {}

var _ = require('lodash');
var schemaObj = {};
var phoneTypes = [ 'generalDesc', 'fixedLine', 'mobile', 'personalNumber', 'tollFree', 'premiumRate' ];
var _forOwn = _.forOwn;
var schema;

/**
 * Helper for creating regexps
 */
function format2pattern(v) {
    v.pattern = new RegExp(v.pattern);
    v.leadingDigits = new RegExp(v.leadingDigits);
}

try {
    schema = require('../PhoneNumberMetadata.json');

    // preprocess
    _forOwn(schema, function remapCountryFormats(country) {

        country.formats.forEach(format2pattern);

        _forOwn(country.types, function remapCountryTypeExpr(countryType) {
            countryType.expr = new RegExp(countryType.expr);
        });

    });

} catch (e) {
    // if we havent remapped XML
    console.error('Error preprocessing schema:', e);
}


/*
 * Load country settings
 * Provided the phone types it will copy references only to the ones specified
 */
exports.loadSchema = function loadSchema(_phoneTypes) {

    var types = Array.isArray(_phoneTypes) ? _phoneTypes.sort() : '_all_',
        typeStr = JSON.stringify(types);

    // use cache
    if (schemaObj[typeStr]) {
        return schemaObj[typeStr];
    }

    var removeUnwanted = types !== '_all_' && _.difference(phoneTypes, _phoneTypes).length > 0;
    var filteredSchema = {};

    _.forOwn(schema, function filterSchema(country, countryId) {
        var keep = 0;
        var filteredCountrySchema = _.omit(country, ['types']);

        // copy only types we want
        filteredCountrySchema.types = {};
        _.forOwn(country.types, function (countryType, type) {
            if (removeUnwanted && types.indexOf(type) === -1) {
                return;
            }

            keep++;
            filteredCountrySchema.types[type] = countryType;
        });

        if (removeUnwanted && keep === 0) {
            return;
        }

        filteredSchema[countryId] = filteredCountrySchema;
    });

    schemaObj[typeStr] = filteredSchema;

    return filteredSchema;
};

/**
 * Build function
 */
exports.xml2json = function xml2json() {
    if (!libxmljs) {
        throw new Error('libxmljs must be installed');
    }

    var fs = require('fs');
    var schema = {};
    var xml = libxmljs.parseXml(fs.readFileSync(__dirname + '/../PhoneNumberMetadata.xml'));
    xml.get('/phoneNumberMetadata/territories').childNodes().forEach(function(item) {
        if (item.name() !== 'territory') {
            return;
        }

        var formats = [];
        var items = item.get('availableFormats');
        if (items) {
            items.childNodes().forEach(function(item) {
                if (item.name() !== 'numberFormat' || item.attr('nationalPrefixFormattingRule')) {
                    return;
                }
                var ld = item.get('leadingDigits');
                var format = {
                    pattern: '^' + item.attr('pattern').value().trim().replace(/[\s\n]/gm, '') + '$',
                    format: item.get('format').text().trim()
                };
                if (ld) {
                    format.leadingDigits = '^' + ld.text().trim().replace(/[\s\n]/gm, '');
                }
                formats.push(format);
            });
        }
        var territory = {
            id: item.attr('id').value(),
            countryCode: item.attr('countryCode').value(),
            types: {},
            phoneLength: null,
            formats: formats
        };

        phoneTypes.forEach(function(val) {
            var t = item.get(val + '/nationalNumberPattern');
            var e = item.get(val + '/exampleNumber');
            if (!t || !e) {
                return;
            }
            territory.types[val] = {
                expr: t.text().replace(/[\s\n]/gm, ''),
                example: e.text()
            };
            if (!territory.phoneLength)  {// may be we should divide length to every pattern?
                territory.phoneLength = territory.types[val].example.length;
            }
        });

        schema[territory.id] = territory;
    });

    fs.writeFileSync(__dirname + '/../PhoneNumberMetadata.json', JSON.stringify(schema, null, ' '));
};

exports.isDec = function(num) {
    return /^\d+$/.test(num);
};

/*
 * Append numbers to code till full length
 */
exports.padPhone = function padPhone(code, length, isMax) {
    if (typeof code === 'number') {
        code = code.toString();
    }
    if (code.length > length) {
        throw new Error('phone length should be lower than ' + length);
    }
    return code + (new Array(length - code.length + 1).join(isMax ? '9' : '0'));
};

/*
 * Test code against array of regexp
 */
exports.isCodeInRange = function isCodeInRange(code, range) {
    return !!_.find(range, function(v) {
        return v.test(code);
    });
};

exports.replaceMaskArr = function replaceMaskArr(arr, mask) {
    arr.forEach(function(value, index) {
        mask = mask.replace('$' + index, value);
    });
    return mask;
};
