import { describe, expect, it } from 'vitest'
import { animation } from '../../src/animation'
import { transition } from '../../src/basic/animation'
import {
  HoverModifier,
  active,
  focus,
  hover,
  hoverEffect,
  pressed,
} from '../../src/effects/effects'

describe('effects static css extraction', () => {
  it('emits hover pseudo-class rules for hover modifier', () => {
    const modifier = hover(
      { backgroundColor: '#f3f3f3', transform: 'scale(1.02)' },
      150
    )
    const rules = modifier.getStaticCSS?.('[data-component-id="cmp-hover"]') ?? []

    expect(rules.some(rule => rule.includes('transition: all 150ms ease'))).toBe(
      true
    )
    expect(rules.some(rule => rule.includes(':hover'))).toBe(true)
    expect(rules.some(rule => rule.includes('background-color: #f3f3f3'))).toBe(
      true
    )
    expect(rules.some(rule => rule.includes('!important'))).toBe(false)
  })

  it('emits focus and active pseudo-classes for focus/active/pressed factories', () => {
    const focusRules =
      focus({ outline: '2px solid #007AFF' }).getStaticCSS?.(
        '[data-component-id="cmp-focus"]'
      ) ?? []
    const activeRules =
      active({ opacity: 0.9 }).getStaticCSS?.(
        '[data-component-id="cmp-active"]'
      ) ?? []
    const pressedRules =
      pressed({ transform: 'scale(0.98)' }).getStaticCSS?.(
        '[data-component-id="cmp-pressed"]'
      ) ?? []

    expect(focusRules.some(rule => rule.includes(':focus'))).toBe(true)
    expect(activeRules.some(rule => rule.includes(':active'))).toBe(true)
    expect(pressedRules.some(rule => rule.includes(':active'))).toBe(true)
  })

  it('returns no static css when hover modifier is disabled', () => {
    const modifier = new HoverModifier({
      hoverStyles: { color: '#333' },
      isEnabled: false,
    })

    const rules = modifier.getStaticCSS?.('[data-component-id="cmp-disabled"]') ?? []
    expect(rules).toEqual([])
  })

  it('emits keyframes and animation declaration', () => {
    const modifier = animation({
      keyframes: {
        from: { opacity: '0' },
        to: { opacity: '1' },
      },
      duration: 180,
      easing: 'linear',
      iterations: 2,
      direction: 'alternate',
    })

    const rules =
      modifier.getStaticCSS?.('[data-component-id="cmp-animation"]') ?? []

    expect(rules.some(rule => rule.includes('@keyframes tachui-animation-'))).toBe(
      true
    )
    expect(
      rules.some(
        rule =>
          rule.includes('[data-component-id="cmp-animation"] { animation:') &&
          rule.includes('180ms linear 2 alternate')
      )
    ).toBe(true)
  })

  it('emits transition declarations including transition none', () => {
    const noneRules =
      transition('none').getStaticCSS?.('[data-component-id="cmp-transition-none"]') ??
      []
    const valueRules =
      transition({
        property: 'opacity',
        duration: 120,
        easing: 'ease-in',
        delay: 10,
      }).getStaticCSS?.('[data-component-id="cmp-transition-value"]') ?? []

    expect(noneRules).toContain(
      '[data-component-id="cmp-transition-none"] { transition: none; }'
    )
    expect(valueRules).toContain(
      '[data-component-id="cmp-transition-value"] { transition: opacity 120ms ease-in 10ms; }'
    )
  })

  it('emits preset hover effect styles', () => {
    const rules =
      hoverEffect('lift').getStaticCSS?.('[data-component-id="cmp-hover-preset"]') ??
      []

    expect(rules.some(rule => rule.includes('translateY(-2px)'))).toBe(true)
    expect(
      rules.some(rule => rule.includes('box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15)'))
    ).toBe(true)
  })
})
