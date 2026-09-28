/**
 * A reusable in-memory server for the adapters: `UserService` implemented over
 * a record of users and served by Connect's `createRouterTransport`.
 *
 * The router is the path a real call takes minus the network: the request is
 * serialized, the handler runs with the call's headers, context values,
 * signal, and deadline, and its response or error comes back through the
 * Connect protocol. The default handlers read and write `users`, so a write
 * changes what the next read returns; a test replaces any handler it needs to
 * control. Every request a handler receives is recorded, as is every failure
 * the transport hands back to the adapter.
 */

import { Code, ConnectError, createRouterTransport } from '@connectrpc/connect'
import type {
  ContextValues,
  HandlerContext,
  Interceptor,
  ServiceImpl,
  StreamResponse,
  Transport,
} from '@connectrpc/connect'

import { UserService } from '../fixtures/generated'

/** The handlers of the fixture service, as an application implements them. */
export type UserHandlers = ServiceImpl<typeof UserService>

export type UserMethod = keyof UserHandlers

/** One request a handler received, with what the call carried. */
export interface HandledRequest {
  readonly method: UserMethod
  readonly request: unknown
  readonly header: Headers
  readonly values: ContextValues
  readonly signal: AbortSignal
  readonly timeoutMs: number | undefined
}

export interface UserRouter {
  readonly transport: Transport
  /** The server's records, which the default handlers read and write. */
  readonly users: Map<bigint, string>
  /** Every request a handler received, in order. */
  readonly handled: HandledRequest[]
  /** The requests `method` received, in order. */
  handledBy(method: UserMethod): HandledRequest[]
  /**
   * Every failure the transport handed back to the adapter, as the very
   * instance it handed back: a unary call's rejection, or the error a
   * stream's messages ended with.
   */
  readonly failures: unknown[]
}

export interface UserRouterOptions {
  /** Replaces the default handler of each method given. */
  handlers?: Partial<UserHandlers>
  /** The application's interceptors, as a transport it constructs has them. */
  interceptors?: Interceptor[]
  /** The records the server starts with. */
  users?: Iterable<readonly [bigint, string]>
}

export const DEFAULT_USERS: readonly (readonly [bigint, string])[] = [
  [1n, 'Ada'],
  [2n, 'Grace'],
]

/** Creates a router transport serving `UserService`. */
export function userRouter(options: UserRouterOptions = {}): UserRouter {
  const users = new Map<bigint, string>(options.users ?? DEFAULT_USERS)
  const handled: HandledRequest[] = []
  const failures: unknown[] = []

  const defaults: UserHandlers = {
    getUser: ({ id }) => {
      const name = users.get(id)
      if (name === undefined) {
        throw new ConnectError(`user ${String(id)} not found`, Code.NotFound)
      }
      return { name }
    },
    listUsers: ({ minId }) => ({
      names: [...users].filter(([id]) => id >= minId).map(([, name]) => name),
    }),
    updateUser: ({ id, name }) => {
      users.set(id, name)
      return { name }
    },
    async *watchUsers() {
      for (const name of users.values()) {
        yield { name }
      }
    },
  }
  const handlers = { ...defaults, ...options.handlers }

  function recorded(method: UserMethod): unknown {
    const handler = handlers[method] as (
      request: unknown,
      context: HandlerContext
    ) => unknown
    return (request: unknown, context: HandlerContext) => {
      handled.push({
        method,
        request,
        header: context.requestHeader,
        values: context.values,
        signal: context.signal,
        timeoutMs: context.timeoutMs(),
      })
      return handler(request, context)
    }
  }

  async function* recordStreamFailure(
    messages: AsyncIterable<unknown>
  ): AsyncIterable<unknown> {
    try {
      yield* messages
    } catch (error) {
      failures.push(error)
      throw error
    }
  }

  // Outermost, so what it records is exactly what the adapter receives.
  const recordFailures: Interceptor = next => async request => {
    try {
      const response = await next(request)
      return response.stream
        ? ({
            ...response,
            message: recordStreamFailure(response.message),
          } as StreamResponse)
        : response
    } catch (error) {
      failures.push(error)
      throw error
    }
  }

  const transport = createRouterTransport(
    ({ service }) => {
      service(UserService, {
        getUser: recorded('getUser'),
        listUsers: recorded('listUsers'),
        updateUser: recorded('updateUser'),
        watchUsers: recorded('watchUsers'),
      } as UserHandlers)
    },
    {
      transport: {
        interceptors: [recordFailures, ...(options.interceptors ?? [])],
      },
    }
  )

  return {
    transport,
    users,
    handled,
    handledBy: method => handled.filter(request => request.method === method),
    failures,
  }
}

/** A promise a test settles when it chooses, for a handler to wait on. */
export interface Hold<T = void> {
  readonly promise: Promise<T>
  release(value: T): void
}

export function hold<T = void>(): Hold<T> {
  let release!: (value: T) => void
  const promise = new Promise<T>(resolve => {
    release = resolve
  })
  return { promise, release }
}

/** Resolves once `signal` aborts, for a handler that runs until cancelled. */
export function aborted(signal: AbortSignal): Promise<void> {
  return new Promise(resolve => {
    if (signal.aborted) {
      resolve()
      return
    }
    signal.addEventListener('abort', () => resolve(), { once: true })
  })
}
