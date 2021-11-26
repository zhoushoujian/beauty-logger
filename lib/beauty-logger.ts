import { exec } from 'child_process';
//@ts-ignore
import * as consoleFormat from 'console-format';
//@ts-ignore
import { name, version } from '../package.json';
import { IBeautyLoggerInstance, IUserConfig, ILevel, ILogQueue } from './type';

consoleFormat();

const LOGGER_LEVEL = ['debug', 'info', 'warn', 'error', 'log'],
  isNodeJs = typeof process === 'object';

let loopTimes = 0,
  fs: any,
  path: any,
  deepcopy: any;

function dealWithItems(item: any, needWarn: boolean) {
  try {
    const dist = deepcopy(item);
    return JSON.stringify(
      dist,
      function (_key, value) {
        loopTimes = 0;
        return formatDataType(value, needWarn);
      },
      0,
    );
  } catch (err) {
    return Object.prototype.toString.call(item);
  }
}

function formatDataType(value: any, needWarn: boolean) {
  loopTimes++;
  let formattedOnes: any = '';
  try {
    const valueType = Object.prototype.toString.call(value);
    switch (valueType) {
      case '[object Number]':
      case '[object String]':
      case '[object Undefined]':
      case '[object Null]':
      case '[object Boolean]':
        formattedOnes = value;
        break;
      case '[object Object]':
      case '[object Array]':
        for (const i in value) {
          if (Object.prototype.hasOwnProperty.call(value, i)) {
            if (loopTimes > 999) {
              value[i] = Object.prototype.toString.call(value[i]);
            } else {
              value[i] = formatDataType(value[i], needWarn);
            }
          }
        }
        formattedOnes = value;
        break;
      case '[object Function]':
        if (needWarn) {
          console.warn("we don't recommend to print function directly", value);
        }
        formattedOnes = Function.prototype.toString.call(value);
        break;
      case '[object Error]':
        formattedOnes = value.stack || value.toString();
        break;
      case '[object Symbol]':
      case '[object Date]':
        if (needWarn) {
          console.warn("we don't recommend to print Symbol directly", value);
        }
        formattedOnes = value.toString();
        break;
      case '[object Set]':
        if (needWarn) {
          console.warn("we don't recommend to print Set directly", value);
        }
        formattedOnes = formatDataType(Array.from(value), needWarn);
        break;
      case '[object Map]': {
        if (needWarn) {
          console.warn("we don't recommend to print Map directly", value);
        }
        const obj: any = {};
        value.forEach(function (item: any, key: any) {
          obj[key] = item;
        });
        formattedOnes = formatDataType(obj, needWarn);
        break;
      }
      default:
        formattedOnes = Object.prototype.toString.call(value);
        break;
    }
  } catch (err) {
    formattedOnes = {};
  }
  return formattedOnes;
}

function getLogPath(level: ILevel) {
  const enableMultipleLogFile = this.userConfig.enableMultipleLogFile;
  const loggerFilePath = this.userConfig.loggerFilePath;
  if (enableMultipleLogFile) {
    return loggerFilePath[level];
  } else {
    return loggerFilePath;
  }
}

function logInFile(buffer: string, level: ILevel) {
  return checkFileState.bind(this)(level).then(writeFile.bind(this, buffer, level));
}

function checkFileState(level: ILevel) {
  // check file existed and file size
  const self = this;
  return new Promise(function (resolve) {
    const logFileSize = self.userConfig.logFileSize;
    const currentProjectLoggerFolder = self.userConfig.currentProjectLoggerFolder;
    if (!fs.existsSync(getLogPath.bind(self)(level))) {
      fs.appendFileSync(getLogPath.bind(self)(level), '');
      return resolve(0);
    } else {
      return fs.stat(getLogPath.bind(self)(level), function (err: Error, stats: { size: number }) {
        if (err) {
          console.debug('beauty-logger: checkFileState fs.stat err', err);
          return resolve(0);
        } else {
          // logger is async, so one logger has appendFile after next one check file state
          if (stats && stats.size > logFileSize) {
            fs.readdir(currentProjectLoggerFolder, function (err: Error, files: string[]) {
              if (err) {
                console.debug('beauty-logger: checkFileState fs.stat fs.readdir err', err);
              }
              const currentLogFilename = path.parse(getLogPath.bind(self)(level)).name;
              const currentLogFileExtname = path.parse(getLogPath.bind(self)(level)).ext;
              let currentLogFileExtnameWithoutDot = '';
              if (currentLogFileExtname) {
                currentLogFileExtnameWithoutDot = currentLogFileExtname.replace('.', '');
              }
              const fileList = files.filter(function (file) {
                return RegExp('^' + currentLogFilename + '[0-9]*.*' + currentLogFileExtnameWithoutDot + '*$').test(
                  file,
                );
              });
              for (let i = fileList.length; i > 0; i--) {
                if (i >= 10) {
                  fs.unlinkSync(currentProjectLoggerFolder + '/' + fileList[i - 1]);
                  continue;
                }
                fs.renameSync(
                  currentProjectLoggerFolder + '/' + fileList[i - 1],
                  currentProjectLoggerFolder + '/' + currentLogFilename + i + currentLogFileExtname,
                );
              }
              resolve(0);
            });
          } else {
            return resolve(0);
          }
        }
      });
    }
  });
}

