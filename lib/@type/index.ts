// import { IBeautyLoggerInstance } from '@/type';

declare module 'axios';

declare namespace NodeJS {
  interface Global {
    beautyLogger: any; //IBeautyLoggerInstance
  }
}
