import * as os from 'os';
import axios from 'axios';
//@ts-ignore
import { name, version } from '../package.json';
import { IUserConfig } from './type';

const defaultUploadPackageInfoUrl = 'https://api-track.kylin.shuyun.com/monitor-service/upload-package-info';

const uploadPackageInfo = (config: IUserConfig) => {
  const pwd = process.cwd().split('node_modules')[0];
  const projectFolder = ['/', '\\'].includes(pwd[pwd.length - 1])
    ? pwd
    : os.type() === 'Windows_NT'
    ? pwd + '\\'
    : pwd + '/';
  let packageInfo: any = {};
  try {
    // eslint-disable-next-line import/no-dynamic-require
    packageInfo = require(`${projectFolder}package.json`);
  } catch (err) {
    console.warn(name, ': require err', err);
  }
  return (
    axios
      .post(config.uploadPackageInfoUrl || defaultUploadPackageInfoUrl, {
        ...packageInfo,
        ...config,
        packageName: name,
        packageVersion: version,
      })
      // .then((res: any) => {
      //   console.log('res', res.data);
      // })
      .catch((err: Error) => {
        axios
          .post(config.uploadPackageInfoUrl || defaultUploadPackageInfoUrl, {
            ...config,
            name: packageInfo.name,
            packageInfo: JSON.stringify(packageInfo),
            uploadError: err.stack || err.toString(),
            packageName: name,
            packageVersion: version,
          })
          .catch((err: Error) => {
            console.warn(name + ': upload package-version-info error again', err.stack || err.toString());
          });
      })
  );
};

export default uploadPackageInfo;
