import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { batch, createComputed, createSignal, flushSync, type ComponentInstance, type DOMNode, DOMRenderer } from '@tachui/core'
import { Text } from '@tachui/primitives'
import { registerBasicModifiers } from '@tachui/modifiers'
import { globalModifierRegistry } from '@tachui/registry'
import { getSubscriberCount } from '../../core/tools/testing/reactive-test-helpers'
import { Show } from '../src/conditional/Show'

function makeTextComponent(content: string | (() => string)): ComponentInstance {
  return {
    type: 'component',
    id: `text-${Math.random().toString(36).slice(2)}`,
    mounted: false,
    cleanup: [],
    props: { content },
    render: () => {
      const resolved = typeof content === 'function' ? content() : content
      return [
        {
          type: 'element',
          tag: 'span',
          props: {},
          children: [{ type: 'text', text: resolved }],
        } as DOMNode,
      ]
    },
  }
}

function makeContainer(children: ComponentInstance[]): ComponentInstance {
  return {
    type: 'component',
    id: `container-${Math.random().toString(36).slice(2)}`,
    mounted: false,
    cleanup: [],
    props: {},
    render: () => [
      {
        type: 'element',
        tag: 'div',
        props: {},
        children: children.flatMap(child => child.render()),
      } as DOMNode,
    ],
  }
}

async function waitForUpdate(frames = 2): Promise<void> {
  for (let i = 0; i < frames; i++) {
    await new Promise(resolve => setTimeout(resolve, 0))
  }
}

