/**
 * Named transport provision through the component environment.
 *
 * Applications construct and configure their transports; this module only
 * makes them reachable from a component subtree by name. Nothing lives in a
 * module-level slot: each component context holds the transports it provided,
 * and lookup walks the context's parent chain, so separate roots and
 * concurrent server renders never see each other's transports.
 *
 * Cache identity is the name, not the `Transport` object (ADR 0001), so within
 * one `QueryClient` a name must mean one logical backend. Every provision
 * records its binding against the nearest provided client, and a different
 * `Transport` under a name that client has already bound is refused for the
 * client's lifetime — otherwise a rebind after an account change would serve
 * entries cached for the previous backend. Lookup holds the consuming scope's
 * client to the same binding, so sibling subtrees under one client cannot
 * resolve one name to two transports through different ancestors.
 */

import type { Transport } from '@connectrpc/connect'
import {
  createEnvironmentKey,
  getCurrentComponentContextOrNull,
} from '@tachui/core'
import { QueryClientKey } from '@tachui/query'
import type { QueryClient } from '@tachui/query'

import { DEFAULT_TRANSPORT_NAME } from './defaults'
import { ConnectAdapterError } from './errors'
import type {
  ConnectTransportName,
  ProvideConnectTransportOptions,
} from './types'

/**
 * Environment key for the transports one component context provided itself.
 * Deliberately not an inherited value: the map belongs to one scope, and a name
 * missing from it is looked up in the parent's.
 */
const ConnectTransportsKey = createEnvironmentKey<
  Map<ConnectTransportName, Transport>
>('ConnectTransports')

/**
 * The transport each client has bound to each name. Keyed by the client, so a
 * binding is only ever visible to code already holding that client, and it is
 * collected with it — this is not a shared transport slot.
 */
const clientBindings = new WeakMap<
  QueryClient,
  Map<ConnectTransportName, Transport>
>()

/** A resolved transport and the name that is its cache identity. */
export interface ResolvedConnectTransport {
  name: ConnectTransportName
  transport: Transport
}

function isTransport(value: unknown): value is Transport {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Transport).unary === 'function' &&
    typeof (value as Transport).stream === 'function'
  )
}

function describeName(name: ConnectTransportName): string {
  return name === DEFAULT_TRANSPORT_NAME
    ? `the default transport ('${DEFAULT_TRANSPORT_NAME}')`
    : `transport ${JSON.stringify(name)}`
}

/**
 * The name is cache identity, so it must be one a diagnostic can show and a
 * reader can tell apart from `'default'`.
 */
function assertValidName(name: unknown): asserts name is ConnectTransportName {
  if (typeof name !== 'string' || name.trim() === '') {
    const given = typeof name === 'string' ? JSON.stringify(name) : typeof name
    throw new ConnectAdapterError(
      `provideConnectTransport() was given ${given} as a transport name. A name must be a non-empty string; omit it to provide the default transport.`
    )
  }
}

/**
 * Records `transport` as the one `client` means by `name`, or throws with
 * `conflict()` if the client has already bound a different one.
 */
function bindToClient(
  client: QueryClient,
  name: ConnectTransportName,
  transport: Transport,
  conflict: () => string
): void {
  let bindings = clientBindings.get(client)
  const bound = bindings?.get(name)
  if (bound !== undefined && bound !== transport) {
    throw new ConnectAdapterError(conflict())
  }
  if (bindings === undefined) {
    bindings = new Map()
    clientBindings.set(client, bindings)
  }
  bindings.set(name, transport)
}

/**
 * Exposes an application-constructed transport to the component subtree.
 *
 * Call it once per scope, during setup or render, below a `provideQueryClient`
 * call. Re-providing the same `Transport` under the same name in the same scope
 * is a no-op, so a render that runs again is safe; anything else that would
 * give one name two meanings throws a `ConnectAdapterError`.
 */
