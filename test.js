'use srtict';

var utils = require('./lib/utils');

var Phone = require('./');

var test = new Phone();
var phones = [
  '+3 (093) 004-07-44'
];

phones.forEach(function(p) {
  var i = test.info(p);
  console.log(i);
});
