import { FetchConfig, FetchInstance } from '@refactorjs/ofetch'
import * as NuxtSchema from '@nuxt/schema';

export interface ModuleOptions extends Omit<FetchConfig, 'credentials'> {
    baseURL?: string;
    browserBaseURL?: string;
    host?: string;
    prefix?: string;
    proxyHeaders?: boolean;
    proxyHeadersIgnore?: string[];
    serverTimeout?: number,
    clientTimeout?: number,
    port?: string | number;
    https?: boolean;
    retry?: number;
    credentials?: 'same-origin' | 'omit' | 'include';
    headers?: any;
    debug?: boolean;
}

declare global {
    var $http: FetchInstance;
    namespace NodeJS {
        interface Global {
            $http: FetchInstance;
        }
    }
}

declare module '@nuxt/schema' {
    interface NuxtConfig {
        ['http']?: Partial<ModuleOptions>
    }
    interface NuxtOptions {
        ['http']?: ModuleOptions
    }
}

declare module "h3" {
    interface H3Event {
        /** @experimental Calls fetch with same context and request headers */
        $http: typeof $http;
    }
}

declare module '#app' {
    interface NuxtApp extends HttpPluginInjection {}
}

interface HttpPluginInjection {
    $http: FetchInstance;
}

declare const NuxtHttp: NuxtSchema.NuxtModule<ModuleOptions>

export default NuxtHttp