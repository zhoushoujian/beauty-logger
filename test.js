const func = function(a,b){
	let sum = a+b;
	return sum; 
};
const arr = [5,6]
const arr1=[1,5,6,arr];
const arr2 = [2,7,arr1]
const obj1 = {
	"g":1,
	"h":{
		"i":1
	}
}
const obj = {
	"a":{
		"e":{
			"f":func
		}
	},
	"b":arr2,
	"c":{
		"D":obj1
	}
};
console.warn(obj);
var log4js = require('log4js');
log4js.configure({
  appenders: {
    out: { type: 'stdout' },//设置是否在控制台打印日志
    info: { type: 'file', filename: './logs/info.log' }
  },
  categories: {
    default: { appenders: [ 'out', 'info' ], level: 'info' }//去掉'out'。控制台不打印日志
  }
});
var logger = log4js.getLogger();
logger.level = 'info'; // default level is OFF - which means no logs at all.
logger.info("Some debug messages",obj);
