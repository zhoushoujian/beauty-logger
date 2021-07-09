# beauty-logger

[ENGLISH] | [中文](https://github.com/zhoushoujian/beauty-logger/blob/master/readme_zh.md)

`A beautiful logger system for both nodejs and browser`

## Tip

For browser logger, it's better to use [logger-for-cannot-duplicate](https://github.com/zhoushoujian/logger-for-cannot-duplicate)

## Usage

```js
const path = require('path');
const Logger = require('beauty-logger');
const logger1 = new Logger({
  //max size of per log file, default: 10MB
  logFileSize: 1024 * 1024 * 5,
  logFilePath: {
    //log file name, default: as follows
    info: path.join(__dirname, './info.log'),
    warn: path.join(__dirname, './warn.log'),
    error: path.join(__dirname, './error.log'),
  },
  //enable data type warn, default: false
  dataTypeWarn: true,
  //disable print log in console, default: false
  productionModel: false,
  //only print log in console, default: false
  onlyPrintInConsole: false,
  //execute other beauty logger instance at the same time，default：[]
  otherBeautyLoggerInstances: [],
  //execute callback when logging, default: null
 //level: log level
 //data: log content
 //pid: process pid
 //filePath: execute log function filename
  callback: (level, data, pid, filePath) => void,
});
const logger2 = new Logger({
  logFileSize: 1024 * 1024 * 10,
  //log in one file, default: server.log in current project root folder
  logFilePath: path.join(__dirname, './server.log'),
  dataTypeWarn: true,
  productionModel: false,
  onlyPrintInConsole: false,
});
logger1.info('logger1', 'beauty-logger'); // [2020-2-2 22:13:54.551]  [INFO]  logger [ext] beauty-logger
console.log('logger1', logger1);
logger2.info('logger2', 'beauty-logger'); // [2020-2-2 22:13:54.551]  [INFO]  logger [ext] beauty-logger
console.log('logger2', logger2);
```

## Apis

1. logger.debug
2. logger.info
3. logger.warn
4. logger.error
5. logger.log

## Test

```shell
npm run test
```

## Functions

1. Support user define the slice of log file size and log file path.

2. Only logger.debug doesn't log to file, all of them can be print in console.

3. Only identify 999 levels in input value which contains object or array.

4. Support to print part of req and res(big object) in nodejs

5. Data type includes Number, String, Undefined, Null, Boolean, Object, Array, Function, Error, Set, Map and Symbol can be support stringify. If something can't be stringify, it will be print data type, such as DOM element, it will print '[object HTMLDivElement]'

6. Although we support print Function, Set, Map and Symbol directly, we still don't recommend to print it without any transfer, and it will give a warn to remind you if you set dataTypeWarn to be true.

7. Enable productionModel will not print log to console, it will be fast for program in production environment.

8. In default, it will log file by log level and it will log into multiple different kinds of files, if you specify logFilePath as a path string, beauty-logger will print all logs to one file.

9. Support new multiple beauty-logger instance to log different files.

10. All of logger method support Promise chain call

11. Reserve data type which is in console, only stringify data which will be written to file.

12. Only support logger.debug, logger.info, logger.warn, logger.error and logger.log

13. Support nodejs at least 6.x

14. support more beauty logger working at the same time and print which file execute it correctly.

15. execute callback when logging

## Preview pictures

[![log_example_1](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_1.png)](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_1.png)

## License

[MIT](https://github.com/zhoushoujian/beauty-logger/blob/master/LICENSE)
