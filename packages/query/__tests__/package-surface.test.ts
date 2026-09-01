/**
 * Scaffold-level guarantees for @tachui/query.
 *
 * These cover the parts of the package that are contracts rather than behaviour:
 * the barrel's export list, the documented defaults, and the environment probes
 * that later phases build their safety checks on.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'

import * as query from '../src/index'
import {
  DEFAULT_ENABLED,
  DEFAULT_GC_TIME,
  DEFAULT_RETRY,
  DEFAULT_SNAPSHOT,
  DEFAULT_STALE_TIME,
} from '../src/defaults'
import { isDevelopment, isServer, QueryError } from '../src/errors'

describe('@tachui/query barrel', () => {
  it('exports exactly the runtime surface the package documents', () => {
    expect(Object.keys(query).sort()).toEqual([
      'DEFAULT_ENABLED',
      'DEFAULT_GC_TIME',
      'DEFAULT_RETRY',
      'DEFAULT_SNAPSHOT',
      'DEFAULT_STALE_TIME',
      'QueryError',
      'isDevelopment',
      'isServer',
    ])
  })
})

describe('defaults', () => {
  it('treats cached data as stale immediately so nothing silently serves old data', () => {
    expect(DEFAULT_STALE_TIME).toBe(0)
  })

  it('retains an unobserved entry for five minutes', () => {
    expect(DEFAULT_GC_TIME).toBe(300_000)
  })

  it('keeps staleTime and gcTime distinct', () => {
    expect(DEFAULT_STALE_TIME).not.toBe(DEFAULT_GC_TIME)
  })

  it('does not retry unless a policy asks for it', () => {
    expect(DEFAULT_RETRY).toBe(0)
  })

  it('fetches by default', () => {
    expect(DEFAULT_ENABLED).toBe(true)
  })

  it('keeps SSR snapshot serialization opt-in', () => {
    expect(DEFAULT_SNAPSHOT).toBe(false)
  })
})

describe('QueryError', () => {
  it('prefixes the package name so the source of the failure is unambiguous', () => {
    expect(new QueryError('key is not serializable').message).toBe(
      '[@tachui/query] key is not serializable'
    )
  })

  it('is an Error with its own name, so error boundaries can branch on it', () => {
    const error = new QueryError('boom')
    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe('QueryError')
  })

  it('preserves an underlying cause', () => {
    const cause = new Error('socket closed')
    expect(new QueryError('load failed', { cause }).cause).toBe(cause)
  })
})

describe('isServer', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('is false in a document environment', () => {
    expect(isServer()).toBe(false)
  })

  it('is true when there is no document', () => {
    vi.stubGlobal('document', undefined)
    expect(isServer()).toBe(true)
  })
})

describe('isDevelopment', () => {
  const originalNodeEnv = process.env.NODE_ENV

  afterEach(() => {
    // Unstub first: the cases below replace `process` wholesale, so restoring
    // NODE_ENV before that would write to the stub.
    vi.unstubAllGlobals()
    process.env.NODE_ENV = originalNodeEnv
  })

  it('is false in production', () => {
    process.env.NODE_ENV = 'production'
    expect(isDevelopment()).toBe(false)
  })

  it('is true in development', () => {
    process.env.NODE_ENV = 'development'
    expect(isDevelopment()).toBe(true)
  })

  it('is true under test', () => {
    process.env.NODE_ENV = 'test'
    expect(isDevelopment()).toBe(true)
  })

  it('fails open when there is no process at all', () => {
    vi.stubGlobal('process', undefined)
    expect(isDevelopment()).toBe(true)
  })

  it('fails open when process carries no env', () => {
    vi.stubGlobal('process', {})
    expect(isDevelopment()).toBe(true)
  })
})
