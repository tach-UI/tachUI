/**
 * Runtime behaviour of the `ButtonStyles.*` helpers (#307)
 *
 * The type-level half of this lives in `Button.test-d.ts`, which pins that
 * passing a props object *and* a third argument no longer compiles. These pin
 * the other half: that every form the helpers do accept forwards what it was
 * given, since the defect being fixed was a silent drop rather than a crash —
 * nothing threw, the props simply went missing.
 */

import { describe, expect, it, vi } from 'vitest'
import { ButtonStyles } from '../../src/controls/Button'

/** The props the helper actually handed to the component. */
function propsOf(component: unknown): Record<string, unknown> {
  return (component as { props: Record<string, unknown> }).props
}

const VARIANT_HELPERS = [
  ['Filled', 'filled'],
  ['Outlined', 'outlined'],
  ['Plain', 'plain'],
  ['Bordered', 'bordered'],
] as const

const ROLE_HELPERS = [
  ['Destructive', 'destructive'],
  ['Cancel', 'cancel'],
] as const

describe('ButtonStyles', () => {
  describe.each(VARIANT_HELPERS)('%s', (name, variant) => {
    const helper = ButtonStyles[name]

    it('applies its variant', () => {
      expect(propsOf(helper('Save')).variant).toBe(variant)
    })

    it('forwards an action and third-argument props', () => {
      const action = vi.fn()
      const props = propsOf(helper('Save', action, { css: 'x' }))

      expect(props.action).toBe(action)
      expect(props.css).toBe('x')
      expect(props.variant).toBe(variant)
      expect(props.title).toBe('Save')
    })

    it('forwards a props object passed second', () => {
      const action = vi.fn()
      const props = propsOf(helper('Save', { css: 'x', action }))

      expect(props.css).toBe('x')
      expect(props.action).toBe(action)
      expect(props.variant).toBe(variant)
    })

    it('reads props from the third argument when the action is undefined', () => {
      // `helper(title, undefined, props)` is a real call pattern — an optional
      // handler that happens to be absent — so an explicit `undefined` in the
      // action slot must not make the third argument unreachable.
      expect(propsOf(helper('Save', undefined, { css: 'x' })).css).toBe('x')
    })
  })

  describe.each(ROLE_HELPERS)('%s', (name, role) => {
    const helper = ButtonStyles[name]

    it('applies its role', () => {
      expect(propsOf(helper('Delete')).role).toBe(role)
    })

    it('forwards an action and third-argument props', () => {
      const action = vi.fn()
      const props = propsOf(helper('Delete', action, { css: 'x' }))

      expect(props.action).toBe(action)
      expect(props.css).toBe('x')
      expect(props.role).toBe(role)
    })

    it('forwards a props object passed second', () => {
      expect(propsOf(helper('Delete', { css: 'x' })).css).toBe('x')
    })
  })

  it('keeps its own prop even when the caller supplies one', () => {
    // `Omit` cannot reject this — `ButtonProps` inherits `[key: string]: any`
    // from `ComponentProps`, so the index signature still admits the key the
    // `Omit` removed. What the helper can guarantee is that its override wins,
    // rather than the call quietly producing a button of the wrong style.
    const props = propsOf(ButtonStyles.Filled('Save', { variant: 'plain' }))

    expect(props.variant).toBe('filled')
  })
})
