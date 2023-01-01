import type { FetchConfig } from '@refactorjs/ofetch'
import type { TypedInternalResponse, NitroFetchRequest } from 'nitropack'
import type { AsyncDataOptions, AsyncData } from '#app'
import { computed, unref, Ref, reactive } from 'vue'
import { useAsyncData, useNuxtApp } from '#imports'
import { hash } from 'ohash'

type _Transform<Input = any, Output = any> = (input: Input) => Output
type PickFrom<T, K extends Array<string>> = T extends Array<any> ? T : T extends Record<string, any> ? keyof T extends K[number] ? T : Pick<T, K[number]> : T
type KeysOf<T> = Array<T extends T ? keyof T extends string ? keyof T : string : never>
type KeyOfRes<Transform extends _Transform> = KeysOf<ReturnType<Transform>>

type ComputedOptions<T extends Record<string, any>> = {
    [K in keyof T]: T[K] extends Function ? T[K] : T[K] extends Record<string, any> ? ComputedOptions<T[K]> | Ref<T[K]> | T[K] : Ref<T[K]> | T[K]
}

type ComputedFetchOptions = ComputedOptions<FetchConfig>

export type FetchResult<ReqT extends NitroFetchRequest> = TypedInternalResponse<ReqT, unknown>

export interface UseHttpOptions<
    DataT,
    Transform extends _Transform<DataT, any> = _Transform<DataT, DataT>,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
> extends AsyncDataOptions<DataT, Transform, PickKeys>, ComputedFetchOptions {
    key?: string
}

export function useHttp<
    ResT = void,
    ErrorT = Error,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    _ResT = ResT extends void ? FetchResult<ReqT> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: UseHttpOptions<_ResT, Transform, PickKeys>
): AsyncData<PickFrom<ReturnType<Transform>, PickKeys>, ErrorT | null | true>
export function useHttp<
    ResT = void,
    ErrorT = Error,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    _ResT = ResT extends void ? FetchResult<ReqT> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts: UseHttpOptions<_ResT, Transform, PickKeys> = {}
) {
    if (!request) {
        throw new Error('[nuxt] [useHttp] request is missing.')
    }

    const key = (opts.key || '$h' + hash([request, { ...opts, transform: null }]))

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
        return $http.request(_request.value, _fetchOptions) as Promise<_ResT>
    }, _asyncDataOptions)

    return asyncData
}

export function useLazyHttp<
    ResT = void,
    ErrorT = Error,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    _ResT = ResT extends void ? FetchResult<ReqT> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts?: Omit<UseHttpOptions<_ResT, Transform, PickKeys>, 'lazy'>
): AsyncData<PickFrom<ReturnType<Transform>, PickKeys>, ErrorT | null | true>
export function useLazyHttp<
    ResT = void,
    ErrorT = Error,
    ReqT extends NitroFetchRequest = NitroFetchRequest,
    _ResT = ResT extends void ? FetchResult<ReqT> : ResT,
    Transform extends (res: _ResT) => any = (res: _ResT) => _ResT,
    PickKeys extends KeyOfRes<Transform> = KeyOfRes<Transform>
>(
    request: Ref<ReqT> | ReqT | (() => ReqT),
    opts: Omit<UseHttpOptions<_ResT, Transform, PickKeys>, 'lazy'> = {},
) {

    return useHttp<ResT, ErrorT, ReqT, _ResT, Transform, PickKeys>(request, {
        ...opts,
        lazy: true
    })
}