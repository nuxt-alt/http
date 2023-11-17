## Information

This serves as an extension to ohmyfetch for nuxt. This works similar to `nuxt/http` and `nuxtjs-alt/axios` except it utilizes ohmyfetch. All property options will be under `http`. This module is required in order for `@nuxt-alt/auth` to function.

## Setup

1. Add `@nuxt-alt/http` dependency to your project

```bash
yarn add @nuxt-alt/http
```

2. Add `@nuxt-alt/http` to the `modules` section of `nuxt.config.ts`

```ts
export default defineNuxtConfig({
    modules: [
        '@nuxt-alt/http'
    ],
    http: {
        /* module options */
    }
});

```

## Example

Remember this is a mix of `ofetch` and `nuxt/http` so to use methods you would use as an example:

```ts
// Available methods: 'get', 'head', 'delete', 'post', 'put', 'patch', 'options'

// $http.$get('/api', options) and $http.$get({ url: '/api' }) is the same as $fetch('/api', { method: 'get' })
await $http.$get('/api', options)
await $http.$get({ url: '/api', ...options })

// Access Raw Response
// $http.get('/api', options) and $http.get({ url: '/api' }) is the same as $fetch.raw('/api', { method: 'get' })
await $http.get('/api', options)
await $http.get({ url: '/api', ...options })

// $http.request('/api', options) and $http.request({ url: '/api' }) is the same as $fetch('/api', options)
await $http.request({ url: '/api', ...options })
await $http.request('/api', options)

// Access Raw Response
// $http.raw('/api', options) and $http.raw({ url: '/api' }) is the same as $fetch.raw('/api', options)
await $http.raw({ url: '/api', ...options })
await $http.raw('/api', options)

// Access Fetch Native Response
// $http.natvie('/api', options) and $http.native({ url: '/api' }) is the same as $fetch.native('/api', options) or fetch('/api', options)
await $http.native({ url: '/api', ...options })
await $http.native('/api', options)
```

## Composable

A `useHttp` composable is avaialble, it works like `useFetch` except uses this module under the hood.

## Interceptors

The interceptors should work exactly like how axios has it so to access them you would use:

```ts
$http.interceptors.request.use(config)
$http.interceptors.response.use(response)

```

A `interceptorPlugin` property has been added. This relies on the proxy module being present and will proxy urls based on the target for the client.

@nuxtjs-axios based functions have also been added:

```ts
$http.onRequest(config)
$http.onResponse(response)
$http.onRequestError(err)
$http.onResponseError(err)
$http.onError(err)
```

## Options

Config options are taken from the [http module](https://http.nuxtjs.org/). In addition an additional properyul has been added.