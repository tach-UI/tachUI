import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import { globalModifierRegistry } from '@tachui/registry'
import { configureCore } from '../../src/config'
import { resetProxyCache } from '../../src/modifiers'
import { withModifiers } from '../../src/components/wrapper'
import { createComponentInstance } from '../../src/components/factory'
import { ComponentWithCSSClasses } from '../../src/css-classes'
import type {
  CloneableComponent,
  CloneOptions,
  ComponentInstance,
  ComponentProps,
} from '../../src/runtime/types'
import { h, text } from '../../src/runtime'

class SampleComponent
  extends ComponentWithCSSClasses
  implements CloneableComponent<ComponentProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(public props: ComponentProps = {}) {
    super()
    this.id = `sample-${Math.random().toString(36).slice(2)}`
  }

  render() {
    return [h('div', {}, text('sample'))]
  }

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    const clone = new SampleComponent({ ...this.props })
    return clone as this
  }

  deepClone(): this {
    return this.shallowClone()
  }
}

describe('modifier proxy integration', () => {
  const modifierName = 'proxyTestModifier'

  beforeEach(() => {
    configureCore({ proxyModifiers: false })
    resetProxyCache()
  })

  afterEach(() => {
    configureCore({ proxyModifiers: false })
    resetProxyCache()
  })

  it('exposes modifier methods when proxy mode enabled', () => {
    configureCore({ proxyModifiers: true })

    if (!globalModifierRegistry.has(modifierName)) {
      globalModifierRegistry.register(modifierName, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: node => node,
      }))
    }

    const component = withModifiers(new SampleComponent())
    const proxy = component as ComponentInstance & { [modifierName]: () => any }

    expect(typeof proxy[modifierName]).toBe('function')

    const result = proxy[modifierName]()
    expect(result).toBe(proxy)
  })

  it('reuses factory-created proxies when applying modifiers later', () => {
    configureCore({ proxyModifiers: true })

    if (!globalModifierRegistry.has(modifierName)) {
      globalModifierRegistry.register(modifierName, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: node => node,
      }))
    }

    const instance = createComponentInstance(SampleComponent, {})
    const first = withModifiers(instance) as ComponentInstance & {
      [modifierName]: () => any
    }
    const second = withModifiers(instance) as ComponentInstance & {
      [modifierName]: () => any
    }

    expect(first).toBe(second)
    expect(typeof first[modifierName]).toBe('function')
  })

  it('returns proxied clones when clone() is invoked', () => {
    configureCore({ proxyModifiers: true })

    if (!globalModifierRegistry.has(modifierName)) {
      globalModifierRegistry.register(modifierName, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: node => node,
      }))
    }

    const proxy = withModifiers(new SampleComponent()) as ComponentInstance & {
      [modifierName]: () => any
    }

    const clone = proxy.clone()

    expect(typeof (clone as any)[modifierName]).toBe('function')
    expect(clone).not.toBe(proxy)
  })

  it('supports chaining modifier invocations on the proxy', () => {
    configureCore({ proxyModifiers: true })

    if (!globalModifierRegistry.has(modifierName)) {
      globalModifierRegistry.register(modifierName, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: node => node,
      }))
    }

    const proxy = withModifiers(new SampleComponent()) as ComponentInstance & {
      [modifierName]: () => any
    }

    const chained = proxy[modifierName]()[modifierName]()

    expect(chained).toBe(proxy)
  })

  it('maintains method binding when functions are extracted from the proxy', () => {
    configureCore({ proxyModifiers: true })

    if (!globalModifierRegistry.has(modifierName)) {
      globalModifierRegistry.register(modifierName, () => ({
        type: 'appearance',
        priority: 100,
        properties: {},
        apply: node => node,
      }))
    }

    const proxy = withModifiers(new SampleComponent()) as ComponentInstance & {
      clone: () => ComponentInstance
    }

    const { clone } = proxy
    const detachedClone = clone()

    expect(detachedClone).not.toBe(proxy)
    expect(typeof (detachedClone as any)[modifierName]).toBe('function')
  })

  it('preserves standard symbol lookups without interception side effects', () => {
    configureCore({ proxyModifiers: true })
    const proxy = withModifiers(new SampleComponent()) as ComponentInstance

    expect(proxy[Symbol.toStringTag]).toBeUndefined()
  })

  it('throws when invoking unknown modifiers', () => {
    configureCore({ proxyModifiers: true })
    const proxy = withModifiers(new SampleComponent()) as ComponentInstance & {
      nonExisting: () => any
    }

    expect(() => (proxy as any).nonExisting()).toThrow()
  })

  it('falls back to legacy builder when proxy disabled', () => {
    configureCore({ proxyModifiers: false })

    const component = withModifiers(new SampleComponent())

    expect('modifier' in component).toBe(true)
    expect((component as any)[modifierName]).toBeUndefined()
  })
})
