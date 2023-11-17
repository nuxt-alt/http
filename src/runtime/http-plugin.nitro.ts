import type { NitroAppPlugin } from 'nitropack'
import { createInstance } from '@refactorjs/ofetch'
import { createFetch, Headers } from 'ofetch'
import { eventHandler, fetchWithEvent } from 'h3'
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
    globalThis.$http = createInstance(defaults, createFetch({ fetch: nitroApp.localFetch, Headers }))

    nitroApp.h3App.stack.unshift({
        route: '/',
        handler: eventHandler((event) => {
            // Assign bound http to context
            // @ts-ignore
            event.$http = (req, init) => fetchWithEvent(event, req, init, { fetch: $http });
        })
    })
}