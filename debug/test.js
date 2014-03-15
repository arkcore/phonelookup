'use srtict';


var LINE_FIXED 		= 1,
	LINE_MOBILE 	= 2,
	LINE_PERSONAL 	= 4;

var LINE_ALL		= LINE_FIXED + LINE_MOBILE + LINE_PERSONAL;

var MAX_LENGTH		= 9;



var expr = {};
// expr[LINE_FIXED] = new RegExp('^2(0[1-35-9]|1[02-9]|2[4589]|3[149]|4[08]|5[1-46]|6[0279]|7[026]|8[13])|3(0[1-57-9]|1[02-9]|2[0135]|3[014679]|47|5[12]|6[014]|8[056])|4(0[124-9]|1[02-579]|2[3-5]|3[0245]|4[0235]|58|69|7[0589]|8[04])|5(0[1-57-9]|1[0235-8]|20|3[0149]|4[01]|5[19]|6[1-37]|7[013-5]|8[056])|6(0[1-35-9]|1[024-9]|2[036]|3[016]|4[16]|5[017]|6[0-279]|78|8[12])|7(0[1-46-8]|1[02-9]|2[0457]|3[1247]|4[07]|5[47]|6[02359]|7[02-59]|8[156])|8(0[1-68]|1[02-8]|28|3[0-25]|4[3578]|5[06-9]|6[02-5]|7[028])|9(0[1346-9]|1[02-9]|2[0589]|3[1678]|4[0179]|5[1246]|7[0-3589]|8[0459])');
expr[LINE_FIXED] = new RegExp('^111[2-9][1-2]');


var isCodeInRange = function(str) {
	for(var i in expr) {
		if(expr[i].test(str)) {
			// ranges.push(str);
			return true;
		}
	}
};

/*
 * Return all available ranges for this partial number
 *
 */
var iterateFromCode = function(num) {
	if(num.length >= MAX_LENGTH) { return; }
	if(isCodeInRange(num)) {
		console.log('found main code we can handle: %s', num);
		return;
	}

	for(var i=0; i<=9; i++) {
		var str = num.concat(i);
		if(!isCodeInRange(str)) {
			iterateFromCode(str);
		} else {
			console.log('found code we can handle: %s', str);
		}
	}
}

iterateFromCode('11122');
// iterateFromCode('102294691');