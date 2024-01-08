import type { FetchConfig } from '@refactorjs/ofetch'
import type { FetchError } from 'ofetch'
import type { TypedInternalResponse, NitroFetchRequest, AvailableRouterMethod as _AvailableRouterMethod } from 'nitropack'
import type { AsyncDataOptions, AsyncData } from '#app'
import { computed, unref, reactive, toValue, type MaybeRef, type WatchSource, type Ref } from 'vue'
import { useAsyncData, useRequestEvent } from '#imports'
import { hash } from 'ohash'

type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : K[number] extends never ? T : Pick<T, K[number]> : T;
type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : never : never>;

type AvailableRouterMethod<R extends NitroFetchRequest> = _AvailableRouterMethod<R> | Uppercase<_AvailableRouterMethod<R>>
type MultiWatchSources = (WatchSource<unknown> | object)[];

interface NitroFetchOptions<R extends NitroFetchRequest, M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>> extends Omit<FetchConfig, 'method'> {
    method?: Uppercase<M> | M;
}

type ComputedOptions<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Function ? T[K] : T[K] extends Record<string, any> ? ComputedOptions<T[K]> | Ref<T[K]> | T[K] : Ref<T[K]> | T[K]
}

export type FetchResult<ReqT extends NitroFetchRequest, M extends AvailableRouterMethod<ReqT>> = TypedInternalResponse<ReqT, unknown, Lowercase<M>>

type ComputedFetchOptions<R extends NitroFetchRequest, M extends AvailableRouterMethod<R>> = ComputedOptions<NitroFetchOptions<R, M>>

export interface UseHttpOptions<
    ResT,
    DataT = ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
    R extends NitroFetchRequest = string & {},
    M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>
> extends Omit<AsyncDataOptions<ResT, DataT, PickKeys, DefaultT>, 'watch'>, ComputedFetchOptions<R, M> {
    key?: string
    $http?: typeof globalThis.$http
    watch?: MultiWatchSources | false
}

export function useHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends void ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT> : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    DataT = _ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: UseHttpOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | null>
export function useHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends void ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT> : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    DataT = _ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = DataT,
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: UseHttpOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | null>
export function useHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends void ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT> : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    DataT = _ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    arg1?: string | UseHttpOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>,
    arg2?: string
) {
    const [opts = {}, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]

    const _request = computed(() => {
        let r = request
        if (typeof r === 'function') {
            r = r()
        }
        return unref(r)
    })

    const _key = opts.key || hash([autoKey, typeof _request.value === 'string' ? _request.value : '', ...generateOptionSegments(opts)])

    if (!_key || typeof _key !== 'string') {
        throw new TypeError('[nuxt] [useHttp] key must be a string: ' + _key)
    }

    if (!request) {
        throw new Error('[nuxt] [useHttp] request is missing.')
    }

    const key = _key === autoKey ? '$h' + _key : _key

    if (!opts.baseURL && typeof _request.value === 'string' && (_request.value[0] === '/' && _request.value[1] === '/')) {
        throw new Error('[nuxt] [useHttp] the request URL must not start with "//".')
    }

    const {
        server,
        lazy,
        default: defaultFn,
        transform,
        pick,
        watch,
        immediate,
        ...fetchOptions
    } = opts

    const _fetchOptions = reactive({
        ...fetchOptions,
        cache: typeof opts.cache === 'boolean' ? undefined : opts.cache
    })

    const _asyncDataOptions: AsyncDataOptions<_ResT, DataT, PickKeys, DefaultT> = {
        server,
        lazy,
        default: defaultFn,
        transform,
        pick,
        immediate,
        watch: watch === false ? [] : [_fetchOptions, _request, ...(watch || [])]
    }

    let _$http = opts.$http || globalThis.$http

    if (import.meta.server && !opts.$http) {
        const isLocalFetch = typeof _request.value === 'string' && _request.value[0] === '/' && (!toValue(opts.baseURL) || toValue(opts.baseURL)![0] === '/')
        if (isLocalFetch) {
            _$http = useRequestEvent()?.$http
        }
    }

    const asyncData = useAsyncData<_ResT, ErrorT, DataT, PickKeys, DefaultT>(key, () => {
        return _$http.request(_request.value, _fetchOptions as FetchConfig) as Promise<_ResT>
    }, _asyncDataOptions)

    return asyncData
}

export function useLazyHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends void ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT> : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    DataT = _ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: Omit<UseHttpOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>, 'lazy'>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | null>
export function useLazyHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends void ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT> : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    DataT = _ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = DataT,
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: Omit<UseHttpOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>, 'lazy'>
): AsyncData<PickFrom<DataT, PickKeys> | DefaultT, ErrorT | null>
export function useLazyHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = ResT extends void ? 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT> : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    DataT = _ResT,
    PickKeys extends KeysOf<DataT> = KeysOf<DataT>,
    DefaultT = null,
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    arg1?: string | Omit<UseHttpOptions<_ResT, DataT, PickKeys, DefaultT, ReqT, Method>, 'lazy'>,
    arg2?: string
) {

    const [opts, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]

    return useHttp<ResT, ErrorT, ReqT, Method, _ResT, DataT, PickKeys, DefaultT>(request, {
        ...opts,
        lazy: true
        // @ts-expect-error we pass an extra argument with the resolved auto-key to prevent another from being injected
    }, autoKey)
}

function generateOptionSegments<_ResT, DataT, DefaultT>(opts: UseHttpOptions<_ResT, DataT, any, DefaultT, any, any>) {
    const segments: Array<string | undefined | Record<string, string>> = [
        toValue(opts.method as MaybeRef<string | undefined> | undefined)?.toUpperCase() || 'GET',
        toValue(opts.baseURL),
    ]
    for (const _obj of [opts.params || opts.query]) {
        const obj = toValue(_obj)
        if (!obj) { continue }

        const unwrapped: Record<string, string> = {}
        for (const [key, value] of Object.entries(obj)) {
            unwrapped[toValue(key)] = toValue(value)
        }
        segments.push(unwrapped)
    }
    return segments
}

export function useRequestHttp(): typeof global.$http {
    if (import.meta.client) {
        return globalThis.$http
    }

    return useRequestEvent()?.$http as typeof globalThis.$http || globalThis.$http
}