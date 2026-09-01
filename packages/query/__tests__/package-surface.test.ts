/**
 * Scaffold-level guarantees for @tachui/query.
 *
 * These cover the parts of the package that are contracts rather than behaviour:
 * the barrel's export list, the documented defaults, and the environment probes
 * that later phases build their safety checks on.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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
      'DEV',
      'QueryError',
      'isDevelopment',
      'isServer',
    ])
  })
})

describe('package manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8')
  ) as {
    dependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    optionalDependencies?: Record<string, string>
    scripts?: Record<string, string>
    tachui?: { sizeBudget?: { entry?: string; gzipBytes?: number } }
  }

  // Nothing else in the toolchain notices a new dependency: the size budget
  // measures only relative imports, and vite inlines anything not marked
  // external. So the zero-runtime-deps promise is only enforced here.
  it('carries @tachui/core as its only runtime dependency', () => {
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(['@tachui/core'])
  })

  it('declares no peer or optional dependencies', () => {
    expect(manifest.peerDependencies).toBeUndefined()
    expect(manifest.optionalDependencies).toBeUndefined()
  })

  it('exposes the workspace-standard aggregate check', () => {
    expect(manifest.scripts?.valid).toBeDefined()
  })

  // The size gate is opt-in: tools/check-size-budget.mjs skips any package with
  // no `tachui.sizeBudget` and exits 0 when none declares one. Without this
  // assertion, deleting or renaming the field leaves both the test suite and CI
  // green while acceptance criterion 2 quietly stops being enforced.
  it('declares the size budget the CI gate enforces', () => {
    expect(manifest.tachui?.sizeBudget).toEqual({
      entry: 'dist/index.js',
      gzipBytes: 12288,
    })
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

  it('is false when there is no process, so browser bundles ship no dev checks', () => {
    vi.stubGlobal('process', undefined)
    expect(isDevelopment()).toBe(false)
  })

  it('treats an unset NODE_ENV as development', () => {
    vi.stubGlobal('process', {})
    expect(isDevelopment()).toBe(true)
  })

  it('is false when reading the environment throws', () => {
    // A hardened runtime can expose `process` but refuse to hand over `env`.
    vi.stubGlobal(
      'process',
      new Proxy(
        {},
        {
          get() {
            throw new Error('blocked')
          },
        }
      )
    )
    expect(isDevelopment()).toBe(false)
  })
})
