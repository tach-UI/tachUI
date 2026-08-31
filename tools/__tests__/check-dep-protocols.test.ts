import { describe, expect, it } from 'vitest'
import { findProtocolViolations } from '../check-dep-protocols.mjs'

describe('findProtocolViolations', () => {
  it('rejects workspace: ranges in every dependency section', () => {
    const manifest = {
      name: '@tachui/core',
      version: '0.8.27',
      dependencies: { '@tachui/types': 'workspace:*' },
      optionalDependencies: { '@tachui/registry': 'workspace:*' },
      peerDependencies: { '@tachui/modifiers': 'workspace:*' },
    }

    const violations = findProtocolViolations(manifest)

    expect(violations).toHaveLength(3)
    expect(violations[0]).toContain('dependencies.@tachui/types=workspace:*')
    expect(violations[1]).toContain(
      'optionalDependencies.@tachui/registry=workspace:*'
    )
    expect(violations[2]).toContain(
      'peerDependencies.@tachui/modifiers=workspace:*'
    )
  })

  it('rejects portal:, link:, and catalog: protocols', () => {
    const manifest = {
      name: '@tachui/core',
      version: '0.8.27',
      dependencies: {
        '@tachui/types': 'portal:../types',
        '@tachui/registry': 'link:../registry',
        '@tachui/modifiers': 'catalog:default',
      },
    }

    const violations = findProtocolViolations(manifest)

    expect(violations).toHaveLength(3)
    expect(violations[0]).toContain('"portal:"')
    expect(violations[1]).toContain('"link:"')
    expect(violations[2]).toContain('"catalog:"')
  })

  it('flags non-scoped package names too — any workspace range is unresolvable on npm', () => {
    const manifest = {
      name: '@tachui/core',
      version: '0.8.27',
      dependencies: { lodash: 'workspace:*' },
    }

    expect(findProtocolViolations(manifest)).toHaveLength(1)
  })

  it('accepts versioned ranges and pinned versions', () => {
    const manifest = {
      name: '@tachui/core',
      version: '0.8.27',
      dependencies: {
        '@tachui/types': '0.8.27',
        '@tachui/registry': '^0.8.0',
        react: '^19.0.0',
      },
      peerDependencies: { '@tachui/modifiers': '^0.8.27' },
    }

    expect(findProtocolViolations(manifest)).toEqual([])
  })

  it('ignores missing or empty dependency sections', () => {
    expect(
      findProtocolViolations({ name: '@tachui/core', version: '0.8.27' })
    ).toEqual([])
    expect(
      findProtocolViolations({
        name: '@tachui/core',
        version: '0.8.27',
        dependencies: {},
      })
    ).toEqual([])
  })
})
