declare module '@nestjs/jwt' {
  import { DynamicModule, ModuleMetadata, Type } from '@nestjs/common';
  import { JwtModuleOptions, JwtModuleAsyncOptions } from '@nestjs/jwt/dist/interfaces/jwt-module-options.interface';

  export class JwtService {
    sign(payload: string | object | Buffer, options?: any): string;
    verify<T = any>(token: string, options?: any): T;
  }

  export class JwtModule {
    static register(options: JwtModuleOptions): DynamicModule;
    static registerAsync(options: JwtModuleAsyncOptions): DynamicModule;
  }
}
