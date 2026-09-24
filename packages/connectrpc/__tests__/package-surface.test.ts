// @vitest-environment node
// Node rather than the shared jsdom environment: the build section imports the
// Vite config, and esbuild refuses to load under jsdom's globals.

/**
 * Scaffold-level guarantees for @tachui/connectrpc.
 *
 * These cover the parts of the package that are contracts rather than
 * behaviour: the barrel's runtime exports, the retry allowlist, the manifest's
 * dependency shape, and the build's external list. What only a packed install
 * can prove - the exports map, one copy of each peer, tree-shaking, the peer
 * floors - is `tools/smoke-connectrpc-packed.mjs`.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { Code } from '@connectrpc/connect'
import type { UserConfig } from 'vite'
import { describe, expect, it } from 'vitest'

import * as connectrpc from '../src/index'
import viteConfig from '../vite.config'

describe('@tachui/connectrpc barrel', () => {
  it('exports exactly the runtime surface the package documents', () => {
    expect(Object.keys(connectrpc).sort()).toEqual([
      'DEFAULT_TRANSPORT_NAME',
      'isRetryableCode',
    ])
  })
})

describe('DEFAULT_TRANSPORT_NAME', () => {
  it("is 'default', the name every unnamed transport and key shares", () => {
    expect(connectrpc.DEFAULT_TRANSPORT_NAME).toBe('default')
  })
})

describe('isRetryableCode', () => {
  const codes = Object.values(Code).filter(
    (value): value is Code => typeof value === 'number'
  )

  it('admits only unavailable and resource_exhausted', () => {
    expect(codes.filter(code => connectrpc.isRetryableCode(code)).sort()).toEqual(
      [Code.ResourceExhausted, Code.Unavailable].sort()
    )
  })

  // The codes the adapter contract names as never retried. Listed rather than
  // derived, so a change to the predicate cannot quietly move one across.
  it.each([
    ['unauthenticated', Code.Unauthenticated],
    ['permission_denied', Code.PermissionDenied],
    ['invalid_argument', Code.InvalidArgument],
    ['not_found', Code.NotFound],
    ['already_exists', Code.AlreadyExists],
    ['canceled', Code.Canceled],
    ['deadline_exceeded', Code.DeadlineExceeded],
  ])('never retries %s', (_name, code) => {
    expect(connectrpc.isRetryableCode(code)).toBe(false)
  })
})

describe('package manifest', () => {
  const manifest = JSON.parse(
    readFileSync(resolve(import.meta.dirname, '../package.json'), 'utf8')
  ) as {
    private?: boolean
    sideEffects?: boolean
    dependencies?: Record<string, string>
    peerDependencies?: Record<string, string>
    peerDependenciesMeta?: Record<string, unknown>
    optionalDependencies?: Record<string, string>
    devDependencies?: Record<string, string>
    exports?: Record<string, Record<string, string>>
    scripts?: Record<string, string>
  }

  // Born private: it flips public in the release PR that cuts the 0.12.0 line.
  it('is private until its line move', () => {
    expect(manifest.private).toBe(true)
  })

  it('carries @tachui/query as its only runtime dependency, pinned exactly', () => {
    expect(Object.keys(manifest.dependencies ?? {})).toEqual(['@tachui/query'])
    expect(manifest.dependencies?.['@tachui/query']).toMatch(/^\d+\.\d+\.\d+$/)
  })

  // A Connect runtime in `dependencies` could install a second copy beside the
  // application's, with its own `ConnectError` class.
  it('takes Connect and Protobuf as required peers, never as dependencies', () => {
    expect(manifest.peerDependencies).toEqual({
      '@bufbuild/protobuf': '^2.2.0',
      '@connectrpc/connect': '^2.0.0',
    })
    expect(manifest.peerDependenciesMeta).toBeUndefined()
    expect(manifest.optionalDependencies).toBeUndefined()
  })

  it('develops against every peer it declares', () => {
    for (const peer of Object.keys(manifest.peerDependencies ?? {})) {
      expect(manifest.devDependencies?.[peer]).toBeDefined()
    }
  })

  it('is free of side effects, so an unused import costs nothing', () => {
    expect(manifest.sideEffects).toBe(false)
  })

  it('exposes one entry point carrying both runtime and types', () => {
    expect(manifest.exports).toEqual({
      '.': { types: './dist/index.d.ts', import: './dist/index.js' },
    })
  })

  it('exposes the workspace-standard aggregate check', () => {
    expect(manifest.scripts?.valid).toBeDefined()
  })
})

describe('build', () => {
  const config = (viteConfig as (env: { mode: string; command: 'build' }) => UserConfig)({
    mode: 'production',
    command: 'build',
  })
  const external = config.build?.rollupOptions?.external as (id: string) => boolean

  it.each([
    '@connectrpc/connect',
    '@connectrpc/connect/protocol',
    '@bufbuild/protobuf',
    '@bufbuild/protobuf/codegenv2',
    '@tachui/query',
    '@tachui/core',
    '@tachui/core/runtime',
    'node:fs',
  ])('leaves %s to the application', id => {
    expect(external(id)).toBe(true)
  })

  it.each(['./types', '../src/defaults', '@connectrpc/connect-web-extra', '@tachui/queryx'])(
    'bundles %s',
    id => {
      expect(external(id)).toBe(false)
    }
  )
})