function writeFile(buffer: string, level: ILevel) {
  const self = this;
  return new Promise(function (res) {
    fs.writeFile(
      getLogPath.bind(self)(level),
      buffer,
      {
        flag: 'a+',
      },
      function (err: Error) {
        if (err) console.debug('beauty-logger: writeFile err', err.stack || err.toString());
        self.logQueue.shift();
        res(buffer);
        if (self.logQueue.length) {
          const firstItem = self.logQueue[0];
          return logInFile.call(self, firstItem.buffer, firstItem.level);
        }
      },
    );
  });
}

function InitLogger(config = {} as IUserConfig) {
  this.userConfig = config;
  if (Object.prototype.toString.call(config) === '[object Object]') {
    if (isNodeJs) {
      try {
        fs = require('fs');
        path = require('path');
        deepcopy = require('deepcopy');
        this.logQueue = [] as ILogQueue[];
        const currentProjectPath = process.cwd().split('node_modules')[0];
        this.userConfig.loggerFilePath = {
          info: currentProjectPath + '/INFO.log',
          warn: currentProjectPath + '/WARN.log',
          error: currentProjectPath + '/ERROR.log',
          log: currentProjectPath + '/LOG.log',
        };
        this.userConfig.beautyLogger = true;
        this.userConfig.logFileSize =
          typeof this.userConfig.logFileSize === 'number' ? this.userConfig.logFileSize : 1024 * 1024 * 10;
        this.userConfig.dataTypeWarn =
          typeof this.userConfig.dataTypeWarn === 'boolean' ? this.userConfig.dataTypeWarn : false;
        this.userConfig.productionModel =
          typeof this.userConfig.productionModel === 'boolean' ? this.userConfig.productionModel : false;
        this.userConfig.onlyPrintInConsole =
          typeof this.userConfig.onlyPrintInConsole === 'boolean' ? this.userConfig.onlyPrintInConsole : false;
        this.userConfig.otherBeautyLoggerInstances = Array.isArray(this.userConfig.otherBeautyLoggerInstances)
          ? this.userConfig.otherBeautyLoggerInstances
          : [];
        this.userConfig.callback = this.userConfig.callback instanceof Function ? this.userConfig.callback : null;
        let levelArr = ['info', 'warn', 'error', 'log'];
        if (Object.prototype.toString.call(this.userConfig.logFilePath) === '[object Object]') {
          for (const i in this.userConfig.logFilePath) {
            if (Object.prototype.hasOwnProperty.call(this.userConfig.logFilePath, i) && i !== undefined) {
              levelArr = levelArr.filter(item => item !== i.toLocaleLowerCase());
              this.userConfig.loggerFilePath[i] = this.userConfig.logFilePath[i];
            }
          }
          this.userConfig.enableMultipleLogFile = true;
        } else if (typeof this.userConfig.logFilePath === 'string') {
          this.userConfig.loggerFilePath = this.userConfig.logFilePath;
          this.userConfig.enableMultipleLogFile = false;
        } else if (typeof this.userConfig.logFilePath === 'undefined') {
          //use default value
        } else {
          throw new Error('beauty-logger: logFilePath must be an object or empty');
        }
        this.userConfig.currentProjectLoggerFolder = path.parse(getLogPath.bind(this)('info')).dir;
        if (this.userConfig.enableMultipleLogFile) {
          levelArr.forEach(item => {
            this.userConfig.loggerFilePath[item] =
              this.userConfig.currentProjectLoggerFolder + '/' + item.toUpperCase() + '.log';
          });
        }
        if (!global.beautyLogger) {
          global.beautyLogger = {} as IBeautyLoggerInstance;
          global.beautyLogger.currentProjectPath = currentProjectPath;
          global.beautyLogger.userConfig = [];
        }
        (global.beautyLogger.userConfig as IUserConfig[]).push(this.userConfig);
        (global.beautyLogger.userConfig as IUserConfig[]).push(this.logQueue);
        if (typeof this.userConfig.loggerFilePath === 'string') {
          if (!fs.existsSync(this.userConfig.loggerFilePath)) {
            fs.appendFileSync(this.userConfig.loggerFilePath, '');
          }
        } else {
          for (const i in this.userConfig.loggerFilePath) {
            if (Object.prototype.hasOwnProperty.call(this.userConfig.loggerFilePath, i)) {
              if (!fs.existsSync(this.userConfig.loggerFilePath[i])) {
                fs.appendFileSync(this.userConfig.loggerFilePath[i], '');
              }
            }
          }
        }
      } catch (err) {
        console.error('beauty-logger: err', err);
      }
    }
    consoleFormat.uploadPackageInfo({ ...this.userConfig, name, version });
  } else {
    throw new Error('beauty-logger: config must be an object or empty');
  }
}

