/**
 * Keeps the adapter suites off the network.
 *
 * Every browser path to a server — `fetch`, `XMLHttpRequest`, `WebSocket`,
 * and `EventSource` — is replaced for each test by one that refuses and
 * records the attempt, and a test that made any attempt fails once it ends.
 * Refusing alone is not enough: a transport turns a failed `fetch` into a
 * `ConnectError`, which a test about failures could mistake for the one it
 * expected. Recording the attempt fails that test anyway.
 *
 * Importing this module registers the hooks for the importing test file, and
 * the harness imports it, so every suite that mounts an adapter is covered. A
 * transport that needs to exchange bytes takes an HTTP client or `fetch` of
 * the test's own, never the global one.
 */

import { afterEach, beforeEach, vi } from 'vitest'

const attempts: string[] = []

function refuse(api: string, target: unknown): Error {
  const attempt = `${api} ${String(target)}`
  attempts.push(attempt)
  return new Error(`a test attempted a real network request: ${attempt}`)
}

function urlOf(input: unknown): unknown {
  return input instanceof Request ? input.url : input
}

class RefusedRequest {
  open(method: string, url: unknown): void {
    throw refuse(`XMLHttpRequest ${method}`, url)
  }
  send(): void {
    throw refuse('XMLHttpRequest', 'send() without open()')
  }
}

class RefusedWebSocket {
  constructor(url: unknown) {
    throw refuse('WebSocket', url)
  }
}

class RefusedEventSource {
  constructor(url: unknown) {
    throw refuse('EventSource', url)
  }
}

beforeEach(() => {
  attempts.length = 0
  vi.stubGlobal('fetch', (input: unknown) =>
    Promise.reject(refuse('fetch', urlOf(input)))
  )
  vi.stubGlobal('XMLHttpRequest', RefusedRequest)
  vi.stubGlobal('WebSocket', RefusedWebSocket)
  vi.stubGlobal('EventSource', RefusedEventSource)
})

afterEach(() => {
  vi.unstubAllGlobals()
  const made = attempts.splice(0)
  if (made.length > 0) {
    throw new Error(
      `A test attempted ${String(made.length)} real network request(s): ${made.join('; ')}. Give the transport a router or an HTTP client of the test's own.`
    )
  }
})

/**
 * Hands back, and forgets, the attempts refused so far in this test. Only the
 * guard's own tests call it: anywhere else an attempt is a failure.
 */
export function takeNetworkAttempts(): string[] {
  return attempts.splice(0)
}
