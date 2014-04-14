'use srtict';

var Phone = require('./phoneclass').PhoneClass;

var phone = new Phone;
var iterator = new phone.Iterator('78182')
// var iterator2 = new phone.Iterator('11')
console.log(iterator.getNext())
console.log(iterator.getNext())