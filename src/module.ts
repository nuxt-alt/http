import type { ModuleOptions } from './types'
import { addTemplate, defineNuxtModule, addPluginTemplate, createResolver, addImports } from '@nuxt/kit'
import { name, version } from '../package.json'
import { withHttps } from 'ufo'
import { defu } from 'defu'

const CONFIG_KEY = 'http'

export default defineNuxtModule({
    meta: {
        name,
        version,
        configKey: CONFIG_KEY,
    },
    defaults: {} as ModuleOptions,
    setup(opts, nuxt) {
        // Combine options with runtime config
        const moduleOptions: ModuleOptions = opts

        // Default host
        const defaultHost = moduleOptions.host || process.env.NITRO_HOST || process.env.HOST || 'localhost'

        // Default port
        const defaultPort = moduleOptions.port || process.env.NITRO_PORT || process.env.PORT || 3000

        // Default prefix
        const prefix = moduleOptions.prefix || process.env.PREFIX || '/'

        // Apply defaults
        const options = defu(moduleOptions, {
            baseURL: `http://${defaultHost}:${defaultPort}${prefix}`,
            browserBaseURL: undefined,
            proxyHeaders: true,
            proxyHeadersIgnore: [
                'accept',
                'connection',
                'cf-connecting-ip',
                'cf-ray',
                'content-length',
                'content-md5',
                'content-type',
                'host',
                'if-modified-since',
                'if-none-match',
                'x-forwarded-host',
                'x-forwarded-port',
                'x-forwarded-proto'
            ],
            serverTimeout: 10000,
            clientTimeout: 25000,
            https: false,
            retry: 1,
            headers: {
                accept: 'application/json, text/plain, */*'
            },
            credentials: 'omit',
            debug: false,
            interceptorPlugin: false
        })

        if (typeof options.browserBaseURL === 'undefined') {
            options.browserBaseURL = nuxt.options.app.baseURL
        }

        // Convert http:// to https:// if https option is on
        if (options.https === true) {
            options.baseURL = withHttps(options.baseURL as string)
            options.browserBaseURL = withHttps(options.browserBaseURL)
        }

        // resolver
        const resolver = createResolver(import.meta.url)

        // Requires proxy module
        if (Object.hasOwn(nuxt.options, 'proxy') && moduleOptions.interceptorPlugin) {
            addPluginTemplate({
                src: resolver.resolve('runtime/templates/interceptor.plugin.mjs'),
                filename: 'http-interceptor.plugin.mjs',
                mode: 'client',
                // @ts-ignore
                options: nuxt.options.proxy,
            })
        }

        if (process.platform !== "win32") {
            // create nitro plugin
            addTemplate({
                getContents: () => nitroHttp(options as ModuleOptions),
                filename: `nitro-http.mjs`,
                write: true
            })

            nuxt.hook('nitro:config', (nitro) => {
                nitro.plugins = nitro.plugins || []
                nitro.plugins.push(resolver.resolve(nuxt.options.buildDir, `nitro-http.mjs`))
            })
        }

        // Register plugin
        addPluginTemplate({
            src: resolver.resolve('runtime/templates/http.plugin.mjs'),
            filename: 'http.plugin.mjs',
            options: options
        })

        addTemplate({
            getContents: () => httpDefinition(),
            filename: 'http.plugin.d.ts',
            write: true,
        })

        // Add auto imports
        const composables = resolver.resolve('runtime/composables')

        addImports([
            { from: composables, name: 'useHttp' },
            { from: composables, name: 'useLazyHttp' }
        ])
    }
})

function nitroHttp(options: ModuleOptions) {
return `import { createInstance } from '@refactorjs/ofetch'
import { createFetch, Headers } from "ofetch";

const config = ${JSON.stringify(options)}

export default function (nitroApp) {
    // baseURL
    const baseURL = config.baseURL

    // Defaults
    const defaults = {
        baseURL,
        retry: config.retry,
        timeout: config.serverTimeout,
        credentials: config.credentials,
        headers: {},
    }

    // @ts-ignore
    globalThis.$http = createInstance(defaults, createFetch({ fetch: nitroApp.localFetch, Headers }))
}
`
}

function httpDefinition() {
return `import type { Plugin } from '#app'
import { FetchInstance } from '@refactorjs/ofetch'

declare const _default: Plugin<{
    http: FetchInstance;
}>;

export default _default;
`
}