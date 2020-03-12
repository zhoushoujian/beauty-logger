# beauty-logger
A beautiful logger system for both nodejs and browser

# Usage
```shell
const path = require("path")  
const Logger = require("beauty-logger");  
const logger = new Logger({  
	logFileSize: 1024 * 1024 * 5,  //default: 10MB 
	logFilePath: {  // default: as follows
		info: path.join(__dirname, "./ino.log"),
		warn: path.join(__dirname, "./warn.log"),
		error: path.join(__dirname, "./error.log"),
	}, 
	dataTypeWarn: true //default: false
	productionModel: false // default: false
	enableMultipleLogFile: true // default: true
})  
logger.info("logger", "string")  // [2020-2-2 22:13:54.551]  [INFO]  logger [ext] string
console.log("logger", logger)
```

# Test
```shell
npm run test  
```

# Functions
1. Support user define the slice of log file size and log file path.  
2. Only logger.debug doesn't log to file, all of them can be print in console.  
3. Only identify 999 levels in input value which contains object or array.  
4. Support to print part of req and res(big object) in nodejs  
5. Data type includes Number, String, Undefined, Null, Boolean, Object, Array, Function, Error, Set, Map and Symbol can be support stringify. If something can't be stringify, it will be print data type, such as DOM element, it will print '[object HTMLDivElement]'  
6. Although we support print Function, Set, Map and Symbol directly, we still don't recommend to print it without any transfer, and it will give a warn to remind you if you set dataTypeWarn to be true.  
7. Enable productionModel will not print log to console, it will be fast for program in production environment.
8. In default, it will log file by log level and it will log into multiple different kinds of files, if set enableMultipleLogFile to false, beauty-logger will print all logs to one file, at the same time, you should specify logFilePath as a path string.
9. Support new multiple beauty-logger inshance to log different files.
10. All of logger method support Promise chain call

# Preview pictures
[![log_example_1](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_2.png)](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_1.png)  
[![log_example_2](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_2.png)](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_2.png)  
[![log_req](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_req.png)](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_req.png)  
[![log_res](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_res.png)](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_res.png)  

# License
[MIT](https://github.com/zhoushoujian/beauty-logger/blob/master/LICENSE)  
