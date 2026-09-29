import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import {
  basicModifierRegistrations,
  registerBasicModifiers,
} from '../../src/basic'
import {
  basicModifierCategories,
  basicModifierSignatures,
} from '../../src/basic/signatures.generated'
import { effectModifierSignatures } from '../../src/effects/signatures.generated'
import { filterModifierSignatures } from '../../src/preload/filters.signatures.generated'
import { shadowModifierSignatures } from '../../src/preload/shadows.signatures.generated'
import { transformModifierSignatures } from '../../src/preload/transforms.signatures.generated'
import { backdropModifierSignatures } from '../../src/preload/backdrop.signatures.generated'
import {
  MODIFIERS_METADATA_PRIORITY,
  MODIFIERS_PLUGIN_INFO,
  registerModifierList,
} from '../../src/registration'

describe('basic modifier registration metadata', () => {
  it('registers every basic modifier with metadata', () => {
    const registry = createIsolatedRegistry()
    registerBasicModifiers({ registry })

    for (const [name] of basicModifierRegistrations) {
      const metadata = registry.getMetadata(name)
      expect(metadata, name).toBeDefined()
      expect(metadata?.plugin).toBe('@tachui/modifiers')
      expect(metadata?.signature).toBe(basicModifierSignatures[name])
    }
  })

  it('registers the listed factories, first entry winning, as before', () => {
    const registry = createIsolatedRegistry()
    registerBasicModifiers({ registry })

    const first = new Map<string, unknown>()
    for (const [name, factory] of basicModifierRegistrations) {
      if (!first.has(name)) first.set(name, factory)
    }
    for (const [name, factory] of first) {
      expect(registry.get(name), name).toBe(factory)
    }
  })

  it('leaves an already registered factory in place', () => {
    const registry = createIsolatedRegistry()
    const existing = () => ({}) as never
    registry.register('padding', existing)

    registerBasicModifiers({ registry })

    expect(registry.get('padding')).toBe(existing)
    expect(registry.getMetadata('padding')?.signature).toBe(
      basicModifierSignatures.padding,
    )
  })

  it('carries the derived signatures of the representative complex modifiers', () => {
    const registry = createIsolatedRegistry()
    registerBasicModifiers({ registry })

    expect(registry.getMetadata('overlay')?.signature).toBe(
      "(content: OverlayContent, alignmentOrOptions?: OverlayAlignment | Signal<OverlayAlignment> | Omit<OverlayOptions, 'content'>): this",
    )
    expect(registry.getMetadata('padding')?.signature).toBe(
      '(optionsOrAll: ReactivePaddingOptions | PaddingValue | Signal<PaddingValue>): this',
    )
    expect(registry.getMetadata('clipShape')?.signature).toBe(
      '(shape: ClipShapeName | Shape, parameters?: Record<string, any>): this',
    )
  })

  it('takes categories from the derived table and priority from the package', () => {
    const registry = createIsolatedRegistry()
    registerBasicModifiers({ registry })

    expect(registry.getMetadata('overlay')?.category).toBe('layout')
    expect(registry.getMetadata('ariaLabel')?.category).toBe('accessibility')
    expect(registry.getMetadata('overlay')?.category).toBe(
      basicModifierCategories.overlay,
    )
    expect(registry.getMetadata('overlay')?.priority).toBe(
      MODIFIERS_METADATA_PRIORITY,
    )
  })

  it('keeps the gesture modifiers’ own descriptions with a derived signature', () => {
    const registry = createIsolatedRegistry()
    registerBasicModifiers({ registry })

    const metadata = registry.getMetadata('onLongPressGesture')
    expect(metadata?.priority).toBe(85)
    expect(metadata?.description).toMatch(/minimumDuration/)
    expect(metadata?.signature).toBe(
      basicModifierSignatures.onLongPressGesture,
    )
    expect(metadata?.signature).toBe(
      '(options: OnLongPressGestureOptions): this',
    )
  })
})

describe('registerModifierList', () => {
  it('registers the modifiers plugin once alongside the metadata', () => {
    const registry = createIsolatedRegistry()
    const factory = () => ({}) as never

    registerModifierList(
      [['sampleModifier', factory]],
      {
        signatures: { sampleModifier: '(value: number): this' },
        categories: { sampleModifier: 'appearance' },
      },
      { registry },
    )

    expect(registry.get('sampleModifier')).toBe(factory)
    expect(registry.getMetadata('sampleModifier')).toMatchObject({
      name: 'sampleModifier',
      plugin: MODIFIERS_PLUGIN_INFO.name,
      category: 'appearance',
      signature: '(value: number): this',
    })
    expect(registry.getPluginInfo('@tachui/modifiers')).toEqual(
      MODIFIERS_PLUGIN_INFO,
    )
  })
})

describe('effect and preload registration metadata', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('registers every effect modifier with its derived signature', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/effects')

    for (const [name, signature] of Object.entries(effectModifierSignatures)) {
      expect(globalModifierRegistry.has(name), name).toBe(true)
      expect(globalModifierRegistry.getMetadata(name)?.signature, name).toBe(
        signature,
      )
    }
  })

  it.each([
    ['filters', filterModifierSignatures],
    ['shadows', shadowModifierSignatures],
    ['transforms', transformModifierSignatures],
    ['backdrop', backdropModifierSignatures],
  ] as const)(
    'registers the %s preload with its derived signatures',
    async (entry, signatures) => {
      const { globalModifierRegistry } = await import('@tachui/registry')
      globalModifierRegistry.clear()

      await import(`../../src/preload/${entry}.ts`)

      for (const [name, signature] of Object.entries(signatures)) {
        expect(globalModifierRegistry.has(name), name).toBe(true)
        expect(
          globalModifierRegistry.getMetadata(name)?.signature,
          name,
        ).toBe(signature)
      }
    },
  )
})
