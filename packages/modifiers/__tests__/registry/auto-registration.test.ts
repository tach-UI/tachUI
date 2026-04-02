import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function getRegistrableFunctionNames(
  moduleExports: Record<string, unknown>,
  excludedNames: ReadonlySet<string> = new Set()
): string[] {
  return Object.entries(moduleExports)
    .filter(([name, value]) => {
      if (excludedNames.has(name)) return false
      if (typeof value !== 'function') return false
      return /^[a-z]/.test(name)
    })
    .map(([name]) => name)
    .sort()
}

describe('Modifier registry auto-registration', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
  })

  it('registers basic modifiers when @tachui/modifiers is imported', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/index')

    expect(globalModifierRegistry.has('padding')).toBe(true)
    expect(globalModifierRegistry.has('font')).toBe(true)
    expect(globalModifierRegistry.has('blur')).toBe(false)
  })

  it('registers effects when @tachui/modifiers/effects is imported', async () => {
    const { globalModifierRegistry, getModifierAsync } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/effects/index')

    expect(globalModifierRegistry.has('blur')).toBe(true)
    expect(globalModifierRegistry.has('hoverEffect')).toBe(true)

    const blurFactory = await getModifierAsync('blur')
    expect(blurFactory).toBeDefined()
  })

  it('registers filters when preload/filters is imported', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/preload/filters')

    expect(globalModifierRegistry.has('blur')).toBe(true)
    expect(globalModifierRegistry.has('transformStyle')).toBe(false)
  })

  it('registers shadows when preload/shadows is imported', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/preload/shadows')

    expect(globalModifierRegistry.has('shadow')).toBe(true)
    expect(globalModifierRegistry.has('blur')).toBe(false)
  })

  it('registers transforms when preload/transforms is imported', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/preload/transforms')

    expect(globalModifierRegistry.has('transformStyle')).toBe(true)
    expect(globalModifierRegistry.has('shadow')).toBe(false)
  })

  it('registers backdrop effects when preload/backdrop is imported', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    globalModifierRegistry.clear()

    await import('../../src/preload/backdrop')

    expect(globalModifierRegistry.has('backdropFilter')).toBe(true)
    expect(globalModifierRegistry.has('transformStyle')).toBe(false)
  })

  it('keeps preload registrations aligned with effect module exports', async () => {
    const { globalModifierRegistry } = await import('@tachui/registry')
    const preloadModulePairs = [
      {
        preload: () => import('../../src/preload/filters'),
        effectsModule: () => import('../../src/effects/filters'),
        excludedNames: new Set(['opacity', 'backdropFilter']),
      },
      {
        preload: () => import('../../src/preload/shadows'),
        effectsModule: () => import('../../src/effects/shadows'),
        excludedNames: new Set<string>(),
      },
      {
        preload: () => import('../../src/preload/transforms'),
        effectsModule: () => import('../../src/effects/transforms'),
        excludedNames: new Set(['offset']),
      },
      {
        preload: () => import('../../src/preload/backdrop'),
        effectsModule: () => import('../../src/effects/backdrop'),
        excludedNames: new Set<string>(),
      },
    ] as const

    for (const pair of preloadModulePairs) {
      globalModifierRegistry.clear()

      const effectsModuleExports = await pair.effectsModule()
      await pair.preload()

      const expectedFactoryNames = getRegistrableFunctionNames(
        effectsModuleExports,
        pair.excludedNames
      )
      const missingRegistrations = expectedFactoryNames.filter(
        factoryName => !globalModifierRegistry.has(factoryName)
      )

      expect(missingRegistrations).toEqual([])
    }
  })
})
