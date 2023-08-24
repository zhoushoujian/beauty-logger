export interface IBeautyLoggerInstance {
  currentProjectPath: string;
  userConfig: IUserConfig[] | ILogQueue[] | IUserConfig;
  debug: (a: any[]) => void;
  info: (a: any[]) => void;
  warn: (a: any[]) => void;
  error: (a: any[]) => void;
  log: (a: any[]) => void;
}

export interface IUserConfig {
  beautyLogger?: boolean;
  loggerFilePath?: string;
  logFileSize?: number;
  dataTypeWarn?: boolean;
  productionModel?: boolean;
  onlyPrintInConsole?: boolean;
  otherBeautyLoggerInstances?: IBeautyLoggerInstance;
  callback?: (level: ILevel, data: string, pid: number, filePath: string, content: string) => void;
  uploadPackageInfoUrl?: string;
}

export type ILevel = 'debug' | 'info' | 'warn' | 'error' | 'log';

export interface ILogQueue {
  level: ILevel;
  buffer: string;
}
