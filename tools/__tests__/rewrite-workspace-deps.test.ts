import { describe, expect, it } from 'vitest'
import { rewriteManifest } from '../rewrite-workspace-deps.mjs'

const VERSIONS = new Map([
  ['@tachui/core', '0.8.28'],
  ['@tachui/types', '0.8.28'],
  ['@tachui/registry', '0.8.28'],
])

describe('rewriteManifest', () => {
  it('rewrites every supported workspace range form to the exact version in dependencies', () => {
    const errors: string[] = []
    const manifest = {
      name: '@tachui/primitives',
      version: '0.8.29',
      dependencies: {
        '@tachui/core': 'workspace:*',
        '@tachui/types': 'workspace:^0.8.0',
      },
    }

    const changes = rewriteManifest(manifest, VERSIONS, errors)

    expect(errors).toEqual([])
    expect(manifest.dependencies).toEqual({
      '@tachui/core': '0.8.28',
      '@tachui/types': '0.8.28',
    })
    expect(changes).toHaveLength(2)
  })

  it('rewrites bare workspace: (empty range) to the exact version', () => {
    const errors: string[] = []
    const manifest = {
      name: '@tachui/primitives',
      version: '0.8.29',
      dependencies: { '@tachui/core': 'workspace:' },
    }

    rewriteManifest(manifest, VERSIONS, errors)

    expect(errors).toEqual([])
    expect(manifest.dependencies['@tachui/core']).toBe('0.8.28')
  })

  it('emits ^current for peer workspace ranges regardless of the requested suffix', () => {
    const errors: string[] = []
    const manifest = {
      name: '@tachui/primitives',
      version: '0.8.29',
      peerDependencies: {
        '@tachui/core': 'workspace:*',
        '@tachui/types': 'workspace:^0.8.0',
        '@tachui/registry': 'workspace:~0.8.0',
      },
    }

    rewriteManifest(manifest, VERSIONS, errors)

    expect(errors).toEqual([])
    // Peers must track a compatible range — pinning them to an exact version
    // would reject consumers on later compatible patch/minor versions.
    expect(manifest.peerDependencies).toEqual({
      '@tachui/core': '^0.8.28',
      '@tachui/types': '^0.8.28',
      '@tachui/registry': '^0.8.28',
    })
  })

  it('leaves non-internal and already-rewritten dependencies untouched', () => {
    const errors: string[] = []
    const manifest = {
      name: '@tachui/primitives',
      version: '0.8.29',
      dependencies: {
        react: 'workspace:*',
        '@tachui/core': '0.8.28',
      },
    }

    const changes = rewriteManifest(manifest, VERSIONS, errors)

    expect(errors).toEqual([])
    expect(changes).toEqual([])
    expect(manifest.dependencies).toEqual({
      react: 'workspace:*',
      '@tachui/core': '0.8.28',
    })
  })

  it('is idempotent — a second pass makes no changes', () => {
    const errors: string[] = []
    const manifest = {
      name: '@tachui/primitives',
      version: '0.8.29',
      dependencies: { '@tachui/core': 'workspace:*' },
      peerDependencies: { '@tachui/types': 'workspace:*' },
    }

    rewriteManifest(manifest, VERSIONS, errors)
    const secondPass = rewriteManifest(manifest, VERSIONS, errors)

    expect(secondPass).toEqual([])
    expect(manifest.dependencies['@tachui/core']).toBe('0.8.28')
    expect(manifest.peerDependencies['@tachui/types']).toBe('^0.8.28')
  })

  it('reports unknown workspace dependency targets without rewriting them', () => {
    const errors: string[] = []
    const manifest = {
      name: '@tachui/primitives',
      version: '0.8.29',
      dependencies: { '@tachui/nonexistent': 'workspace:*' },
    }

    const changes = rewriteManifest(manifest, VERSIONS, errors)

    expect(changes).toEqual([])
    expect(errors).toEqual([
      '@tachui/primitives dependencies.@tachui/nonexistent="workspace:*" references an unknown workspace package',
    ])
    expect(manifest.dependencies['@tachui/nonexistent']).toBe('workspace:*')
  })

  it('handles manifests without dependency sections', () => {
    const errors: string[] = []
    const manifest = { name: '@tachui/primitives', version: '0.8.29' }

    expect(rewriteManifest(manifest, VERSIONS, errors)).toEqual([])
    expect(errors).toEqual([])
  })
})
