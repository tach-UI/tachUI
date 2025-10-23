import { describe, it, beforeEach, afterEach, expect } from 'vitest'
import { globalModifierRegistry } from '@tachui/registry'
import { configureCore } from '../../src/config'
import { resetProxyCache } from '../../src/modifiers'
import { withModifiers } from '../../src/components/wrapper'
import { generateModifierTypes, createModifierMetadataSnapshot } from '../../src/modifiers/type-generator'
import { ComponentWithCSSClasses } from '../../src/css-classes'
import type { ComponentInstance, ComponentProps, DOMNode } from '../../src/runtime/types'

class ChainingHost extends ComponentWithCSSClasses {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(public props: ComponentProps = {}) {
    super()
    this.id = `chain-host-${Math.random().toString(36).slice(2)}`
  }

  render(): DOMNode[] {
    return [
      {
        type: 'element' as const,
        tag: 'div',
        props: { className: 'chain-host', ...this.props },
        children: [],
      },
    ]
  }
}

function registerTestModifier(name: string, category = 'testing') {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, () => ({
      type: 'appearance',
      priority: 100,
      properties: { name },
      apply: node => node,
    }))
  }

  if (globalModifierRegistry.getPluginInfo?.('phase4-tests') === undefined) {
    globalModifierRegistry.registerPlugin?.({
      name: 'phase4-tests',
      version: '0.0.0-test',
      description: 'Phase 4 modifier chaining tests',
      author: 'test-suite',
      homepage: 'https://tachui.dev/tests',
    })
  }

  globalModifierRegistry.registerMetadata({
    name,
    plugin: 'phase4-tests',
    category,
    priority: 100,
    signature: '(): void',
    description: 'Phase 4 chaining test modifier',
  })
}

describe('SwiftUI-style modifier chaining', () => {
  beforeEach(() => {
    configureCore({ proxyModifiers: false })
    resetProxyCache()
  })

  afterEach(() => {
    configureCore({ proxyModifiers: false })
    resetProxyCache()
  })

  it('supports chaining via the legacy builder API', () => {
    const modifierA = `phase4ChainA${Date.now().toString(36)}`
    const modifierB = `${modifierA}b`
    registerTestModifier(modifierA)
    registerTestModifier(modifierB)

    const component = withModifiers(new ChainingHost()) as ComponentInstance & {
      modifier: Record<string, (...args: any[]) => any>
      modifierBuilder: { modifiers: any[] }
    }

    const built = component.modifier[modifierA]()[modifierB]().build()

    expect(built.modifiers.length).toBeGreaterThanOrEqual(2)
    expect(component.modifierBuilder.modifiers.length).toBeGreaterThanOrEqual(2)
    const modifierNames = component.modifierBuilder.modifiers.map(
      (entry: any) => entry.properties?.name,
    )
    expect(modifierNames).toContain(modifierA)
    expect(modifierNames).toContain(modifierB)
  })

  it('supports direct chaining on the proxy when enabled', () => {
    configureCore({ proxyModifiers: true })
    resetProxyCache()

    const modifierName = `phase4ProxyChain${Date.now().toString(36)}`
    registerTestModifier(modifierName)

    const proxy = withModifiers(new ChainingHost()) as ComponentInstance & {
      [key: string]: () => any
    }

    const chained = proxy[modifierName]()[modifierName]()
    expect(chained).toBe(proxy)
  })

  it('handles long modifier chains without losing fluent semantics', () => {
    configureCore({ proxyModifiers: true })
    resetProxyCache()

    const chainNames = Array.from({ length: 20 }, (_, index) => {
      const name = `phase4LongChain${index}${Date.now().toString(36)}`
      registerTestModifier(name)
      return name
    })

    const proxy = withModifiers(new ChainingHost()) as ComponentInstance & {
      [key: string]: () => any
    }

    const final = chainNames.reduce((acc, name) => acc[name](), proxy as any)
    expect(final).toBe(proxy)
  })

  it('applies modifiers across categories and preserves invocation order', () => {
    const timestamp = Date.now().toString(36)
    const categoryNames = [
      { name: `phase4Layout${timestamp}`, category: 'layout' },
      { name: `phase4Appearance${timestamp}`, category: 'appearance' },
      { name: `phase4Typography${timestamp}`, category: 'typography' },
    ]

    categoryNames.forEach(({ name, category }) =>
      registerTestModifier(name, category),
    )

    const component = withModifiers(new ChainingHost()) as ComponentInstance & {
      modifier: Record<string, (...args: any[]) => any>
      modifierBuilder: { modifiers: any[] }
    }

    categoryNames.forEach(({ name }) => {
      component.modifier[name]()
    })

    const appliedNames = component.modifierBuilder.modifiers.map(
      (entry: any) => entry.properties?.name,
    )
    expect(appliedNames).toEqual(categoryNames.map(entry => entry.name))

    const snapshot = createModifierMetadataSnapshot()
    expect(Object.keys(snapshot.categories)).toEqual(
      expect.arrayContaining(['layout', 'appearance', 'typography', 'testing']),
    )
  })

  it('allows chaining without explicit build calls in both modes', () => {
    const builderModifier = `phase4BuilderNoBuild${Date.now().toString(36)}`
    registerTestModifier(builderModifier)

    const builderComponent = withModifiers(new ChainingHost()) as ComponentInstance & {
      modifier: Record<string, (...args: any[]) => any>
      modifierBuilder: { modifiers: any[] }
    }

    const builderResult = builderComponent.modifier[builderModifier]()
    expect(typeof builderResult.build).toBe('function')
    expect(builderComponent.modifierBuilder.modifiers.length).toBeGreaterThan(0)

    configureCore({ proxyModifiers: true })
    resetProxyCache()

    const proxyModifier = `phase4ProxyNoBuild${Date.now().toString(36)}`
    registerTestModifier(proxyModifier)
    const proxy = withModifiers(new ChainingHost()) as ComponentInstance & {
      [key: string]: () => any
    }

    const proxiedResult = proxy[proxyModifier]()
    expect(proxiedResult).toBe(proxy)
    expect(typeof proxiedResult.render).toBe('function')
  })

  it('emits registered modifiers in the generated type declarations', () => {
    const modifierName = `phase4Typegen${Date.now().toString(36)}`
    registerTestModifier(modifierName)

    const declaration = generateModifierTypes()
    expect(declaration).toContain(modifierName)

    const snapshot = createModifierMetadataSnapshot()
    const categories = Object.values(snapshot.categories).flat()
    const entry = categories.find(item => item.name === modifierName)
    expect(entry).toBeDefined()
    expect(entry?.plugin).toBe('phase4-tests')
  })
})
