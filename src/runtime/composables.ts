import type { FetchConfig } from '@refactorjs/ofetch'
import type { FetchError } from 'ofetch'
import type { TypedInternalResponse, NitroFetchRequest, AvailableRouterMethod } from 'nitropack'
import type { AsyncDataOptions, AsyncData } from '#app'
import { computed, unref, Ref, reactive } from 'vue'
import { useAsyncData, useNuxtApp } from '#imports'
import { hash } from 'ohash'

export type _Transform<Input = any, Output = any> = (input: Input) => Output
export type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : Pick<T, K[number]> : T
export type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : string : never>
export type KeyOfRes<Transform extends _Transform> = KeysOf<ReturnType<Transform>>

export interface NitroFetchOptions<R extends NitroFetchRequest, M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>> extends Omit<FetchConfig, 'method'> {
    method?: Uppercase<M> | M;
}

type ComputedOptions<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Function ? T[K] : T[K] extends Record<string, any> ? ComputedOptions<T[K]> | Ref<T[K]> | T[K] : Ref<T[K]> | T[K]
}

export type ComputedFetchOptions<R extends NitroFetchRequest, M extends AvailableRouterMethod<R>> = ComputedOptions<NitroFetchOptions<R, M>>

export type FetchResult<ReqT extends NitroFetchRequest, M extends AvailableRouterMethod<ReqT>> = TypedInternalResponse<ReqT, unknown, M>

export interface UseHttpOptions<
    DataT,
    Transform extends _Transform<DataT, any> = _Transform<DataT, DataT>,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>,
    R extends NitroFetchRequest = string & {},
    M extends AvailableRouterMethod<R> = AvailableRouterMethod<R>
> extends AsyncDataOptions<DataT, Transform, PickKeys>, ComputedFetchOptions<R, M> {
    key?: string
}

export function useHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: UseHttpOptions<_ResT, Transform, PickKeys, ReqT, Method>
): AsyncData<PickFrom<ReturnType<Transform>, PickKeys>, ErrorT | null | true>
export function useHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    arg1?: string | UseHttpOptions<_ResT, Transform, PickKeys, ReqT, Method>,
    arg2?: string
) {
    const [opts = {}, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]
    const _key = opts.key || hash([autoKey, unref(opts.baseURL), typeof request === 'string' ? request : '', unref(opts.params || opts.query)])

    if (!_key || typeof _key !== 'string') {
        throw new TypeError('[nuxt] [useFetch] key must be a string: ' + _key)
    }

    if (!request) {
        throw new Error('[nuxt] [useHttp] request is missing.')
    }

    const key = _key === autoKey ? '$h' + _key : _key

    const _request = computed(() => {
        let r = request
        if (typeof r === 'function') {
          r = r()
        }
        return unref(r)
    })

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

    const _asyncDataOptions: AsyncDataOptions<_ResT, Transform, PickKeys> = {
        server,
        lazy,
        default: defaultFn,
        transform,
        pick,
        immediate,
        watch: [
            _fetchOptions,
            _request,
            ...(watch || [])
        ]
    }

    const { $http } = useNuxtApp()

    const asyncData = useAsyncData<_ResT, ErrorT, Transform, PickKeys>(key, () => {
        return $http.request(_request.value, _fetchOptions as FetchConfig) as Promise<_ResT>
    }, _asyncDataOptions)

    return asyncData
}

export function useLazyHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: Omit<UseHttpOptions<_ResT, Transform, PickKeys, Method>, 'lazy'>
): AsyncData<PickFrom<ReturnType<Transform>, PickKeys>, ErrorT | null | true>
export function useLazyHttp<
    ResT = void,
    ErrorT = FetchError,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    Method extends AvailableRouterMethod<ReqT> = 'get' extends AvailableRouterMethod<ReqT> ? 'get' : AvailableRouterMethod<ReqT>,
    _ResT = ResT extends void ? FetchResult<ReqT, Method> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    arg1?: string | Omit<UseHttpOptions<_ResT, Transform, PickKeys, Method>, 'lazy'>,
    arg2?: string
) {

    const [opts, autoKey] = typeof arg1 === 'string' ? [{}, arg1] : [arg1, arg2]

    return useHttp<ResT, ErrorT, ReqT, _ResT, Transform, PickKeys>(request, {
        ...opts,
        lazy: true
        // @ts-ignore
    }, autoKey)
}