function loggerInFile(level: ILevel, data = '') {
  if (isNodeJs) {
    const productionModel = this.userConfig.productionModel;
    const dataTypeWarn = this.userConfig.dataTypeWarn;
    const onlyPrintInConsole = this.userConfig.onlyPrintInConsole;
    if (!productionModel) {
      //@ts-ignore
      console[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
    }
    if (level === 'debug' || onlyPrintInConsole) return;
    loopTimes = 0;
    let dist = deepcopy(data);
    dist = JSON.stringify(
      dist,
      function (_key, value) {
        return formatDataType(value, dataTypeWarn);
      },
      0,
    );
    let extend: string[] | string = [];
    const args = Array.prototype.slice.call(arguments).slice(2);
    if (args.length) {
      extend = args.map(function (item) {
        return dealWithItems(item, dataTypeWarn);
      });
      if (extend.length) {
        extend = `  [ext] ${extend.join('')}`;
      }
    }
    const content = `${dist} ${extend} \r\n`;
    const filePath = consoleFormat.dealWithFilePath();
    const hostname = consoleFormat.hostname;
    const buffer = `[${consoleFormat.getTime()}] [${level.toUpperCase()}] [${hostname}] [${
      process.pid
    }] [${filePath}] ${content}`;
    if (Object.prototype.toString.call(this.userConfig.callback) === '[object Function]') {
      this.userConfig.callback(level, buffer, process.pid, filePath, content);
    }
    if (this.logQueue.length) {
      this.logQueue.push({
        level,
        buffer,
      });
      return Promise.resolve(buffer);
    }
    this.logQueue.push({
      level,
      buffer,
    });
    return logInFile.call(this, buffer, level);
  } else {
    //@ts-ignore
    console[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
  }
}

(LOGGER_LEVEL as ILevel[]).forEach(function (level: ILevel) {
  InitLogger.prototype[level] = function (data: any, ...args: any) {
    if (this && this.userConfig) {
      if (this.userConfig.otherBeautyLoggerInstances && this.userConfig.otherBeautyLoggerInstances.length) {
        this.userConfig.otherBeautyLoggerInstances.forEach((item: IBeautyLoggerInstance) => {
          if (item && item.userConfig) {
            if ((item.userConfig as IUserConfig).beautyLogger) {
              item[level]([data, ...args]);
            }
          }
        });
      }
    }
    //@ts-ignore
    return loggerInFile.bind(this)(level, data, ...args);
  };
});

type IExecuteCommand = {
  identify?: string; //用于打印日志的标识符
  command: string; //要运行的命令
  exitCallback?: (n: number) => void; //命令退出时的回调
  logFileSize?: number; //日志切片大小
  logFilePath?: string; //日志路径
};
InitLogger.executeCommand = ({
  identify = 'identify',
  command,
  exitCallback,
  logFileSize,
  logFilePath,
}: IExecuteCommand) => {
  const path = require('path');
  const logger = new (InitLogger as any)({
    logFileSize: logFileSize || 1024 * 1024 * 100,
    logFilePath: logFilePath || path.join(__dirname, `./${identify}.log`),
  });

  function run() {
    const child = exec(command);

    child.stdout!.on('data', async function (data: string) {
      logger.info(`${identify} data`, data);
    });
    child.stderr!.on('data', function (data: string) {
      logger.warn(`${identify} stderr`, data);
    });
    child.on('exit', function (code: number) {
      logger[code === 0 ? 'info' : 'error'](`${identify} exit code`, code);
      if (exitCallback) exitCallback(code);
    });
  }

  run();

  process.on('uncaughtException', err => {
    logger.error('uncaughtException process', err.stack || err.toString());
    // process.exit(0);
  });

  process.on('unhandledRejection', error => {
    logger.error('unhandledRejection process', error?.toString());
    // process.exit(0);
  });
};

// Export to popular environments boilerplate.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = InitLogger;
  //@ts-ignore
  // eslint-disable-next-line no-undef
} else if (typeof define === 'function' && define.amd) {
  //@ts-ignore
  // eslint-disable-next-line no-undef
  define(InitLogger);
} else {
  InitLogger._prevLogger = (this as any).InitLogger;

  InitLogger.noConflict = function () {
    //@ts-ignore
    this.InitLogger = InitLogger._prevLogger;
    return InitLogger;
  };
  (this as any).InitLogger = InitLogger;
}
