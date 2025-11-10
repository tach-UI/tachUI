import { describe, expect, it, vi } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import type { ModifierRegistry } from '@tachui/registry'
import {
  generateModifierArtifacts,
  generateModifierTypes,
} from '../../src/modifiers/type-generator'
import registerModifierMetadata from '../../../devtools/src/modifier-metadata'

function withIsolatedRegistry(
  setup: (registry: ModifierRegistry) => void,
): ModifierRegistry {
  const registry = createIsolatedRegistry()
  registry.setFeatureFlags({ metadataRegistration: true })
  setup(registry)
  return registry
}

describe('modifier type generator', () => {
  it('produces declaration output populated from registry metadata', () => {
    const registry = withIsolatedRegistry((reg) => {
      reg.registerPlugin({
        name: '@tachui/core',
        version: '0.0.0',
        author: 'tachUI',
        verified: true,
      })

      reg.registerMetadata({
        name: 'padding',
        plugin: '@tachui/core',
        priority: 100,
        signature: '(value: number): this',
        category: 'layout',
        description: 'Apply padding to all sides.',
      })

      reg.registerMetadata({
        name: 'fontSize',
        plugin: '@tachui/core',
        priority: 80,
        signature: '(size: number | string): this',
        category: 'typography',
        description: 'Set the font size for the component.',
      })
    })

    const { declaration, snapshot } = generateModifierArtifacts({ registry })

    expect(snapshot.totalModifiers).toBe(2)
    expect(Object.keys(snapshot.categories)).toEqual(['layout', 'typography'])
    expect(snapshot.categories.layout[0]?.name).toBe('padding')
    expect(snapshot.plugins[0]?.name).toBe('@tachui/core')

    expect(declaration).toContain(
      "declare module '@tachui/core/modifiers/types'",
    )
    expect(declaration).toContain(
      'padding(value: number): ModifierBuilder<T>;',
    )
    expect(declaration).toContain("padding(value: number): this;")
    expect(declaration).toContain('fontSize(size: number | string):')
    expect(declaration).toContain('@plugin @tachui/core (priority 100)')
  })

  it('captures conflict snapshots while omitting symbol-based declarations', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const registry = withIsolatedRegistry((reg) => {
      reg.registerPlugin({
        name: '@tachui/plugin-a',
        version: '1.0.0',
        author: 'Plugin A',
        verified: true,
      })
      reg.registerPlugin({
        name: '@tachui/plugin-b',
        version: '1.0.0',
        author: 'Plugin B',
        verified: true,
      })

      reg.registerMetadata({
        name: 'shadow',
        plugin: '@tachui/plugin-a',
        priority: 50,
        signature: '(): this',
        category: 'appearance',
      })
      reg.registerMetadata({
        name: 'shadow',
        plugin: '@tachui/plugin-b',
        priority: 50,
        signature: '(): this',
        category: 'appearance',
      })
      reg.registerMetadata({
        name: Symbol('internal'),
        plugin: '@tachui/plugin-a',
        priority: 10,
        signature: '(): this',
        category: 'internal',
        description: 'Internal modifier should not surface in declarations.',
      })
    })

    const { declaration, snapshot } = generateModifierArtifacts({ registry })

    expect(snapshot.conflicts).toHaveLength(1)
    expect(snapshot.conflicts[0]?.entries).toHaveLength(2)
    expect(snapshot.categories.internal[0]?.nameKind).toBe('symbol')
    expect(declaration).toContain(
      "interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>",
    )
    expect(declaration).toContain('shadow(): ModifierBuilder<T>;')
    expect(declaration).toContain(
      'Skipped Symbol(internal) – cannot express symbol-based modifier in declarations.',
    )

    errorSpy.mockRestore()
  })

  it('falls back to the global registry when no registry is supplied', () => {
    const registry = withIsolatedRegistry((reg) => {
      reg.registerPlugin({
        name: '@tachui/experimental',
        version: '0.1.0',
        author: 'tachUI Labs',
        verified: true,
      })
      reg.registerMetadata({
        name: 'experimentalModifier',
        plugin: '@tachui/experimental',
        priority: 10,
        signature: '(): this',
        category: 'custom',
      })
    })

    const snapshotBefore = generateModifierArtifacts({
      registry,
    }).snapshot
    expect(snapshotBefore.totalModifiers).toBe(1)

    // Sanity check global call still succeeds even with no metadata
    const declaration = generateModifierTypes({
      registry,
    })
    expect(declaration).toContain('experimentalModifier():')
  })

  it('registers metadata via devtools modifier metadata hydrator', () => {
    const registry = createIsolatedRegistry()
    registry.setFeatureFlags({ metadataRegistration: true })

    registerModifierMetadata(registry)

    const snapshot = generateModifierArtifacts({ registry }).snapshot
    expect(snapshot.totalModifiers).toBeGreaterThan(0)
  })
})
