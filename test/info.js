// jshint ignore: start

'use strict';
var chai = require('chai');
chai.Should();

var expect = chai.expect;
var Phone = require('../');
var _ = require('lodash');

var testPhones = {
	'+78182653320': ['+7 818 265-33-20', 'fixedLine', 'RU', '8182653320'],
	'+79009113400': ['+7 900 911-34-00', 'mobile', 'RU', '9009113400'],
	'18773975248': ['+1 (877) 397-5248', 'tollFree', 'US', '8773975248'],
	'+1-541-754-3010': ['+1 (541) 754-3010', 'fixedLine', 'US', '5417543010'],
	'+49-89-636-48018': ['+49 89 63648018', 'fixedLine', 'DE', '8963648018'],
	'+1 212 CALL NOW': ['+1 (212) 225-5669', 'fixedLine', 'US', '2122255669']
};

var input = {
	'CA': {
		'whatthefuck6044400819': ['16044400819', '6044400819']
	},
	'US': {
		'+1 (415) 747-2692': ['14157472692', '4157472692']
	}
};

describe('test phone.js:', function () {

	it('info should return correct values', function() {

		var lib = new Phone();
		for(var phone in testPhones) {
			var result = testPhones[phone];
			var info = lib.info(phone);
			info.format.should.equal(result[0]);
			info.type.should.equal(result[1]);
			info.id.should.equal(result[2]);
			info.line.should.equal(result[3]);
		}
	});

	it('should be able to generate correct tokens for free-form phone numbers', function () {
		var lib = new Phone();
		_.each(input, function (numbers, countryCode) {
			_.each(numbers, function (expectedTokens, inputString) {
				var tokens = lib.phoneTokensByCountry(inputString, countryCode);
				expect(tokens.sort()).to.deep.eq(expectedTokens.sort());
			});
		});
	});

	it('generate 1k not similar random US phones', function() {

		var exists = {},
			lib = new Phone();
		for(var i=0; i < 1000; i++) {
			var phone = lib.random('US');
			if(!phone) {
				throw new Error('empty number returned');
			}
			if(exists[phone]) {
				throw new Error('found existing phone');
			}
			var info = lib.info(phone);
			if(!info || info.id !== 'US') {
				throw new Error('wrong phone info: ' + JSON.stringify(info));
			}
			exists[phone] = true;
		}
	});

});
