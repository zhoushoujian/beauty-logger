import { exec } from 'child_process';
import * as versionCheck from 'specified-package-version-check';
import consoleFormat from './console-format';
import { defaultValues } from './constants';
//@ts-ignore
import { name, version } from '../package.json';
import { IBeautyLoggerInstance, IUserConfig, ILevel, ILogQueue } from './types';

const { uploadPackageInfo, hostname, dealWithFilePath, getTime } = versionCheck;

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
          // eslint-disable-next-line no-console
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
          // eslint-disable-next-line no-console
          console.warn("we don't recommend to print Symbol directly", value);
        }
        formattedOnes = value.toString();
        break;
      case '[object Set]':
        if (needWarn) {
          // eslint-disable-next-line no-console
          console.warn("we don't recommend to print Set directly", value);
        }
        formattedOnes = formatDataType(Array.from(value), needWarn);
        break;
      case '[object Map]': {
        if (needWarn) {
          // eslint-disable-next-line no-console
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
  const { enableMultipleLogFile, loggerFilePath } = this.userConfig;
  if (enableMultipleLogFile) {
    return loggerFilePath[level];
  } else {
    return loggerFilePath;
  }
}

function dealWithError(err: Error, info: string) {
  // eslint-disable-next-line no-console
  console.error(`${name}: ${info}`, err);
  this.logQueue.push({
    level: 'error',
    buffer: `${name}: ${info}` + (err ? err.stack || err.toString() : 'error is undefined'),
  });
}

function logInFile(buffer: string, level: ILevel): Promise<unknown> {
  const self = this;
  return checkFileState
    .bind(this)(level)
    .then(writeFile.bind(this, buffer, level))
    .catch((err) => {
      dealWithError(err, 'logInFile error');
      const firstItem = this.logQueue[0];
      return logInFile.call(self, firstItem.buffer, firstItem.level);
    });
}

//检查文件状态
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
          dealWithError(err, 'checkFileState fs.stat err');
          return resolve(0);
        } else {
          // logger is async, so one logger has appendFile after next one check file state
          if (stats && stats.size > logFileSize) {
            return fs.readdir(currentProjectLoggerFolder, function (err: Error, files: string[]) {
              if (err) {
                dealWithError(err, 'checkFileState fs.stat fs.readdir err');
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
                fs.renameSync(
                  currentProjectLoggerFolder + '/' + fileList[i - 1],
                  currentProjectLoggerFolder + '/' + currentLogFilename + i + currentLogFileExtname,
                );
              }
              return resolve(0);
            });
          } else {
            return resolve(0);
          }
        }
      });
    }
  });
}

//写入文件
function writeFile(buffer: string, level: ILevel) {
  const self = this;
  return new Promise(function (res) {
    return fs.writeFile(
      getLogPath.bind(self)(level),
      buffer,
      {
        flag: 'a+',
      },
      function (err: Error) {
        if (err) {
          dealWithError(err, 'writeFile err');
        }
        self.logQueue.shift();
        res(buffer);
        if (self.logQueue.length) {
          const firstItem = self.logQueue[0];
          return logInFile.call(self, firstItem.buffer, firstItem.level);
        } else {
          return Promise.resolve(buffer);
        }
      },
    );
  });
}

//递归创建目录 同步方法
function mkdirSync(dirname: string) {
  if (fs.existsSync(dirname)) {
    return true;
  } else {
    if (mkdirSync(path.dirname(dirname))) {
      fs.mkdirSync(dirname);
      return true;
    } else {
      return false;
    }
  }
}

