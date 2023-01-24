import { createInstance } from '@refactorjs/ofetch'
import { defineNuxtPlugin } from '#imports'
import { defu } from "defu";

// Nuxt Options
const options = JSON.parse('<%= JSON.stringify(options) %>')

const httpInstance = (options) => {
    // Create new Fetch instance
    const instance = createInstance(options)
    '<% if (options.debug) { %>';debugInterceptor(instance);'<% } %>'

    return instance
}

'<% if (options.debug) { %>'
const debugInterceptor = http => {
    const log = (level, ...messages) => console[level]('[http]', ...messages)

    // request
    http.onRequest(config => {
        log('info', 'Request:', config)
        return config
    })

    http.onRequestError(error => {
        log('error', 'Request error:', error)
    })

    // response
    http.onResponse(res => {
        log('info', 'Response:', res)
        return res
    })

    http.onResponseError(error => {
        log('error', 'Response error:', error)
    })
}
'<% } %>'

export default defineNuxtPlugin(ctx => {
    const runtimeConfig = useRuntimeConfig()

    // Use runtime config to configure options, with module options as the fallback
    const config = defu({}, runtimeConfig.http, runtimeConfig.public.http, options)

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
        if (process.server && ctx.ssrContext?.event?.req?.headers) {
            const reqHeaders = { ...ctx.ssrContext.event.req.headers }
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
            http: http
        }
    }
})