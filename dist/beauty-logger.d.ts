declare const consoleFormat: any;
declare namespace NodeJS {
    interface Global {
        beautyLogger: IBeautyLoggerInstance;
    }
}
interface IBeautyLoggerInstance {
    currentProjectPath: string;
    userConfig: IUserConfig[] | ILogQueue[] | IUserConfig;
    debug: (a: any[]) => void;
    info: (a: any[]) => void;
    warn: (a: any[]) => void;
    error: (a: any[]) => void;
    log: (a: any[]) => void;
}
interface IUserConfig {
    beautyLogger: boolean;
    loggerFilePath: string;
    logFileSize: number;
    dataTypeWarn: boolean;
    productionModel: boolean;
    onlyPrintInConsole: boolean;
    otherBeautyLoggerInstances: IBeautyLoggerInstance;
    callback: (level: ILevel, data: string, pid: number, filePath: string, content: string) => void;
}
declare type ILevel = 'debug' | 'info' | 'warn' | 'error' | 'log';
interface ILogQueue {
    level: ILevel;
    buffer: string;
}
declare const LOGGER_LEVEL: string[], isNodeJs: boolean;
declare let loopTimes: number, fs: any, path: any, deepcopy: any;
declare function dealWithItems(item: any, needWarn: boolean): string;
declare function formatDataType(value: any, needWarn: boolean): any;
declare function getLogPath(level: ILevel): any;
declare function logInFile(buffer: string, level: ILevel): Promise<unknown>;
declare function checkFileState(level: ILevel): Promise<unknown>;
declare function writeFile(buffer: string, level: ILevel): Promise<unknown>;
declare function InitLogger(config?: IUserConfig): void;
declare namespace InitLogger {
    var _prevLogger: typeof InitLogger;
    var noConflict: () => typeof InitLogger;
}
declare function loggerInFile(level: ILevel, data?: string): Promise<unknown> | undefined;
//# sourceMappingURL=beauty-logger.d.ts.map