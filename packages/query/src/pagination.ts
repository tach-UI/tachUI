/**
 * The one place a run of pages is loaded.
 *
 * `fetchInfiniteQuery` and `createInfiniteQuery`'s refetch both walk a set
 * front to back, feeding each page to `getNextPageParam` to find the one after
 * it. Written twice they would drift — one would learn to stop on an abort, or
 * to treat `null` as the end, and the other would not.
 */

import { QueryError } from './errors'
import type {
  GetPageParam,
  InfiniteData,
  InfiniteQueryLoadContext,
  QueryKey,
} from './types'

/**
 * Whether a param means "there is no page that way".
 *
 * Both spellings count. `undefined` is what this package's own types return,
 * but `null` is what a JSON cursor API actually sends, and a source whose
 * `getNextPageParam` forwards `page.cursor` hands back `null` at the end of a
 * feed. Compared loosely on purpose: the alternative is `hasNextPage` staying
 * true forever and an infinite-scroll sentinel re-requesting the same page
 * against the server without bound.
 */
export function isEndOfSet(pageParam: unknown): boolean {
  return pageParam == null
}

/**
 * Marks an error as coming from a page-param function rather than from a load.
 *
 * The two fail for different reasons and deserve different treatment: a load
 * can fail because a network did, which is what retrying is for, while a param
 * function that throws will throw again on identical input. Retrying it spends
 * the whole policy to arrive at the same error, slower.
 */
const PAGE_PARAM_FAULT = Symbol.for('tachui.query.pageParamFault')

/** Whether an error came from a page-param function. */
export function isPageParamFault(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as Record<PropertyKey, unknown>)[PAGE_PARAM_FAULT] === true
  )
}

/**
 * Calls a page-param function, tagging whatever it throws.
 *
 * The original error is kept as the cause rather than replaced: what the
 * function threw is what the consumer needs to see.
 */
export function callPageParam<TPage, TPageParam>(
  get: GetPageParam<TPage, TPageParam>,
  page: TPage,
  pages: readonly TPage[],
  pageParam: TPageParam,
  pageParams: readonly TPageParam[]
): TPageParam | null | undefined {
  try {
    return get(page, pages, pageParam, pageParams)
  } catch (thrown) {
    const fault = new QueryError(
      `a page-param function threw: ${
        thrown instanceof Error ? thrown.message : String(thrown)
      }`,
      { cause: thrown }
    )
    Object.defineProperty(fault, PAGE_PARAM_FAULT, { value: true })
    throw fault
  }
}

/**
 * Rejects the param values the protocol has already spoken for.
 *
 * `getNextPageParam` returns `undefined` or `null` to say there is no page that
 * way, so a set can never hold either as a param — an `initialPageParam` of
 * `undefined` means "start from the page that does not exist". Left alone it
 * loads nothing and reports `success` with an empty set, which reads as a
 * server with no data rather than as the mistake it is.
 *
 * Type-legal whenever `TPageParam` includes them, so it is caught here rather
 * than by the compiler.
 */
export function assertPageParam<TPageParam>(
  pageParam: TPageParam,
  from: string
): void {
  if (isEndOfSet(pageParam)) {
    throw new QueryError(
      `${from}: initialPageParam cannot be ${String(pageParam)}. That is how ` +
        'getNextPageParam says there is no page in a direction, so a set can ' +
        'never hold it as a param.'
    )
  }
}

/** A positive whole retained-page bound, or a message naming what arrived. */
export function assertPageCap(cap: number | undefined, from: string): void {
  if (cap === undefined) {
    return
  }
  if (!Number.isInteger(cap) || cap < 1) {
    throw new QueryError(
      `${from}: maxPages must be a positive integer, received ${String(cap)}. ` +
        'A cap below one leaves a set that holds nothing and cannot be ' +
        'extended from either end.'
    )
  }
}

/** Positive whole pages, or a message naming what arrived. */
export function assertPageCount(count: number, from: string): void {
  if (!Number.isInteger(count) || count < 1) {
    throw new QueryError(
      `${from}: pages must be a positive integer, received ${String(count)}.`
    )
  }
}

/** What loading a run of pages needs, from either caller's options. */
export interface PageRun<TPage, TPageParam> {
  readonly load: (ctx: InfiniteQueryLoadContext<TPageParam>) => Promise<TPage>
  readonly getNextPageParam: GetPageParam<TPage, TPageParam>
}

/**
 * Loads a run of pages, front to back, feeding each result to
 * `getNextPageParam` to find the next.
 *
 * Sequential by necessity rather than by choice: a cursor is only known once
 * the page before it has landed. Stops early when the source says there is no
 * next page, so asking for more pages than exist is not an error, and stops on
 * an abort, so a key change or a disposed client does not keep firing one
 * request per remaining page at a key nothing is watching.
 */
export async function loadPageRun<TPage, TPageParam>(
  options: PageRun<TPage, TPageParam>,
  signal: AbortSignal,
  key: QueryKey,
  count: number,
  from: TPageParam,
  // Applied per page. Retrying the run would replay the pages that already
  // landed, so one flaky page in a long set costs a request per page per
  // attempt. Defaults to a single try for the imperative fetch, which declares
  // no retry policy at all.
  withRetry: <T>(work: () => Promise<T>) => Promise<T> = (work) => work()
): Promise<InfiniteData<TPage, TPageParam>> {
  const pages: TPage[] = []
  const pageParams: TPageParam[] = []
  let pageParam: TPageParam | null | undefined = from

  for (let index = 0; index < count; index += 1) {
    // Broken rather than thrown, so a partly loaded set still comes back as one
    // value and the generation guard decides whether it lands — the same way
    // the loop already handles a source that shortened.
    if (isEndOfSet(pageParam) || signal.aborted) {
      break
    }
    const param = pageParam as TPageParam
    const page = await withRetry(() =>
      options.load({
        signal,
        key,
        pageParam: param,
        // A run from the front is a series of forward loads, including the
        // first: there is nothing behind it to go backward from.
        direction: 'forward',
      })
    )
    pages.push(page)
    pageParams.push(param)
    pageParam = callPageParam(
      options.getNextPageParam,
      page,
      pages,
      param,
      pageParams
    )
  }

  return { pages, pageParams }
}
