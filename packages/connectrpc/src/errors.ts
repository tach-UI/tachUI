/**
 * Errors for @tachui/connectrpc.
 */

/**
 * Error raised for programming mistakes in adapter usage - a transport
 * provided twice, a name nothing provides, a missing client.
 *
 * Its own class rather than `@tachui/query`'s `QueryError`, whose message
 * prefix would name the wrong package. Never used for a failed call: those stay
 * `ConnectError`, so an error boundary can tell a misuse from a server answer.
 */
export class ConnectAdapterError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(`[@tachui/connectrpc] ${message}`, options)
    this.name = 'ConnectAdapterError'
  }
}
