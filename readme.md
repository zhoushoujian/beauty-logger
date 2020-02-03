# light-logger
A light logger system for both nodejs and browser

# Usage
```shell
const path = require("path")  
const LightLogger = require("light-logger");  
const logger = new LightLogger({  
	logFileSize: 1024 * 1024 * 5,  
	logFilePath: path.join(__dirname + "/server.log")  
})  
logger.info("logger", "string")  // [2020-2-2 22:13:54.551]  [INFO]  logger [ext] string
```

# Test
```shell
npm run test  
```

# Functions
1. Support user define the slice of log file size and log file path.  
2. Only modify the prototype of console.debug, console.info, console.warn and console.error.  
3. Only logger.debug doesn't log to file, all if them can be print in console.  
4. Only identify 999 levels in input value which contains object or array.  
5. Support to print part of req and res in nodejs  
6. Data type includes Number, String, Undefined, Null, Boolean, Object, Array, Function, Error, Set, Map and Symbol can be support stringify. If something can't be stringify, it will be print data type, such as DOM element, it will print '[object HTMLDivElement]'  
7. Although we support print Function, Set, Map and Symbol directly, we still don't recommend to print it without any transfer, and it will give a warn to remind you.  

# Preview pictures
![log_example_1](https://github.com/zhoushoujian/light-logger/blob/master/docs/log_example_1.png)  
![log_example_2](https://github.com/zhoushoujian/light-logger/blob/master/docs/log_example_2.png)  
![log_req](https://github.com/zhoushoujian/light-logger/blob/master/docs/log_req.png)  
![log_res](https://github.com/zhoushoujian/light-logger/blob/master/docs/log_res.png)  

# License
[MIT](https://github.com/zhoushoujian/light-logger/blob/master/LICENSE)  