export function provideConnectTransport(
  transport: Transport,
  options?: ProvideConnectTransportOptions
): void {
  const name = options?.name ?? DEFAULT_TRANSPORT_NAME
  assertValidName(name)
  const context = getCurrentComponentContextOrNull()
  if (context === null) {
    throw new ConnectAdapterError(
      `provideConnectTransport() for ${describeName(name)} requires a component context. Call it during a component render, or inside runWithComponentContext() in tests and setup code.`
    )
  }
  if (!isTransport(transport)) {
    throw new ConnectAdapterError(
      `provideConnectTransport() for ${describeName(name)} was given ${transport === null ? 'null' : typeof transport}, not a Connect Transport. Construct one with your transport package (for example createConnectTransport() from @connectrpc/connect-web) and pass it in.`
    )
  }

  // The provided client only — never useQueryClient()'s ambient browser
  // fallback. A binding recorded against a client the application never chose
  // would be shared with every other subtree that also fell back to it.
  const client = context.consume<QueryClient>(QueryClientKey.symbol)
  if (client === undefined) {
    throw new ConnectAdapterError(
      `provideConnectTransport() for ${describeName(name)} found no QueryClient. Create one with createQueryClient() and expose it with provideQueryClient() in this scope or an ancestor before providing transports: a transport name is cache identity within one client, so the client it belongs to must be explicit.`
    )
  }

  const own = context.providers.get(ConnectTransportsKey.symbol) as
    | Map<ConnectTransportName, Transport>
    | undefined
  const existing = own?.get(name)
  if (existing === transport) {
    return
  }
  if (existing !== undefined) {
    throw new ConnectAdapterError(
      `${describeName(name)} is already provided in this scope. Provide each name once per scope; to use a different transport, provide it in a nested scope under its own QueryClient, or give it a different name.`
    )
  }

  bindToClient(
    client,
    name,
    transport,
    () =>
      `${describeName(name)} is already bound to a different Transport for this QueryClient. A transport name identifies one backend within a client, so rebinding it — including after an account change — could serve entries cached for the previous one. Use a new QueryClient for the new backend or account, or provide the transport under a different name.`
  )

  if (own === undefined) {
    context.provide(ConnectTransportsKey.symbol, new Map([[name, transport]]))
  } else {
    own.set(name, transport)
  }
}

/**
 * Resolves a transport and its cache identity from the nearest provider.
 *
 * The name is returned alongside the transport because it — `'default'`
 * included — is what a query key carries, never the object.
 */
export function resolveConnectTransport(
  name: ConnectTransportName = DEFAULT_TRANSPORT_NAME
): ResolvedConnectTransport {
  const context = getCurrentComponentContextOrNull()
  if (context === null) {
    throw new ConnectAdapterError(
      `Looking up ${describeName(name)} requires a component context. Call it during a component render, or inside runWithComponentContext() in tests and setup code.`
    )
  }

  let scope: typeof context | undefined = context
  while (scope !== undefined) {
    const own = scope.providers.get(ConnectTransportsKey.symbol) as
      | Map<ConnectTransportName, Transport>
      | undefined
    const transport = own?.get(name)
    if (transport !== undefined) {
      // The consuming scope's client caches under this name and may be nearer
      // than the provider's, so it is the client that must agree. Binding here
      // too means a sibling that provides later is refused, whatever the order.
      const client = context.consume<QueryClient>(QueryClientKey.symbol)
      if (client !== undefined) {
        bindToClient(
          client,
          name,
          transport,
          () =>
            `${describeName(name)} resolves here to a different Transport than the one this scope's QueryClient has bound to that name, so one client would cache two backends under it. Provide the transport where that QueryClient is provided, so every scope under the client resolves the same one, or give the scope that shadows it its own QueryClient.`
        )
      }
      return { name, transport }
    }
    scope = scope.parent
  }

  const call =
    name === DEFAULT_TRANSPORT_NAME
      ? 'provideConnectTransport(transport)'
      : `provideConnectTransport(transport, { name: ${JSON.stringify(name)} })`
  throw new ConnectAdapterError(
    `No provider for ${describeName(name)}. Call ${call} in this component or an ancestor, below provideQueryClient().`
  )
}

/**
 * Returns the transport provided under `name` (default `'default'`) by the
 * nearest scope, or throws a `ConnectAdapterError` naming what is missing.
 */
export function useConnectTransport(name?: ConnectTransportName): Transport {
  return resolveConnectTransport(name).transport
}
