import type { NitroAppPlugin } from 'nitropack'
import { createInstance } from '@refactorjs/ofetch'
import { eventHandler } from 'h3'
import { options } from '#nuxt-http-options'

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
    globalThis.$http = createInstance(defaults)

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
            event.$http = createInstance(defaults);
        })
    })
}