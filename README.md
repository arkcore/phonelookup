phone-lookup
============

phone range generation, per country validation and lookup for links to social profiles
#### Warning: this library is not tested, use at own risk


```
var Phone = require('phone-lookup');

var phone = new Phone;

// iterate over range finding all phones can exist
var it = new phone.Iterator('78182')
console.log(iterator.getNext())
console.log(iterator.getNext())

var testPhone = '+1 212 CALL NOW';

// remove all non digit chars from phone and replace alphas by digits
var normalizedPhone = phone.normalize(testPhone);
console.log(normalizedPhone); // 12122255669

// test if phone valid for contry (quick test by phone length only)
phone.isValid(testPhone); // false
phone.isValid(normalizedPhone); // true


// convert number to international format, 'undefined' on fail
phone.format(testPhone); // +1 (212) 225-5669
phone.format(normalizedPhone); // +1 (212) 225-5669
```