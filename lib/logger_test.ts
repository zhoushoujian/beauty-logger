/* eslint-disable no-lone-blocks */
export {};
const fs = require('fs');
const path = require('path');
const Logger = require('./beauty-logger');

if (!fs.existsSync(path.join(__dirname, './logs'))) {
  fs.mkdirSync(path.join(__dirname, './logs'));
}

Logger.executeCommand({ command: 'ls' });

const logger1 = new Logger({
  logFileSize: 1024 * 1024 * 5,
  logFilePath: path.join(__dirname, './logs/userActivity.log'),
  dataTypeWarn: false,
  productionModel: false,
  onlyPrintInConsole: false,
  enableMultipleLogFile: false,
});
const logger2 = new Logger({
  logFileSize: 1024 * 1024 * 10,
  logFilePath: {
    info: path.join(__dirname, './logs/INFO.log'),
    warn: path.join(__dirname, './logs/WARN.log'),
    error: path.join(__dirname, './logs/ERROR.log'),
    log: path.join(__dirname, './logs/LOG.log'),
  },
  dataTypeWarn: true,
  productionModel: false,
  onlyPrintInConsole: false,
  enableMultipleLogFile: true,
});

const str = 'this is string';
const num = 0;
const bool = false;
const empty = null;
const undefined1 = undefined;
const func = function (a: number, b: number) {
  const sum = a + b;
  return sum;
};
const arr1 = [1, 5, 6];
const arr2 = [2, 7, arr1];
const obj1 = {
  g: 1,
  h: {
    i: 'undefined',
  },
};
const obj = {
  a: {
    e: {
      f: func,
    },
  },
  b: arr2,
  c: {
    D: obj1,
  },
};
const arr = [obj, func, arr2];
const fun = obj.a.e.f(1, 2);
const symbol = Symbol('symbol');
const set = new Set(arr2);
const map = new Map([
  ['title', 'hello world'],
  ['year', '2020'],
]);

console.time('time');

{
  console.log('*********************logger1 parameter test case***************************************');
  logger1.debug('str', str);
  logger1.debug(num);
  logger1.info(bool);
  logger1.info(empty);
  logger1.warn(arr);
  logger1.warn(obj);
  logger1.error(undefined1);
  logger1.error(func);
  logger1.info(fun);
  logger1.info(symbol);
  logger1.log(set);
  logger1.log(map);
}

console.log('*********************logger config info***************************************');

console.log('global.beautyLogger', global.beautyLogger);

{
  console.log('*********************logger2 parameter test case***************************************');
  logger2.debug('str', str);
  logger2.debug('num', num);
  logger2.info('bool', bool);
  logger2.info('null', empty);
  logger2.warn('arr', arr);
  logger2.warn('obj', obj);
  logger2.error('undefined', undefined1);
  logger2.error('func', func);
  logger2.info('fun', fun);
  logger2.info('symbol', symbol);
  logger2.log('set', set);
  logger2.log('map', map);
}

// console.log("global.beautyLogger", global.beautyLogger)

console.timeEnd('time');

logger2.info('0123456789').then((result: string) => {
  logger2.log('aaaa', result);
});
