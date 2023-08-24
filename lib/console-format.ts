import * as os from 'os';
//@ts-ignore
import { isNodejs, dealWithFilePath, getTime } from 'specified-package-version-check';

const colors = {
  Reset: '\x1b[0m',
  FgRed: '\x1b[31m',
  FgGreen: '\x1b[32m',
  FgYellow: '\x1b[33m',
  FgBlue: '\x1b[34m',
};

const self: any = this;
let globalSelf: any = {};

const consoleFormat = ({ showBriefInfo = false, customPrefixField = '', useLogPrefixInConsole = true }) => {
  try {
    globalSelf = self.console ? self : global;
    if (!globalSelf.nativeConsole) {
      //被调用多次会导致console打印的格式异常
      globalSelf.nativeConsole = console;
      const _console: any = { ...console };
      globalSelf.console = { ...console };
      'debug:debug:FgBlue,info:info:FgGreen,warn:warn:FgYellow,error:error:FgRed,log:log:FgGreen'
        .split(',')
        .forEach(function (logColor) {
          const [log, info, color] = logColor.split(':');
          globalSelf.console[log] = function (...args: any[]) {
            const exactInfo = showBriefInfo
              ? ` `
              : (isNodejs ? ` [${os.hostname ? os.hostname() : 'hostname'}]` : '') + ` [${process.pid}]`;
            _console[log](
              useLogPrefixInConsole
                ? //@ts-ignore
                  `${colors[color]}[${getTime()}] [${info.toUpperCase()}]${
                    customPrefixField ? ` [${customPrefixField}]` : ``
                  }${exactInfo}[${dealWithFilePath()}]${colors.Reset}`
                : '',
              ...args,
              colors.Reset,
            );
          };
        });
    }
  } catch (err: any) {
    process.stderr.write('consoleFormat err: ' + err ? err.stack || err.toString : 'undefined');
  }
};

export default consoleFormat;
