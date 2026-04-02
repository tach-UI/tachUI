import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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
})
