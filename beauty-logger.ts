export {};
const { dealWithFilePath } = require('console-format');

const LOGGER_LEVEL = ['debug', 'info', 'warn', 'error', 'log'],
  isNodeJs = typeof process === 'object';

let loopTimes = 0,
  fs: any,
  path: any,
  deepcopy;

function dealWithItems(item, needWarn) {
  try {
    const dist = deepcopy(item);
    return JSON.stringify(
      dist,
      function (_key, value) {
        return formatDataType(value, needWarn);
      },
      0,
    );
  } catch (err) {
    return Object.prototype.toString.call(item);
  }
}

function formatDataType(value, needWarn) {
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
          } else {
            value[i] = Object.prototype.toString.call(value[i]);
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
        if (needWarn) {
          console.warn("we don't recommend to print Symbol directly", value);
        }
        formattedOnes = value.toString();
        break;
      case '[object Set]':
        if (needWarn) {
          console.warn("we don't recommend to print Set directly", value);
        }
        formattedOnes = Array.from(value);
        break;
      case '[object Map]': {
        if (needWarn) {
          console.warn("we don't recommend to print Map directly", value);
        }
        const obj = {};
        value.forEach(function (item, key) {
          obj[key] = item;
        });
        formattedOnes = obj;
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

function getTime() {
  const year = new Date().getFullYear();
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  let hour: number | string = new Date().getHours();
  let minute: number | string = new Date().getMinutes();
  let second: number | string = new Date().getSeconds();
  let mileSecond: number | string = new Date().getMilliseconds();
  if (hour < 10) {
    hour = '0' + hour;
  }
  if (minute < 10) {
    minute = '0' + minute;
  }
  if (second < 10) {
    second = '0' + second;
  }
  if (mileSecond < 10) {
    mileSecond = '00' + mileSecond;
  }
  if (mileSecond < 100) {
    mileSecond = '0' + mileSecond;
  }
  const time = `${year}-${month}-${day} ${hour}:${minute}:${second}.${mileSecond}`;
  return time;
}

function getLogPath(level) {
  const enableMultipleLogFile = this.userConfig.enableMultipleLogFile;
  const loggerFilePath = this.userConfig.loggerFilePath;
  if (enableMultipleLogFile) {
    return loggerFilePath[level];
  } else {
    return loggerFilePath;
  }
}

function logInFile(buffer, level) {
  return checkFileState.bind(this)(level).then(writeFile.bind(this, buffer, level));
}

function checkFileState(level) {
  // check file existed and file size
  const self = this;
  return new Promise(function (resolve) {
    const logFileSize = self.userConfig.logFileSize;
    const currentProjectFolder = self.userConfig.currentProjectFolder;
    if (!fs.existsSync(getLogPath.bind(self)(level))) {
      fs.appendFileSync(getLogPath.bind(self)(level), '');
      return resolve(0);
    } else {
      return fs.stat(getLogPath.bind(self)(level), function (err, stats) {
        if (err) {
          console.debug('beauty-logger: checkFileState fs.stat err', err);
          return resolve(0);
        } else {
          // logger is async, so one logger has appendFile after next one check file state
          if (stats && stats.size > logFileSize) {
            fs.readdir(currentProjectFolder, function (err, files) {
              if (err) {
                console.debug('beauty-logger: checkFileState fs.stat fs.readdir err', err);
              }
              const currentLogFilename = path.parse(getLogPath.bind(self)(level)).name;
              const currentLogFileExtname = path.parse(getLogPath.bind(self)(level)).ext;
              let currentLogFileExtnameWithoutDot;
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
                  fs.unlinkSync(currentProjectFolder + '/' + fileList[i - 1]);
                  continue;
                }
                fs.renameSync(
                  currentProjectFolder + '/' + fileList[i - 1],
                  currentLogFilename + i + currentLogFileExtname,
                );
                resolve(0);
              }
            });
          } else {
            return resolve(0);
          }
        }
      });
    }
  });
}

function writeFile(buffer, level) {
  const self = this;
  return new Promise(function (res) {
    fs.writeFile(
      getLogPath.bind(self)(level),
      buffer,
      {
        flag: 'a+',
      },
      function (err) {
        if (err) console.debug('beauty-logger: writeFile err', err);
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

function InitLogger(config = {}) {
  if (Object.prototype.toString.call(config) === '[object Object]') {
    if (isNodeJs) {
      try {
        fs = require('fs');
        path = require('path');
        deepcopy = require('deepcopy');
        this.logQueue = [];
        this.userConfig = config;
        const currentProjectPath = process.cwd().split('node_modules')[0];
        this.userConfig.loggerFilePath = {
          info: currentProjectPath + '/INFO.log',
          warn: currentProjectPath + '/WARN.log',
          error: currentProjectPath + '/ERROR.log',
          log: currentProjectPath + '/LOG.log',
        };
        this.userConfig.currentProjectFolder = currentProjectPath;
        this.userConfig.logFileSize =
          typeof this.userConfig.logFileSize === 'number' ? this.userConfig.logFileSize : 1024 * 1024 * 10;
        this.userConfig.dataTypeWarn =
          typeof this.userConfig.dataTypeWarn === 'boolean' ? this.userConfig.dataTypeWarn : false;
        this.userConfig.productionModel =
          typeof this.userConfig.productionModel === 'boolean' ? this.userConfig.productionModel : false;
        this.userConfig.onlyPrintInConsole =
          typeof this.userConfig.onlyPrintInConsole === 'boolean' ? this.userConfig.onlyPrintInConsole : false;
        if (Object.prototype.toString.call(this.userConfig.logFilePath) === '[object Object]') {
          for (const i in this.userConfig.logFilePath) {
            if (Object.prototype.hasOwnProperty.call(this.userConfig.logFilePath, i)) {
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
          throw new Error('beauty-logger: if enableMultipleLogFile is true, logFilePath must be an object or empty');
        }
        if (!global.beautyLogger) {
          global.beautyLogger = {};
          global.beautyLogger.userConfig = [];
        }
        global.beautyLogger.userConfig.push(this.userConfig);
        global.beautyLogger.userConfig.push(this.logQueue);
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
  } else {
    throw new Error('beauty-logger: config must be an object or empty');
  }
}

function loggerInFile(level, data = '') {
  if (isNodeJs) {
    const productionModel = this.userConfig.productionModel;
    const dataTypeWarn = this.userConfig.dataTypeWarn;
    const onlyPrintInConsole = this.userConfig.onlyPrintInConsole;
    if (!productionModel) {
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
        //@ts-ignore
        extend = `  [ext] ${extend.join('')}`;
      }
    }
    const content = `${dist} ${extend} \r\n`;
    const filePath = dealWithFilePath();
    const buffer = `[${getTime()}]  [${level.toUpperCase()}] [${process.pid}] [${filePath}] ${content}`;
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
    console[level].apply(null, Array.prototype.slice.call(arguments).slice(1));
  }
}

LOGGER_LEVEL.forEach(function (level) {
  InitLogger.prototype[level] = function (data) {
    return loggerInFile.bind(this)(level, data);
  };
});

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
  InitLogger._prevLogger = this.InitLogger;

  InitLogger.noConflict = function () {
    this.InitLogger = InitLogger._prevLogger;
    return InitLogger;
  };

  this.InitLogger = InitLogger;
}
