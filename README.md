phone-lookup
============

**Phone validation and number formatting library** based on [google libphonenumber](https://github.com/googlei18n/libphonenumber)


#### Install
```
# npm install phonelookup
```

### Usage examples
Validate phone and get info
```
var Phone = require('phonelookup');

// valid phone types by default:  ['generalDesc', 'fixedLine', 'mobile', 'personalNumber', 'tollFree', 'premiumRate'];;

// you can test only mobiles and home numbers for example:
// var phone = new Phone(['fixedLine', 'mobile']);

var phone = new Phone();
var testPhone = '+1 212 CALL NOW';

// remove all non digit chars from phone and replace alphas by digits
var normalizedPhone = phone.normalize(testPhone);
console.log(normalizedPhone); // 12122255669

// generate random phone for specified country code
var randomPhone = phone.random('US');
console.log(randomPhone); // 15809280360

// get phone info (or 'undefined' for invalid phone)
var info = phone.info(testPhone);
console.log(info);
/*
{ id: 'US',
  phone: '12122255669',
  code: '1',
  line: '2122255669',
  type: 'fixedLine',
  format: '+1 (212) 225-5669' }
*/

//
```
