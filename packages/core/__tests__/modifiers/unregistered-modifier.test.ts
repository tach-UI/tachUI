/**
 * A modifier whose package has not been imported
 *
 * The effect modifiers are registered by `@tachui/modifiers/preload/effects`.
 * Without that import `.shadow` used to read as undefined, so the call failed
 * with "shadow is not a function". It now throws naming the import.
 *
 * The shared test setup imports the effects preload, so each test here hides
 * a few of them from the registry instead.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { globalModifierRegistry } from '@tachui/registry'
import { configureCore } from '../../src/config'
import { resetProxyCache } from '../../src/modifiers'
import { createModifierBuilder } from '../../src/modifiers/builder'
import {
  isUnregisteredModifierMethod,
  unregisteredModifierMethod,
} from '../../src/modifiers/unregistered'
import { withModifiers } from '../../src/components/wrapper'
import { ComponentWithCSSClasses } from '../../src/css-classes'
import type { ComponentInstance, ComponentProps } from '../../src/runtime/types'
import { h, text } from '../../src/runtime'

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

  /** Shares its name with an effect modifier. */
  focus(): string {
    return 'own focus'
  }
}

const IMPORT_ERROR =
  /Modifier 'shadow' is not registered\. .*import '@tachui\/modifiers\/preload\/effects'/

function hideFromRegistry(...names: string[]) {
  const hidden = new Set(names)
  const has = globalModifierRegistry.has.bind(globalModifierRegistry)
  const get = globalModifierRegistry.get.bind(globalModifierRegistry)
  vi.spyOn(globalModifierRegistry, 'has').mockImplementation(name =>
    hidden.has(name) ? false : has(name)
  )
  vi.spyOn(globalModifierRegistry, 'get').mockImplementation(((name: string) =>
    hidden.has(name) ? undefined : get(name)) as typeof globalModifierRegistry.get)
}

describe('unregistered modifiers', () => {
  beforeEach(() => {
    configureCore({ proxyModifiers: true })
    resetProxyCache()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    configureCore({ proxyModifiers: false })
    resetProxyCache()
  })

  it('knows only the modifiers it lists', () => {
    expect(unregisteredModifierMethod('shadow')).toBeTypeOf('function')
    expect(unregisteredModifierMethod('backdropFilter')).toBeTypeOf('function')
    expect(unregisteredModifierMethod('paddin')).toBeUndefined()
    expect(unregisteredModifierMethod('then')).toBeUndefined()

    expect(isUnregisteredModifierMethod(unregisteredModifierMethod('shadow'))).toBe(true)
    expect(isUnregisteredModifierMethod(() => {})).toBe(false)
    expect(isUnregisteredModifierMethod(undefined)).toBe(false)
  })

  describe('on the builder', () => {
    it('throws naming the import when called', () => {
      hideFromRegistry('shadow', 'backdropFilter')
      const builder = createModifierBuilder(new SampleComponent()) as any

      expect(typeof builder.shadow).toBe('function')
      expect(() => builder.shadow({ x: 0, y: 6, blur: 18, color: 'red' })).toThrow(
        IMPORT_ERROR
      )
      expect(() => builder.backdropFilter('blur(20px)')).toThrow(
        /import '@tachui\/modifiers\/preload\/effects'/
      )
    })

    it('uses the registered modifier once the import has run', () => {
      const builder = createModifierBuilder(new SampleComponent()) as any

      expect(isUnregisteredModifierMethod(builder.shadow)).toBe(false)
      expect(builder.shadow({ x: 0, y: 6, blur: 18, color: 'red' })).toBe(builder)
      expect(builder.build().modifiers).toHaveLength(1)
    })

    it('still reads an unknown name as undefined', () => {
      const builder = createModifierBuilder(new SampleComponent()) as any

      expect(builder.paddin).toBeUndefined()
      expect(builder.then).toBeUndefined()
    })
  })

  describe('on a component chain', () => {
    it('throws naming the import when called', () => {
      hideFromRegistry('shadow')
      const component = withModifiers(new SampleComponent()) as any

      expect(() => component.shadow({ x: 0, y: 6, blur: 18, color: 'red' })).toThrow(
        IMPORT_ERROR
      )
      expect(() => component.modifier.shadow({ x: 0, y: 6, blur: 18, color: 'red' })).toThrow(
        IMPORT_ERROR
      )
    })

    it('does not report the modifier as present', () => {
      hideFromRegistry('shadow')
      const component = withModifiers(new SampleComponent()) as ComponentInstance

      expect('shadow' in component).toBe(false)
    })

    it('does not hide a method of the component with the same name', () => {
      hideFromRegistry('focus')
      const component = withModifiers(new SampleComponent()) as any

      expect(component.focus()).toBe('own focus')
    })

    it('uses the modifier once it is registered', () => {
      const component = withModifiers(new SampleComponent()) as any

      hideFromRegistry('shadow')
      expect(() => component.shadow({ x: 0, y: 6, blur: 18, color: 'red' })).toThrow(
        IMPORT_ERROR
      )

      vi.restoreAllMocks()
      expect(component.shadow({ x: 0, y: 6, blur: 18, color: 'red' })).toBe(component)
      expect(component.build().modifiers).toHaveLength(1)
    })
  })
})
