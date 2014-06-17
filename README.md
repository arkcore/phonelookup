phone-lookup
============

phone range generation, per country validation and lookup for links to social profiles


*Usage quick examples:*

```
var Phone = require('phone-lookup');

var test = new Phone;

// iterate over range finding all phones can exist
var it = new phone.Iterator('78182')
console.log(iterator.getNext())
console.log(iterator.getNext())

// test if phone valid (correct format for country, available in number plans for country)
test.isPhoneValid('+14857384959335')

// try to convert phone number to international format
test.formatPhone('8-800-CALL NOW'); // ex.: +8-800-1212-323
```