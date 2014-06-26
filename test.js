'use srtict';

var utils = require('./lib/utils');

var Phone = require('./');

var test = new Phone();
var phones = [
  '+78182653320',
  '+79009113400',
  '18773975248',
  '+1-541-754-3010',
  '+49-89-636-48018'
];

phones.forEach(function(p) {
  console.log('%s => %s (%s, %s)', p, i.format, i.type, i.id);
});
