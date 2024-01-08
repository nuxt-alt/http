import type { NitroAppPlugin } from 'nitropack'
import { createInstance, type FetchConfig } from '@refactorjs/ofetch'
import { eventHandler } from 'h3'
// @ts-ignore: virtual file
import { options } from '#nuxt-http-options'

const httpInstance = (opts: FetchConfig) => {
    // Create new Fetch instance
    let instance = createInstance(opts)

    if (options.debug) {
        type ConsoleKeys = 'log' | 'info' | 'warn' | 'error';
        const log = (level: ConsoleKeys, ...messages: any) => console[level]('[nitro-http]', ...messages);

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

export default <NitroAppPlugin> function (nitroApp) {
    // baseURL
    const baseURL = options.baseURL

    // Defaults
    const defaults = {
        baseURL,
        retry: options.retry,
        timeout: options.serverTimeout,
        credentials: options.credentials,
        headers: {},
    }

    // @ts-ignore
    globalThis.$http = httpInstance(defaults)

    nitroApp.h3App.stack.unshift({
        route: '/',
        handler: eventHandler((event) => {
            defaults.headers = options.headers
            if (options.proxyHeaders) {
                // Proxy SSR request headers
                if (event.node.req.headers) {
                    const reqHeaders = { ...event.node.req.headers }

                    for (const h of options.proxyHeadersIgnore) {
                        delete reqHeaders[h]
                    }
        
                    defaults.headers = { ...reqHeaders, ...defaults.headers }
                }
            }

            // Assign bound http to context
            // @ts-ignore
            event.$http = httpInstance(defaults);
        })
    })
}