'use strict';

var libxmljs;
try {
    libxmljs = require('libxmljs');
} catch (e) {

}


var fs = require('fs');
var _ = require('lodash');

var schemaObj = {};
var phoneTypes = ['generalDesc', 'fixedLine', 'mobile', 'personalNumber', 'tollFree', 'premiumRate'];

/*
 * Load country settings
 */
exports.loadSchema = function loadSchema(_phoneTypes) {

    var types = _phoneTypes && _phoneTypes.length ? _phoneTypes : [],
        typeStr = JSON.stringify(types);
    if (!_.isEmpty(schemaObj[typeStr])) { return schemaObj[typeStr]; }
    var schema = require(__dirname +'/../PhoneNumberMetadata.json');

    var countryID, type, keep = 0, removeUnwanted = !!types.length;
    var format2pattern = function (v) {
        v.pattern = new RegExp(v.pattern);
        v.leadingDigits = new RegExp(v.leadingDigits);
    };
    for (countryID in schema) {
        var country = schema[countryID];
        // convert formats to regexp
        country.formats.map(format2pattern);
        // convert types to regexp
        var cTypes = country.types;
        for (type in cTypes) {
            cTypes[type].expr = new RegExp(cTypes[type].expr);
            if(removeUnwanted) {
                if(types.indexOf(type) !== -1) {
                    keep++;
                } else {
                    delete cTypes[type];
                }
            }
        }
        if(removeUnwanted && !keep) {
            delete schema[countryID];
        }
    }

    schemaObj[typeStr] = schema;
    return schema;
};

exports.xml2json = function xml2json() {
    if (!libxmljs) {
        throw new Error('libxmljs must be installed');
    }

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
    require('fs').writeFileSync(__dirname + '/../PhoneNumberMetadata.json', JSON.stringify(schema, null, ' '));
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