//赋值默认参数
type IAssignDefaultValueParams = {
  fieldName: string;
  dataType: string;
  defaultValue: any;
}[];
function assignDefaultValue(params: IAssignDefaultValueParams, self: any) {
  params.forEach((item) => {
    const { fieldName, dataType, defaultValue } = item;
    self.userConfig[fieldName] =
      typeof self.userConfig[fieldName] === dataType ? self.userConfig[fieldName] : defaultValue;
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
        assignDefaultValue(defaultValues, this);
        const { showBriefInfo, customPrefixField, logFilePath, otherBeautyLoggerInstances, useLogPrefixInConsole } =
          this.userConfig;
        this.userConfig.otherBeautyLoggerInstances = Array.isArray(otherBeautyLoggerInstances)
          ? otherBeautyLoggerInstances
          : [];
        consoleFormat({
          showBriefInfo,
          customPrefixField,
          useLogPrefixInConsole,
        });
        if (Object.prototype.toString.call(logFilePath) === '[object Object]') {
          for (const i in logFilePath) {
            if (Object.prototype.hasOwnProperty.call(logFilePath, i) && i !== undefined) {
              this.userConfig.loggerFilePath[i] = logFilePath[i];
              //检查并创建文件夹
              mkdirSync(path.dirname(this.userConfig.loggerFilePath[i]));
            }
          }
          this.userConfig.enableMultipleLogFile = true;
        } else if (typeof this.userConfig.logFilePath === 'string') {
          this.userConfig.loggerFilePath = this.userConfig.logFilePath;
          //检查并创建文件夹
          mkdirSync(path.dirname(this.userConfig.loggerFilePath));
          this.userConfig.enableMultipleLogFile = false;
        } else if (typeof this.userConfig.logFilePath === 'undefined') {
          //use default value
        } else {
          throw new Error(`${name}: logFilePath must be an object or empty`);
        }
        this.userConfig.currentProjectLoggerFolder = path.parse(getLogPath.bind(this)('info')).dir;
        //@ts-ignore
        if (!global.beautyLogger) {
          //@ts-ignore
          global.beautyLogger = {} as IBeautyLoggerInstance;
          //@ts-ignore
          global.beautyLogger.currentProjectPath = currentProjectPath;
          //@ts-ignore
          global.beautyLogger.userConfig = [];
        }
        //@ts-ignore
        (global.beautyLogger.userConfig as IUserConfig[]).push({ userConfig: this.userConfig });
        //@ts-ignore
        (global.beautyLogger.userConfig as IUserConfig[]).push({ logQueue: this.logQueue });
        const { loggerFilePath } = this.userConfig;
        if (typeof loggerFilePath === 'string') {
          if (!fs.existsSync(loggerFilePath)) {
            fs.appendFileSync(loggerFilePath, '');
          }
        } else {
          for (const i in loggerFilePath) {
            if (Object.prototype.hasOwnProperty.call(loggerFilePath, i)) {
              if (!fs.existsSync(loggerFilePath[i])) {
                fs.appendFileSync(loggerFilePath[i], '');
              }
            }
          }
        }
      } catch (err: any) {
        dealWithError(err, 'InitLogger err');
      }
    }
    uploadPackageInfo(name, version, this.userConfig.uploadPackageInfoUrl || null);
  } else {
    throw new Error(`${name}: config must be an object or empty`);
  }
}

function loggerInFile(level: ILevel, data = '') {
  if (isNodeJs) {
    const { productionModel, dataTypeWarn, onlyPrintInConsole, storeAsJSON, callback, customPrefixField } =
      this.userConfig;
    if (!productionModel) {
      // eslint-disable-next-line no-console
      console[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
    }
    if (level === 'debug' || onlyPrintInConsole) return Promise.resolve(data);
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
        extend = `, ${(extend as string[]).join(', ')}`;
      }
    }
    const content = `${dist}${extend}`;
    const filePath = dealWithFilePath();
    const time = getTime();
    const levelUpperCase = level.toUpperCase();

    const buffer = storeAsJSON
      ? dealWithItems(
          {
            time,
            level: levelUpperCase,
            customPrefixField,
            hostname,
            pid: process.pid,
            filePath,
            content: Array.prototype.slice.call(arguments).slice(1),
          },
          dataTypeWarn,
        ) + '\r\n'
      : `[${time}] [${levelUpperCase}]${customPrefixField ? ` [${customPrefixField}] ` : ` `}[${hostname}] [${
          process.pid
        }] [${filePath}] ${content}\r\n`;
    if (Object.prototype.toString.call(callback) === '[object Function]') {
      callback(level, buffer, process.pid, filePath, content);
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
    const content = Array.prototype.slice.call(arguments).slice(1);
    // eslint-disable-next-line no-console
    console[level].apply(null, content);
    return Promise.resolve(content);
  }
}

(LOGGER_LEVEL as ILevel[]).forEach(function (level: ILevel) {
  InitLogger.prototype[level] = function (data: any, ...args: any) {
    if (this && this.userConfig && Array.isArray(this.userConfig.otherBeautyLoggerInstances)) {
      this.userConfig.otherBeautyLoggerInstances.forEach((item: IBeautyLoggerInstance) => {
        if (item && item.userConfig) {
          if ((item.userConfig as IUserConfig).beautyLogger) {
            item[level]([data, ...args]);
          }
        }
      });
    }
    //@ts-ignore
    return loggerInFile.bind(this)(level, data, ...args);
  };
});

type IExecuteCommand = {
  identify?: string; //用于打印日志的标识符
  command: string; //要运行的命令
  commandOptions: any; //执行exec的选项参数
  exitCallback?: (n: number) => void; //命令退出时的回调
  logFileSize?: number; //日志切片大小
  logFilePath?: string; //日志路径
};
InitLogger.executeCommand = ({
  identify = 'identify',
  command,
  commandOptions = {},
  exitCallback,
  logFileSize,
  logFilePath,
}: IExecuteCommand) => {
  const path = require('path');
  const logger = new (InitLogger as any)({
    logFileSize: logFileSize || 1024 * 1024 * 100,
    logFilePath: logFilePath || path.join(__dirname, `./${identify}.log`),
  });
  if (commandOptions.windowsHide !== false) {
    commandOptions.windowsHide = true; //在windows系统上自动隐藏cmd窗口
  }

  function run() {
    const child = exec(command, commandOptions);

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

  process.on('uncaughtException', (err) => {
    logger.error('uncaughtException process', err.stack || err.toString());
    // process.exit(0);
  });

  process.on('unhandledRejection', (error) => {
    logger.error('unhandledRejection process', error?.toString());
    // process.exit(0);
  });
};

InitLogger.consoleFormat = consoleFormat;

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
