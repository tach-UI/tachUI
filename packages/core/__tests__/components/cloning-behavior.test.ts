import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { globalModifierRegistry } from '@tachui/registry'
import { configureCore } from '../../src/config'
import { resetProxyCache } from '../../src/modifiers'
import { withModifiers, Layout } from '../../src/components'
import { ComponentWithCSSClasses } from '../../src/css-classes'
import { clonePropsPreservingReactivity, resetLifecycleState } from '../../src/utils/clone-helpers'
import type {
  CloneableComponent,
  CloneOptions,
  ComponentInstance,
  ComponentProps,
  DOMNode,
} from '../../src/runtime/types'

class LeafComponent
  extends ComponentWithCSSClasses
  implements CloneableComponent<ComponentProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(public props: ComponentProps = {}) {
    super()
    this.id = `leaf-${Math.random().toString(36).slice(2)}`
  }

  render(): DOMNode[] {
    return [
      {
        type: 'element' as const,
        tag: 'div',
        props: { className: 'leaf', ...this.props },
        children: [],
      },
    ]
  }

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    const clone = new LeafComponent(clonePropsPreservingReactivity(this.props))
    resetLifecycleState(clone)
    return clone as this
  }

  deepClone(): this {
    return this.shallowClone()
  }
}

describe('Cloning and mutation behaviour', () => {
  beforeEach(() => {
    configureCore({ proxyModifiers: false })
  })

  afterEach(() => {
    configureCore({ proxyModifiers: false })
    resetProxyCache()
  })

  describe('Legacy builder mode', () => {
    it('mutates the builder state and materialises onto the component when built', () => {
      const component = withModifiers(new LeafComponent())
      const builder = (component as any).modifierBuilder
      const builderCountBefore = (builder as any).modifiers.length

      builder.addModifier({
        type: 'layout',
        priority: 100,
        properties: { padding: 12 },
        apply: node => node,
      })

      expect((builder as any).modifiers.length).toBe(builderCountBefore + 1)

      const built = builder.build()

      expect(built.modifiers.length).toBeGreaterThan(builderCountBefore)
      expect(built.modifiers.at(-1)?.properties).toEqual({
        padding: 12,
      })
    })

    it('creates shallow clones that share child instances but copy props', () => {
      const child = new LeafComponent({ role: 'nav' })
      const stack = Layout.VStack({
        spacing: 10,
        children: [child],
      }) as ComponentInstance & { clone: (options?: CloneOptions) => any }

      const shallowClone = stack.clone()

      expect(shallowClone).not.toBe(stack)
      expect(shallowClone.props).not.toBe(stack.props)
      expect(shallowClone.props.spacing).toBe(10)
      expect(shallowClone.children).not.toBe(stack.children)
      expect(shallowClone.children?.[0]).toBe(stack.children?.[0])
    })

    it('creates deep clones that duplicate nested components', () => {
      const child = new LeafComponent({ debugLabel: 'original-child' })
      const stack = Layout.VStack({
        spacing: 4,
        children: [child],
      }) as ComponentInstance & { clone: (options?: CloneOptions) => any }

      const deepClone = stack.clone({ deep: true })

      expect(deepClone).not.toBe(stack)
      expect(deepClone.children?.[0]).not.toBe(stack.children?.[0])
      expect(deepClone.children?.[0].props).toEqual(
        stack.children?.[0].props,
      )
    })

    it('keeps clone mutations isolated from the original component', () => {
      const stack = Layout.VStack({
        spacing: 16,
        children: [new LeafComponent({ className: 'original' })],
      }) as ComponentInstance & { clone: (options?: CloneOptions) => any }

      const deepClone = stack.clone({ deep: true })
      deepClone.props.spacing = 24
      ;(deepClone.children?.[0].props as ComponentProps).className =
        'clone-edited'

      expect(stack.props.spacing).toBe(16)
      expect(stack.children?.[0].props.className).toBe('original')
      expect(deepClone.props.spacing).toBe(24)
      expect(deepClone.children?.[0].props.className).toBe('clone-edited')
    })

    it('produces identical renders for original and clones', () => {
      const stack = Layout.VStack({
        spacing: 6,
        children: [new LeafComponent({ textContent: 'hello' })],
      }) as ComponentInstance & { clone: (options?: CloneOptions) => any }

      const deepClone = stack.clone({ deep: true })
      const renderSnapshot = (instance: ComponentInstance) =>
        instance.render().map(node => ({
          tag: node.tag,
          props: node.props,
          children: node.children,
        }))

      expect(renderSnapshot(stack)).toEqual(renderSnapshot(deepClone))
    })
  })

  describe('Proxy mode', () => {
    beforeEach(() => {
      configureCore({ proxyModifiers: true })
      resetProxyCache()
    })

    it('returns the same proxy instance for chained modifier calls', () => {
      const modifierName = `phase4Proxy${Date.now().toString(36)}`
      if (!globalModifierRegistry.has(modifierName)) {
        globalModifierRegistry.register(modifierName, () => ({
          type: 'appearance',
          priority: 100,
          properties: {},
          apply: node => node,
        }))
      }

      const component = withModifiers(new LeafComponent()) as ComponentInstance
      const chained = (component as any)[modifierName]()[modifierName]()

      expect(chained).toBe(component)
    })

    it('allows branching via clone without causing proxy cache collisions', () => {
      const component = withModifiers(new LeafComponent()) as ComponentInstance & {
        clone: () => ComponentInstance
      }

      const firstClone = component.clone()
      const secondClone = component.clone()

      expect(firstClone).not.toBe(secondClone)
      expect(firstClone).not.toBe(component)
      expect(secondClone).not.toBe(component)
    })
  })
})
