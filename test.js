'use srtict';

var utils = require('./lib/utils');

var Phone = require('./');

var test = new Phone();
var phones = [
  '+1 212 CALL NOW'
];

phones.forEach(function(p) {
  var i = test.info(p);
  console.log(i);
});
