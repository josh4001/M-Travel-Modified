declare module '@nestjs/config' {
  export interface ConfigModuleOptions {
    isGlobal?: boolean;
  }

  export class ConfigModule {
    static forRoot(options?: ConfigModuleOptions): any;
  }

  export class ConfigService {
    get<T = any>(key: string, defaultValue?: T): T;
  }
}