describe('Show reactive rendering depth', () => {
  let container: HTMLElement
  let renderer: DOMRenderer

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    registerBasicModifiers({ registry: globalModifierRegistry })
  })

  afterEach(() => {
    renderer.cleanup()
    container.remove()
  })

  function renderToDOM(component: ComponentInstance): HTMLElement {
    const nodes = component.render()
    const nodeArray = Array.isArray(nodes) ? nodes : [nodes]
    const element = renderer.render(nodeArray[0]) as HTMLElement
    container.appendChild(element)
    return element
  }

  describe('Basic signal-driven show/hide', () => {
    it('hides when false and shows when true', async () => {
      const [visible, setVisible] = createSignal(false)
      const show = Show({
        when: visible,
        children: makeTextComponent('Visible content'),
      })

      const element = renderToDOM(show)
      expect(element.textContent).not.toContain('Visible content')

      setVisible(true)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('Visible content')
    })

    it('renders else branch when false', async () => {
      const [visible, setVisible] = createSignal(false)
      const show = Show({
        when: visible,
        children: makeTextComponent('Primary'),
        fallback: makeTextComponent('Else branch'),
      })

      const element = renderToDOM(show)
      expect(element.textContent).toContain('Else branch')
      expect(element.textContent).not.toContain('Primary')

      setVisible(true)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('Primary')
      expect(element.textContent).not.toContain('Else branch')
    })

    it('toggles 3 times and always renders the correct branch', async () => {
      const [visible, setVisible] = createSignal(false)
      const show = Show({
        when: visible,
        children: makeTextComponent('ON'),
        fallback: makeTextComponent('OFF'),
      })

      const element = renderToDOM(show)
      expect(element.textContent).toContain('OFF')

      setVisible(true)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('ON')

      setVisible(false)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('OFF')

      setVisible(true)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('ON')
    })
  })

  describe('Show with modifier-bearing children', () => {
    it('stops tracking hidden child signals while hidden', async () => {
      const [visible, setVisible] = createSignal(false)
      const [childValue] = createSignal('child')
      const child = makeTextComponent(() => childValue())
      const show = Show({ when: visible, children: child })

      renderToDOM(show)
      expect(getSubscriberCount(childValue)).toBe(0)

      setVisible(true)
      flushSync()
      await waitForUpdate()
      expect(getSubscriberCount(childValue)).toBeGreaterThan(0)

      setVisible(false)
      flushSync()
      await waitForUpdate()
      expect(getSubscriberCount(childValue)).toBe(0)
    })

    it('revealed modifier child reflects current signal value (no stale style)', async () => {
      const [visible, setVisible] = createSignal(false)
      const [fontSize, setFontSize] = createSignal(12)
      const styledText = Text('styled').fontSize(fontSize).build()
      const show = Show({ when: visible, children: styledText })

      const element = renderToDOM(show)
      setFontSize(24)
      flushSync()

      setVisible(true)
      flushSync()
      await waitForUpdate()

      const span = element.querySelector('span')
      expect(span).not.toBeNull()
      expect((span as HTMLElement).style.fontSize).toBe('24px')
    })

    it('does not accumulate duplicate subscriptions over 10 show/hide cycles', async () => {
      const [visible, setVisible] = createSignal(false)
      const [s1] = createSignal(10)
      const [s2] = createSignal(8)
      const [s3] = createSignal(6)
      const [s4] = createSignal(1)
      const [s5] = createSignal(100)

      const child = Text('multi')
        .fontSize(s1)
        .padding(s2)
        .margin(s3)
        .opacity(s4)
        .width(s5)
        .build()

      const show = Show({ when: visible, children: child })
      renderToDOM(show)

      let peakS1 = 0
      for (let i = 0; i < 10; i++) {
        setVisible(true)
        flushSync()
        await waitForUpdate()
        peakS1 = Math.max(peakS1, getSubscriberCount(s1))
        setVisible(false)
        flushSync()
        await waitForUpdate()
      }

      expect(peakS1).toBeGreaterThan(0)
      expect(getSubscriberCount(s1)).toBe(0)
      expect(getSubscriberCount(s2)).toBe(0)
      expect(getSubscriberCount(s3)).toBe(0)
      expect(getSubscriberCount(s4)).toBe(0)
      expect(getSubscriberCount(s5)).toBe(0)
    })
  })

  describe('Show with computed condition', () => {
    it('reacts to both a and b updates via computed(a > b)', async () => {
      const [a, setA] = createSignal(1)
      const [b, setB] = createSignal(2)
      const show = Show({
        when: createComputed(() => a() > b()),
        children: makeTextComponent('GT'),
        fallback: makeTextComponent('LE'),
      })

      const element = renderToDOM(show)
      expect(element.textContent).toContain('LE')

      setA(5)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('GT')

      setB(9)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('LE')
    })

    it('handles boolean edge transitions (false/false, true/true, flip)', async () => {
      const [left, setLeft] = createSignal(false)
      const [right, setRight] = createSignal(false)
      const show = Show({
        when: createComputed(() => left() && right()),
        children: makeTextComponent('BOTH_TRUE'),
        fallback: makeTextComponent('NOT_BOTH_TRUE'),
      })

      const element = renderToDOM(show)
      expect(element.textContent).toContain('NOT_BOTH_TRUE')

      setLeft(true)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('NOT_BOTH_TRUE')

      setRight(true)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('BOTH_TRUE')

      setLeft(false)
      flushSync()
      await waitForUpdate()
      expect(element.textContent).toContain('NOT_BOTH_TRUE')
    })
  })

  describe('Nested Show', () => {
    it('pauses inner subscriptions when outer show is hidden and restores current state when shown', async () => {
      const [outerVisible, setOuterVisible] = createSignal(true)
      const [innerVisible] = createSignal(true)
      const [innerValue, setInnerValue] = createSignal('A')

      const innerShow = Show({
        when: innerVisible,
        children: makeTextComponent(() => innerValue()),
      })
      const outerShow = Show({
        when: outerVisible,
        children: innerShow,
      })

      const element = renderToDOM(outerShow)
      expect(getSubscriberCount(innerValue)).toBeGreaterThan(0)
      expect(element.textContent).toContain('A')

      setOuterVisible(false)
      flushSync()
      await waitForUpdate()
      expect(getSubscriberCount(innerValue)).toBe(0)

      setInnerValue('B')
      flushSync()
      setOuterVisible(true)
      flushSync()
      await waitForUpdate()

      expect(getSubscriberCount(innerValue)).toBeGreaterThan(0)
      expect(element.textContent).toContain('B')
    })
  })

  describe('Performance', () => {
    it('50 Show components update in one batched signal change without extra rerenders', async () => {
      const [visible, setVisible] = createSignal(false)
      const renderCounts = Array.from({ length: 50 }, () => ({ count: 0 }))

      const children = renderCounts.map((counter, index) =>
        Show({
          when: visible,
          children: makeTextComponent(() => {
            counter.count += 1
            return `Item-${index}`
          }),
        })
      )

      const root = makeContainer(children)
      const element = renderToDOM(root)

      batch(() => {
        setVisible(true)
        setVisible(false)
        setVisible(true)
      })
      flushSync()
      await waitForUpdate()

      const totalRenders = renderCounts.reduce((sum, entry) => sum + entry.count, 0)
      // `visible` starts false and ends true in one batch, so each child render fn runs once.
      expect(totalRenders).toBe(50)
      expect(element.textContent).toContain('Item-0')
      expect(element.textContent).toContain('Item-49')
    })
  })
})
