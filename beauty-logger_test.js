const path = require("path")
const BeautyLogger = require("./beauty-logger");
const logger = new BeautyLogger({
	logFileSize: 1024 * 1024 * 5,
	logFilePath: path.join(__dirname + "/server.log"),
	dataTypeWarn: true
})

const str = "this is string";
const num = 0;
const bool = false;
const empty = null;
const undefined1 = undefined;
const func = function (a, b) {
	let sum = a + b;
	return sum;
};
const arr1 = [1, 5, 6];
const arr2 = [2, 7, arr1]
const obj1 = {
	"g": 1,
	"h": {
		"i": 'undefined'
	}
}
const obj = {
	"a": {
		"e": {
			"f": func
		}
	},
	"b": arr2,
	"c": {
		"D": obj1
	}
};
const arr = [obj, func, arr2];
const fun = obj.a.e.f(1,2)
const symbol = Symbol('symbol')
const set = new Set(arr2)
const map = new Map([['title','hello world'],['year','2020']]);

//single parameter test case
{
	logger.debug(str);
	logger.debug(num);
	logger.info(bool);
	logger.info(empty);
	logger.warn(arr);
	logger.warn(obj);
	logger.error(undefined1);
	logger.error(func);
	logger.info(fun)
	logger.info(symbol)
	logger.info(set)
	logger.info(map)

	console.log("\r\n\r\n------------------Amazing line-------------------------");
	// these can't be print to log file
	console.debug(str);
	console.debug(num);
	console.info(bool);
	console.info(empty);
	console.warn(arr);
	console.warn(obj);
	console.error(undefined1);
	console.error(func);
}


//double parameter test case
{
	console.log("*********************Double parameter test case***************************************");
	logger.debug("str", str);
	logger.debug("num", num);
	logger.info("bool", bool);
	logger.info("null", empty);
	logger.warn("arr", arr);
	logger.warn("obj", obj);
	logger.error("undefined", undefined1);
	logger.error("func", func);
	logger.info("fun", fun)
	logger.info("symbol", symbol)
	logger.info("set", set)
	logger.info("map", map)

	console.log("\r\n\r\n------------------Amazing line-------------------------");
	// these can't be print to log file
	console.debug("str", str);
	console.debug("num", num);
	console.info("bool", bool);
	console.info("empty", empty);
	console.warn("arr", arr);
	console.warn("obj", obj);
	console.error("undefined", undefined1);
	console.error("func", func);
}
