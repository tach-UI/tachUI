import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ColorAsset } from '@tachui/core'
import { createRoot, createSignal, flushSync, setTheme } from '@tachui/core/reactive'
import { createIsolatedRegistry, type ModifierRegistry } from '@tachui/registry'
import {
  createResponsiveModifier,
  registerResponsiveModifiers,
} from '../src/modifiers/responsive'

function cssOutput(modifier: ReturnType<typeof createResponsiveModifier>): string {
  const generated = modifier.getGeneratedCSS()
  return generated?.cssRules.join('\n') ?? ''
}
const disposers = new Set<() => void>()

async function waitForReactiveUpdate(): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 0))
}

function mountModifier(
  modifier: ReturnType<typeof createResponsiveModifier>,
  element: HTMLElement
): void {
  createRoot(dispose => {
    disposers.add(dispose)
    modifier.apply(
      { element } as any,
      {
        componentId: `responsive-reactive-${Math.random().toString(36).slice(2)}`,
        element,
        phase: 'creation',
      } as any
    )
  })
}

describe('@tachui/responsive reactive behavior', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    registry = createIsolatedRegistry() as ModifierRegistry
    registerResponsiveModifiers({ registry, force: true })
    setTheme('light')
  })

  afterEach(() => {
    disposers.forEach(dispose => dispose())
    disposers.clear()
  })

  it('updates generated responsive CSS when signal-driven values change', () => {
    const element = document.createElement('div')
    const [baseSize, setBaseSize] = createSignal(14)
    const modifier = createResponsiveModifier({
      fontSize: { base: baseSize, md: 18 },
    })

    mountModifier(modifier, element)
    expect(cssOutput(modifier)).toContain('font-size: 14')

    setBaseSize(20)
    flushSync()
    expect(cssOutput(modifier)).toContain('font-size: 20')
  })

  it('reacts to theme changes for responsive ColorAsset values in generated CSS', async () => {
    const element = document.createElement('div')
    const surface = ColorAsset.init({
      name: 'surface',
      default: '#ffffff',
      light: '#ffffff',
      dark: '#111111',
    })

    const modifier = createResponsiveModifier({
      backgroundColor: {
        base: surface as any,
        md: surface as any,
      },
    })

    mountModifier(modifier, element)
    expect(cssOutput(modifier)).toContain('#ffffff')

    setTheme('dark')
    flushSync()
    await waitForReactiveUpdate()
    expect(cssOutput(modifier)).toContain('#111111')
  })

  it('re-applies responsive CSS when simulated viewport-resize signal changes', () => {
    const element = document.createElement('div')
    const [basePadding, setBasePadding] = createSignal(8)
    const modifier = createResponsiveModifier({
      padding: {
        base: basePadding,
        lg: 24,
      } as any,
    })

    mountModifier(modifier, element)
    expect(cssOutput(modifier)).toContain('padding: 8')

    setBasePadding(24)
    flushSync()
    expect(cssOutput(modifier)).toContain('padding: 24')
  })

  it('updates five responsive components independently', () => {
    const elements = Array.from({ length: 5 }, () => document.createElement('div'))
    const signals = elements.map((_, index) => createSignal(index + 1))
    const modifiers = elements.map((element, index) => {
      const [value] = signals[index]
      const modifier = createResponsiveModifier({
        margin: { base: value, md: 16 },
      })
      mountModifier(modifier, element)
      return modifier
    })

    expect(cssOutput(modifiers[0])).toContain('margin: 1')
    expect(cssOutput(modifiers[4])).toContain('margin: 5')

    const [, setThird] = signals[2]
    setThird(42)
    flushSync()

    expect(cssOutput(modifiers[2])).toContain('margin: 42')
    expect(cssOutput(modifiers[1])).toContain('margin: 2')
    expect(cssOutput(modifiers[4])).toContain('margin: 5')
  })
})
