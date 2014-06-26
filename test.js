'use srtict';

var utils = require('./lib/utils');

var Phone = require('./');

var test = new Phone();
// console.log(range);

// var phone = new Phone;
// var iterator = new phone.Iterator('78182')
// // var iterator2 = new phone.Iterator('11')
// console.log(iterator.getNext())
// console.log(iterator.getNext())
// var it = new test.Iterator('1');

// var phone = test.format('+7921-241906a:)');
var before = '+1 212 CALL NOW';
var after = test.normalize(before);

console.log('before: %s, after: %s', before, after);

console.log(test.isValid(after));

// isPhoneValid
// formatPhone
