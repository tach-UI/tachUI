/**
 * The single BaseModifier / AnimationModifier / LifecycleModifier
 *
 * `@tachui/modifiers` used to carry two further copies of these classes, and
 * the copies disagreed. Each test here pins the behavior the merged class
 * settled on:
 *
 * - `applyStyles` always re-resolves an asset when the theme changes.
 * - `AnimationModifier.type` is `'animation' | 'transition'`, so a transition
 *   subclass reaches the builder's transition branch.
 * - `refreshable` belongs to `@tachui/mobile`; core sets nothing up for it.
 * - `AnimationModifier` has no overlay branch; the overlay modifier in
 *   `@tachui/modifiers` is the one implementation.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ColorAsset } from '../../src/assets/ColorAsset'
import {
  AnimationModifier,
  BaseModifier,
  LifecycleModifier,
} from '../../src/modifiers/base'
import { createModifierBuilder } from '../../src/modifiers/builder'
import { createRoot } from '../../src/reactive'
import { setTheme } from '../../src/reactive/theme'
import { ComponentWithCSSClasses } from '../../src/css-classes'
import type { ComponentProps } from '../../src/runtime/types'
import { h, text } from '../../src/runtime'
import type { ModifierContext } from '../../src/modifiers/types'

class StyleModifier extends BaseModifier<Record<string, unknown>> {
  readonly type = 'style-under-test'
  readonly priority = 0

  apply(_node: any, context: ModifierContext) {
    if (context.element) this.applyStyles(context.element, this.properties as any)
    return undefined
  }
}

class TransitionUnderTest extends AnimationModifier {
  readonly type = 'transition' as const
}

class SampleComponent extends ComponentWithCSSClasses {
  public readonly type = 'component' as const
  public readonly id = `sample-${Math.random().toString(36).slice(2)}`
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(public props: ComponentProps = {}) {
    super()
  }

  render() {
    return [h('div', {}, text('sample'))]
  }
}

// Effects scheduled by a signal write run after the current task.
const flush = () => new Promise(resolve => setTimeout(resolve, 0))

function contextFor(element: Element): ModifierContext {
  return { componentId: 'test', element, phase: 'creation' }
}

describe('applyStyles with assets', () => {
  beforeEach(() => setTheme('light'))
  afterEach(() => setTheme('light'))

  it('re-resolves a ColorAsset when the theme changes', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const surface = ColorAsset.init({
      default: '#ffffff',
      light: '#ffffff',
      dark: '#000000',
      name: 'consolidationSurface',
    })
    const ink = ColorAsset.init({
      default: '#111111',
      light: '#111111',
      dark: '#eeeeee',
      name: 'consolidationInk',
    })

    createRoot(() => {
      new StyleModifier({ backgroundColor: surface, color: ink }).apply(
        {} as any,
        contextFor(element)
      )
    })

    expect(element.style.backgroundColor).toBe('rgb(255, 255, 255)')
    expect(element.style.color).toBe('rgb(17, 17, 17)')

    setTheme('dark')
    await flush()

    expect(element.style.backgroundColor).toBe('rgb(0, 0, 0)')
    expect(element.style.color).toBe('rgb(238, 238, 238)')

    setTheme('light')
    await flush()

    expect(element.style.backgroundColor).toBe('rgb(255, 255, 255)')
    element.remove()
  })

  it('resolves each asset once per theme change however often it is applied', async () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    let resolutions = 0
    const asset = {
      resolve: () => {
        resolutions += 1
        return 'red'
      },
    }
    const modifier = new StyleModifier({ color: asset })

    createRoot(() => {
      modifier.apply({} as any, contextFor(element))
      modifier.apply({} as any, contextFor(element))
    })
    const afterApply = resolutions

    setTheme('dark')
    await flush()

    expect(element.style.color).toBe('red')
    expect(resolutions - afterApply).toBe(1)
    element.remove()
  })

  it('writes a plain object with a value through as that value', () => {
    const element = document.createElement('div')
    new StyleModifier({ color: { value: 'blue' } }).apply(
      {} as any,
      contextFor(element)
    )

    expect(element.style.color).toBe('blue')
  })
})

describe('AnimationModifier transition type', () => {
  it('lets a subclass narrow the type to transition', () => {
    const modifier: AnimationModifier = new TransitionUnderTest({
      transition: { property: 'opacity', duration: 200 },
    })

    expect(modifier.type).toBe('transition')
    expect(new AnimationModifier({}).type).toBe('animation')
  })

  it('applies transition props to the element', () => {
    const element = document.createElement('div')
    new TransitionUnderTest({
      transition: { property: 'opacity', duration: 200, easing: 'linear' },
    }).apply({} as any, contextFor(element))

    expect(element.style.transition).toBe('opacity 200ms linear 0ms')
  })

  it('reaches the builder transition branch', () => {
    const transition = { property: 'opacity', duration: 200 }
    const builder = createModifierBuilder(new SampleComponent()) as any
    builder.addModifierInternal(new TransitionUnderTest({ transition }))

    const built = builder.build()

    expect(built.props.style.transition).toBe(transition)
  })
})

describe('refreshable ownership', () => {
  const source = readFileSync(
    resolve(__dirname, '../../src/modifiers/base.ts'),
    'utf8'
  )

  it('has no refreshable setup in core', () => {
    expect(source).not.toMatch(/refreshable/i)
    expect('setupRefreshable' in LifecycleModifier.prototype).toBe(false)
  })

  it('ignores refreshable props on LifecycleModifier', () => {
    const parent = document.createElement('div')
    const element = document.createElement('div')
    parent.appendChild(element)
    const added: string[] = []
    const addEventListener = element.addEventListener.bind(element)
    element.addEventListener = ((type: string, ...rest: any[]) => {
      added.push(type)
      return (addEventListener as any)(type, ...rest)
    }) as typeof element.addEventListener

    new LifecycleModifier({
      refreshable: { onRefresh: async () => {} },
    } as any).apply({} as any, contextFor(element))

    expect(parent.children).toHaveLength(1)
    expect(added).toEqual([])
  })
})

describe('AnimationModifier overlay', () => {
  it('has no overlay branch', () => {
    expect('applyOverlay' in AnimationModifier.prototype).toBe(false)
  })
})
