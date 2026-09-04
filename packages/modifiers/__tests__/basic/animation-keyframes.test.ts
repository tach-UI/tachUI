/**
 * Tests for content-addressed animation keyframes in @tachui/modifiers (#298)
 *
 * `AnimationModifier` is duplicated here — twice — and in `@tachui/core`, and
 * every copy writes to the same `#tachui-animations` element. Both the naming
 * and the deduping now come from core, so these guard that this package's
 * copies really route through it rather than keeping their own scheme.
 *
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { ModifierContext } from '@tachui/types/modifiers'
import {
  createAnimationKeyframeRule,
  ensureAnimationKeyframes,
} from '@tachui/core/modifiers/base'
import { AnimationModifier } from '../../src/basic/base'
import { AnimationModifier as FullAnimationModifier } from '../../src/base'

const PULSE = {
  '0%': { opacity: '1' },
  '50%': { opacity: '0.5' },
  '100%': { opacity: '1' },
}

const SLIDE = {
  '0%': { transform: 'translateX(0)' },
  '100%': { transform: 'translateX(100px)' },
}

function makeContext(componentId: string): ModifierContext {
  return {
    componentId,
    element: document.createElement('div'),
    phase: 'creation',
  }
}

/** Every `@keyframes` name currently present in the shared stylesheet. */
function injectedNames(): string[] {
  const text = document.querySelector('#tachui-animations')?.textContent ?? ''
  return Array.from(text.matchAll(/@keyframes\s+([\w-]+)/g)).map(m => m[1])
}

function animationName(context: ModifierContext): string {
  return (context.element as HTMLElement).style.animation.split(' ')[0]
}

describe('animation keyframes', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  it('injects exactly one block across repeated applies', () => {
    const modifier = new AnimationModifier({ animation: { keyframes: PULSE } })

    // The regression this guards: five applies used to append five blocks
    // under five distinct names, none of them ever removed.
    for (let i = 0; i < 5; i++) {
      modifier.apply({} as any, makeContext(`component-${i}`))
    }

    expect(injectedNames()).toHaveLength(1)
  })

  it('keeps distinct keyframes in distinct blocks', () => {
    new AnimationModifier({ animation: { keyframes: PULSE } }).apply(
      {} as any,
      makeContext('a')
    )
    new AnimationModifier({ animation: { keyframes: SLIDE } }).apply(
      {} as any,
      makeContext('b')
    )

    expect(injectedNames()).toHaveLength(2)
  })

  it('shares one block between the basic and full builds', () => {
    // If either copy kept a private name scheme or a private set of injected
    // names, the same animation would land in the shared sheet twice.
    const basicContext = makeContext('basic')
    const fullContext = makeContext('full')

    new AnimationModifier({ animation: { keyframes: PULSE } }).apply(
      {} as any,
      basicContext
    )
    new FullAnimationModifier({ animation: { keyframes: PULSE } }).apply(
      {} as any,
      fullContext
    )

    expect(injectedNames()).toHaveLength(1)
    expect(animationName(basicContext)).toBe(animationName(fullContext))
  })

  it('agrees with core on the name for the same keyframes', () => {
    const context = makeContext('a')
    new AnimationModifier({ animation: { keyframes: PULSE } }).apply(
      {} as any,
      context
    )

    expect(animationName(context)).toBe(createAnimationKeyframeRule(PULSE).name)
  })

  it('skips a block core already injected', () => {
    ensureAnimationKeyframes(PULSE)
    expect(injectedNames()).toHaveLength(1)

    new AnimationModifier({ animation: { keyframes: PULSE } }).apply(
      {} as any,
      makeContext('a')
    )

    expect(injectedNames()).toHaveLength(1)
  })

  it('gives getStaticCSS and apply the same keyframe name', () => {
    const modifier = new AnimationModifier({
      animation: { keyframes: PULSE, duration: 400 },
    })

    const context = makeContext('a')
    modifier.apply({} as any, context)

    const staticName = modifier
      .getStaticCSS('.card')
      .join('\n')
      .match(/@keyframes\s+([\w-]+)/)?.[1]

    expect(staticName).toBe(animationName(context))
  })
})
