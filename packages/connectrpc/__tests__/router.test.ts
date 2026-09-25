/**
 * The adapters over Connect's own in-memory router transport, with an
 * application interceptor in front of it: the path a real call takes, minus
 * the network.
 *
 * What is under test is the division of labour. Authentication and metadata
 * are the application's interceptors' to add; the adapter never sees a token,
 * never keys on one, and hands the server's answer on.
 */

import { Code, ConnectError, createRouterTransport } from '@connectrpc/connect'
import type { Interceptor } from '@connectrpc/connect'
import { afterEach, describe, expect, it } from 'vitest'

import { buildConnectKey } from '../src/keys'
import { createConnectMutation } from '../src/mutation'
import { createConnectQuery } from '../src/query'
import { UserService } from './fixtures/schema'
import { disposeScopes, fieldOf, getUser, scope, settle } from './support/harness'

afterEach(() => {
  disposeScopes()
})

/** A server that answers with the caller it was told about, or refuses one it was not. */
function routerTransport(interceptors: Interceptor[]) {
  return createRouterTransport(
    ({ service }) => {
      service(UserService, {
        getUser: (request: { id: bigint }, context: { requestHeader: Headers }) => {
          const authorization = context.requestHeader.get('authorization')
          if (authorization === null) {
            throw new ConnectError('who are you?', Code.Unauthenticated)
          }
          return { name: `${authorization} asked for ${String(request.id)}` }
        },
        listUsers: () => ({}),
        watchUsers: async function* () {
          // Not called here.
        },
      } as never)
    },
    { transport: { interceptors } }
  )
}

describe('through a router transport', () => {
  it("authenticates through the application's interceptor, never the key", async () => {
    let token = 'secret-token'
    const authenticate: Interceptor = next => request => {
      request.header.set('authorization', `Bearer ${token}`)
      return next(request)
    }
    const root = scope({ default: routerTransport([authenticate]) })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 7n }))
    )
    await settle()
    await settle()

    expect(fieldOf(query.data(), 'name')).toBe(
      'Bearer secret-token asked for 7'
    )
    const { key } = buildConnectKey(getUser, () => ({ id: 7n }))
    const observation = root.client.observe(key)
    expect(observation.entry().status).toBe('success')
    observation.release()
    expect(JSON.stringify(key)).not.toMatch(/secret/)

    token = 'rotated-token'
    const { value: mutation } = root.mount(() => createConnectMutation(getUser))
    const written = await mutation.mutate({ id: 8n })
    expect(fieldOf(written, 'name')).toBe('Bearer rotated-token asked for 8')
  })

  it("hands on the server's refusal, leaving authorization to the server", async () => {
    const root = scope({ default: routerTransport([]) })

    const { value: query } = root.mount(() =>
      createConnectQuery(getUser, () => ({ id: 1n }))
    )
    await settle()
    await settle()

    expect(query.error()).toBeInstanceOf(ConnectError)
    expect((query.error() as ConnectError).code).toBe(Code.Unauthenticated)
  })
})
