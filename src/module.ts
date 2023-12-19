import type { ModuleOptions } from './types'
import { addTemplate, defineNuxtModule, addPlugin, createResolver, addImports } from '@nuxt/kit'
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
    async setup(opts, nuxt) {
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
                'authorization',
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
            credentials: 'same-origin',
            debug: false
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

        const runtimeDir = await resolver.resolve('./runtime')
        nuxt.options.build.transpile.push(runtimeDir)

        // Inject options via virtual template
        nuxt.options.alias['#nuxt-http-options'] = addTemplate({
            filename: 'nuxt-http-options.mjs',
            write: true,
            getContents: () => `export const options = ${JSON.stringify(options, null, 2)}`
        }).dst

        nuxt.hook('nitro:config', (config) => {
            config.externals = config.externals || {}
            config.externals.inline = config.externals.inline || []
            config.externals.inline.push(runtimeDir)

            config.virtual = config.virtual || {}
            config.virtual['#nuxt-http-options'] = `export const options = ${JSON.stringify(options, null, 2)}`
            config.plugins = config.plugins || []
            config.plugins.push(resolver.resolve(runtimeDir, 'http-plugin.nitro'))
        })

        // Register plugin
        addPlugin({
            src: resolver.resolve(resolver.resolve(runtimeDir, 'http-plugin.nuxt')),
        })

        // Add auto imports
        const composables = resolver.resolve('runtime/composables')

        addImports([
            { from: composables, name: 'useHttp' },
            { from: composables, name: 'useLazyHttp' }
        ])
    }
})