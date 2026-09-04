/**
 * Tests for content-addressed animation keyframes (#298)
 *
 * `AnimationModifier` used to mint a keyframe name from `componentId` and
 * `Date.now()`, which produced a fresh `@keyframes` block on every apply and a
 * name the SSR path could not possibly predict. Names now derive from the
 * keyframes' own content, which fixes both at once.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { ModifierContext } from '../../src/modifiers/types'
import {
  AnimationModifier,
  createAnimationKeyframeRule,
  injectAnimationKeyframes,
} from '../../src/modifiers/base'

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
  const element = document.createElement('div')
  document.body.appendChild(element)
  return { componentId, element, phase: 'creation' }
}

function stylesheet(): HTMLStyleElement | null {
  return document.querySelector('#tachui-animations')
}

/** Every `@keyframes` name currently present in the shared stylesheet. */
function injectedNames(): string[] {
  const text = stylesheet()?.textContent ?? ''
  return Array.from(text.matchAll(/@keyframes\s+([\w-]+)/g)).map(m => m[1])
}

/** The name from an element's `animation` shorthand. */
function animationName(context: ModifierContext): string {
  const animation = (context.element as HTMLElement).style.animation
  return animation.split(' ')[0]
}

describe('animation keyframes', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
    document.body.innerHTML = ''
  })

  describe('stylesheet growth', () => {
    it('injects exactly one block no matter how many times it is applied', () => {
      const modifier = new AnimationModifier({ animation: { keyframes: PULSE } })

      // The regression this guards: five applies used to leave five blocks
      // under five distinct names.
      for (let i = 0; i < 5; i++) {
        modifier.apply({} as any, makeContext(`component-${i}`))
      }

      expect(injectedNames()).toHaveLength(1)
    })

    it('reuses one block across separate modifier instances with equal keyframes', () => {
      const first = new AnimationModifier({ animation: { keyframes: PULSE } })
      const second = new AnimationModifier({
        // A structurally equal but distinct object — content is what matters,
        // not identity.
        animation: { keyframes: { ...PULSE } },
      })

      const firstContext = makeContext('a')
      const secondContext = makeContext('b')
      first.apply({} as any, firstContext)
      second.apply({} as any, secondContext)

      expect(injectedNames()).toHaveLength(1)
      expect(animationName(firstContext)).toBe(animationName(secondContext))
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

      expect(new Set(injectedNames()).size).toBe(2)
    })

    it('shares one block between animations that differ only in timing', () => {
      const slow = new AnimationModifier({
        animation: { keyframes: PULSE, duration: 2000 },
      })
      const fast = new AnimationModifier({
        animation: { keyframes: PULSE, duration: 200, easing: 'linear' },
      })

      const slowContext = makeContext('slow')
      const fastContext = makeContext('fast')
      slow.apply({} as any, slowContext)
      fast.apply({} as any, fastContext)

      // Duration and easing live in the `animation` shorthand, not in the
      // keyframes block, so there is no reason to duplicate the block.
      expect(injectedNames()).toHaveLength(1)
      expect(
        (slowContext.element as HTMLElement).style.animation
      ).toContain('2000ms')
      expect((fastContext.element as HTMLElement).style.animation).toContain(
        '200ms linear'
      )
    })

    it('re-injects after the stylesheet is removed', () => {
      const modifier = new AnimationModifier({ animation: { keyframes: PULSE } })
      modifier.apply({} as any, makeContext('a'))
      expect(injectedNames()).toHaveLength(1)

      // Bookkeeping lives on the element, so discarding the element discards
      // the record of what it held.
      stylesheet()!.remove()

      modifier.apply({} as any, makeContext('b'))
      expect(injectedNames()).toHaveLength(1)
    })
  })

  describe('SSR and client agreement', () => {
    it('gives getStaticCSS and apply the same keyframe name', () => {
      const modifier = new AnimationModifier({
        animation: { keyframes: PULSE, duration: 500 },
      })

      const context = makeContext('a')
      modifier.apply({} as any, context)

      const staticRules = modifier.getStaticCSS('.some-component')
      const staticName = staticRules
        .join('\n')
        .match(/@keyframes\s+([\w-]+)/)?.[1]

      expect(staticName).toBe(animationName(context))
    })

    it('names independently of the selector it is rendered for', () => {
      const modifier = new AnimationModifier({ animation: { keyframes: PULSE } })

      const nameFor = (selector: string) =>
        modifier.getStaticCSS(selector).join('\n').match(/@keyframes\s+([\w-]+)/)?.[1]

      // The old scheme derived the name from the selector, so the same
      // animation on two elements produced two blocks — and neither matched
      // what the client generated.
      expect(nameFor('.header')).toBe(nameFor('#footer > .item'))
    })

    it('emits both the keyframes and the shorthand for a selector', () => {
      const modifier = new AnimationModifier({
        animation: {
          keyframes: PULSE,
          duration: 750,
          easing: 'ease-in-out',
          iterations: 'infinite',
          direction: 'alternate',
        },
      })

      const rules = modifier.getStaticCSS('.card')

      expect(rules.some(rule => rule.startsWith('@keyframes '))).toBe(true)
      expect(
        rules.some(rule =>
          /^\.card \{ animation: tachui-animation-\w+ 750ms ease-in-out infinite alternate; \}$/.test(
            rule
          )
        )
      ).toBe(true)
    })
  })

  describe('createAnimationKeyframeRule', () => {
    it('is stable for equal content and distinct for different content', () => {
      expect(createAnimationKeyframeRule(PULSE).name).toBe(
        createAnimationKeyframeRule({ ...PULSE }).name
      )
      expect(createAnimationKeyframeRule(PULSE).name).not.toBe(
        createAnimationKeyframeRule(SLIDE).name
      )
    })

    it('names with a valid CSS identifier', () => {
      expect(createAnimationKeyframeRule(PULSE).name).toMatch(
        /^tachui-animation-[a-z0-9]+$/
      )
    })

    it('kebab-cases camelCase properties in the emitted rule', () => {
      const { rule } = createAnimationKeyframeRule({
        '0%': { backgroundColor: 'red', transformOrigin: 'center' },
      })

      expect(rule).toContain('background-color: red;')
      expect(rule).toContain('transform-origin: center;')
    })

    it('distinguishes a changed value from an unchanged one', () => {
      const before = createAnimationKeyframeRule({ '50%': { opacity: '0.5' } })
      const after = createAnimationKeyframeRule({ '50%': { opacity: '0.6' } })

      expect(before.name).not.toBe(after.name)
    })
  })

  describe('injectAnimationKeyframes', () => {
    it('creates the shared stylesheet on first use', () => {
      expect(stylesheet()).toBeNull()

      const { name, rule } = createAnimationKeyframeRule(PULSE)
      injectAnimationKeyframes(name, rule)

      expect(stylesheet()).not.toBeNull()
      expect(stylesheet()!.textContent).toContain(rule)
    })

    it('is idempotent for a name already present', () => {
      const { name, rule } = createAnimationKeyframeRule(PULSE)

      injectAnimationKeyframes(name, rule)
      const afterFirst = stylesheet()!.textContent

      injectAnimationKeyframes(name, rule)
      expect(stylesheet()!.textContent).toBe(afterFirst)
    })
  })
})
