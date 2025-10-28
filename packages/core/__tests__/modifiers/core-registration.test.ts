import { describe, expect, it } from 'vitest'
import {
  createIsolatedRegistry,
  type ModifierRegistry,
} from '@tachui/registry'
import {
  registerCoreModifiers,
  padding,
  foregroundColor,
} from '../../src/modifiers'

function collectMetadata(registry: ModifierRegistry, name: string) {
  return registry.getMetadata(name)
}

describe('registerCoreModifiers', () => {
  it('registers runtime factories and metadata for core modifiers', () => {
    const registry = createIsolatedRegistry()
    registerCoreModifiers({ registry })

    const expectedModifiers = [
      'padding',
      'margin',
      'frame',
      'alignment',
      'layoutPriority',
      'foregroundColor',
      'backgroundColor',
      'background',
      'fontSize',
      'fontWeight',
      'fontFamily',
      'opacity',
      'cornerRadius',
      'border',
    ]

    for (const name of expectedModifiers) {
      expect(registry.has(name)).toBe(true)
      const metadata = collectMetadata(registry, name)
      expect(metadata?.plugin).toBe('@tachui/core')
      expect(metadata?.priority).toBeGreaterThan(0)
      expect(metadata?.category).toBeDefined()
    }
  })

  it('produces modifiers that mirror the exported helpers', () => {
    const registry = createIsolatedRegistry()
    registerCoreModifiers({ registry })

    const paddingFactory = registry.get('padding')
    const foregroundFactory = registry.get('foregroundColor')

    expect(paddingFactory).toBeDefined()
    expect(foregroundFactory).toBeDefined()

    const directPadding = padding(12)
    const registryPadding = paddingFactory?.(12)

    expect(registryPadding?.type).toBe(directPadding.type)
    expect(registryPadding?.properties).toEqual(directPadding.properties)

    const directForeground = foregroundColor('red')
    const registryForeground = foregroundFactory?.('red')

    expect(registryForeground?.type).toBe(directForeground.type)
    expect(registryForeground?.properties).toEqual(directForeground.properties)
  })

  it('avoids duplicate registration when invoked multiple times without a registry override', () => {
    const registry = createIsolatedRegistry()
    registerCoreModifiers({ registry })
    registerCoreModifiers({ registry })

    const metadata = collectMetadata(registry, 'padding')
    expect(metadata).toBeDefined()
    expect(Array.isArray(registry.getConflicts().get('padding'))).toBe(false)
  })
})
