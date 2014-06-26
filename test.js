'use srtict';

var utils = require('./lib/utils');

var Phone = require('./');

var test = new Phone();
// var cfn = test.countryFromNumber(18773975248);
var ph = '+18.773975248';
// var ph = '+78182-613101';
console.log('result:', test.countryFromNumber(ph));
// console.log('formatted =', test.format(ph));
// process.exit();
// console.log('valid =', test.isValid(ph));
