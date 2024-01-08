import { createInstance, type FetchConfig } from '@refactorjs/ofetch';
import { defineNuxtPlugin, useRuntimeConfig } from '#imports';
// @ts-expect-error: virtual file
import { options } from '#nuxt-http-options';
import { defu } from "defu";

const httpInstance = (opts: FetchConfig) => {
    // Create new Fetch instance
    let instance = createInstance(opts)

    if (options.debug) {
        type ConsoleKeys = 'log' | 'info' | 'warn' | 'error';
        const log = (level: ConsoleKeys, ...messages: any) => console[level]('[http]', ...messages);

        // request
        instance.onRequest(config => {
            log('info', 'Request:', config)
            return config
        })

        instance.onRequestError(error => {
            log('error', 'Request error:', error)
        })

        // response
        instance.onResponse(res => {
            log('info', 'Response:', res)
            return res
        })

        instance.onResponseError(error => {
            log('error', 'Response error:', error)
        })
    }

    return instance
}

export default defineNuxtPlugin(ctx => {
    const runtimeConfig = useRuntimeConfig()

    // Use runtime config to configure options, with module options as the fallback
    const config = process.server ? defu({}, runtimeConfig.http, runtimeConfig.public.http, options) : defu({}, runtimeConfig.public.http, options) as any

    // baseURL
    const baseURL = process.client ? config.browserBaseURL : config.baseURL

    // Defaults
    const defaults = {
        baseURL,
        retry: config.retry,
        timeout: process.server ? config.serverTimeout : config.clientTimeout,
        credentials: config.credentials,
        headers: config.headers,
    }

    if (config.proxyHeaders) {
        // Proxy SSR request headers
        if (import.meta.server && ctx.ssrContext?.event.node.req.headers) {
            const reqHeaders = { ...ctx.ssrContext.event.node.req.headers }
            for (const h of config.proxyHeadersIgnore) {
                delete reqHeaders[h]
            }

            defaults.headers = { ...reqHeaders, ...defaults.headers }
        }
    }

    const http = httpInstance(defaults)

    if (!globalThis.$http) {
        globalThis.$http = http
    }

    return {
        provide: {
            http: $http
        }
    }
})