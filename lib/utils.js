'use srtict';

var libxmljs = require('libxmljs');
var fs = require('fs');
var _ = require('lodash-node');

var schema;
var phoneTypes = ['fixedLine', 'mobile', 'personalNumber']; // phones we are iterested in

/*
 * Load country settings
 */
exports.loadSchema = function loadschema() {
	if(schema) return schema;
	schema = {};
	var xml = libxmljs.parseXml(fs.readFileSync('PhoneNumberMetadata.xml'));
	xml.get('/phoneNumberMetadata/territories').childNodes().forEach(function(item) {
		if(item.name() !== 'territory') { return; }
		
		var territory = {
			id: item.attr('id').value(),
			countryCode: item.attr('countryCode').value(),
			types: {},
			phoneLength: null
		}
		phoneTypes.forEach(function(val) {
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
		schema[territory.id] = territory;
	});
	return schema;
};

/*
 * Append numbers to code till full length
 */
exports.padPhone = function padPhone(code, length, isMax) {
	if(typeof code === 'number') code = code.toString();
	if(code.length > length) { throw new Error('phone length should be lower than '+length); }
	return code + (new Array(length - code.length + 1).join(isMax?'9':'0'));
};

/*
 * Test code against array of regexp
 */
exports.isCodeInRange = function isCodeInRange(code, range) {
	return !!_.find(range, function(v) {
		return v.test(code);
	});
};