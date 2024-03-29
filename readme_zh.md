# beauty-logger

[中文] | [ENGLISH](https://github.com/zhoushoujian/beauty-logger/blob/master/readme.md)

`一款漂亮的nodejs和前端日志系统`

## 提示

对于浏览器的 logger,最好使用[logger-for-cannot-duplicate](https://github.com/zhoushoujian/logger-for-cannot-duplicate)

## 用法

```js
const path = require('path');
const Logger = require('beauty-logger');

const logger1 = new Logger({
  logFilePath: path.join(__dirname, './server.log'),
});

const logger2 = new Logger({
  //每个日志文件的大小限制，默认10MB
  logFileSize: 1024 * 1024 * 5,
  logFilePath: {
    //日志文件名，默认值如下
    info: path.join(__dirname, './info.log'),
    warn: path.join(__dirname, './warn.log'),
    error: path.join(__dirname, './error.log'),
  },
  //启用数据类型警告，默认：false，
  dataTypeWarn: true,
  //禁用控制台日志打印，默认：false
  productionModel: false,
  //仅在控制台打印，默认：false
  onlyPrintInConsole: false,
  //同时执行其他beautyLogger实例，默认值：[]
  otherBeautyLoggerInstances: [],
  //打印日志时并行的回调任务
  //level: 日志级别
  //data: 日志内容
  //pid: 进程号
  //filePath: 调用日志所在的文件
  //content: 纯净的日志内容，没有时间，进程号等信息
  callback: (level, data, pid, filePath, content) => void,
  //对包使用情况进行上报统计
  uploadPackageInfoUrl: ""
});

logger1.info('logger1', 'beauty-logger'); // [2021-12-21 16:30:18.998] [INFO] [charms-Mac-Pro.local] [3400] [lib/beauty-logger.ts:323] "logger1"   [ext] "beauty-logger"
logger2.info('logger2', 'beauty-logger'); // [2021-12-21 16:30:18.998] [INFO] [charms-Mac-Pro.local] [3400] [lib/beauty-logger.ts:323] "logger2"   [ext] "beauty-logger"
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

## 功能

1. 支持用户自己一日志文件切片大小和日志路径

2. 只有 logger.debug 不会输出到日志文件，所有级别的日志都可以打印到控制台

3. 仅识别 999 层级的嵌套对象或数组

4. 支持打印大对象，例如 nodejs 里的 req 或 res

5. 可以被序列化的数据类型包括数字、字符串、Undefined,、Null,、布尔、对象、数组、函数、错误对象、Set、Map 和 Symbol。假如有些不能被序列化，会打印其数据类型，例如 Dom 元素，将会打印'[object

6. 虽然我们支持直接打印函数、Set、Map 和 Symbol，但是我们依然不推荐在没有任何转换的前提下打印它，并且会给你一个警告来提醒你假如你设置 dataTypeWarn 为 true

7. 启用 productionModel 将不再打印日志到控制台，程序会运行的很快当项目运行在生产环境上

8. 默认情况，程序将按日志等级分别打印到多个文件里，假如你指定日志文件的地址为字符串类型，beauty-logger 将会打印所有日志到同一个文件

9. 支持多实例 beauty-logger 打印不同的文件

10. 所有日志方法都支持 Promise 链式调用

11. 在控制台保留数据类型，仅仅当保存到日志文件才序列化数据

12. 仅支持 logger.debug, logger.info, logger.warn and logger.error

13. nodejs 版本至少大于 6

14. 原生支持多实例合并打印并正确显示调用的文件

15. 执行打印日志时并行的回调任务

## Preview pictures

[![log_example_1](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_1.png)](https://github.com/zhoushoujian/beauty-logger/blob/master/docs/log_example_1.png)

## License

[MIT](https://github.com/zhoushoujian/beauty-logger/blob/master/LICENSE)
