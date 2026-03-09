import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { h } from '../../src/runtime'
import { applyModifiersToNode, setExternalModifierRegistry } from '../../src/modifiers'
import { createRoot, createSignal, flushSync } from '../../src/reactive'
import { createTestRegistry } from '../../tools/testing/reactive-test-helpers'
import { registerBasicModifiers } from '@tachui/modifiers'
import type { ModifierRegistry } from '@tachui/registry'

type RegisteredFactory = (...args: any[]) => any
const testElements = new Set<HTMLElement>()

function applyRegisteredModifiers(
  registry: ModifierRegistry,
  element: HTMLElement,
  modifierCalls: Array<{ name: string; args: any[] }>
): void {
  createRoot(dispose => {
    const node = h('div')
    // Intentional low-level path: these tests target modifier re-application behavior directly.
    node.element = element

    const modifiers = modifierCalls.map(({ name, args }) => {
      const factory = registry.get(name) as RegisteredFactory | undefined
      if (!factory) {
        throw new Error(`Missing modifier factory in test registry: ${name}`)
      }
      return factory(...args)
    })

    applyModifiersToNode(node, modifiers, {
      componentId: `reactive-updates-test-${Math.random().toString(36).slice(2)}`,
      element,
      phase: 'creation',
    })

    // Tie reactive modifier effects to a disposable owner for test isolation.
    ;(element as any).__testDisposer = dispose
  })
  testElements.add(element)
}

describe('reactive modifier updates', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    document.body.innerHTML = ''
    registry = createTestRegistry()
    registerBasicModifiers({ registry })
    setExternalModifierRegistry(registry)
  })

  afterEach(() => {
    testElements.forEach(element => {
      ;(element as any).__testDisposer?.()
      delete (element as any).__testDisposer
    })
    testElements.clear()
    setExternalModifierRegistry(null)
  })

  describe('Appearance modifiers', () => {
    it('foregroundColor signal update propagates to DOM style', () => {
      const [color, setColor] = createSignal('#ff0000')
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'foregroundColor', args: [color] },
      ])

      expect(element.style.color).toBe('rgb(255, 0, 0)')
      setColor('#0000ff')
      flushSync()
      expect(element.style.color).toBe('rgb(0, 0, 255)')
    })

    it('backgroundColor signal update propagates to DOM style', () => {
      const [bgColor, setBgColor] = createSignal('#ffffff')
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'backgroundColor', args: [bgColor] },
      ])

      expect(element.style.background).toContain('rgb(255, 255, 255)')
      setBgColor('#111111')
      flushSync()
      expect(element.style.background).toContain('rgb(17, 17, 17)')
    })

    it('opacity signal toggle applies and removes opacity style', () => {
      const [opacity, setOpacity] = createSignal(1)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [{ name: 'opacity', args: [opacity] }])

      expect(element.style.opacity).toBe('1')
      setOpacity(0)
      flushSync()
      expect(element.style.opacity).toBe('0')
    })

    it('changing one appearance signal only updates that property', () => {
      const [color, setColor] = createSignal('#ff0000')
      const [bgColor] = createSignal('#00ff00')
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'foregroundColor', args: [color] },
        { name: 'backgroundColor', args: [bgColor] },
      ])

      const initialBackground = element.style.backgroundColor
      setColor('#0000ff')
      flushSync()

      expect(element.style.color).toBe('rgb(0, 0, 255)')
      expect(element.style.backgroundColor).toBe(initialBackground)
    })
  })

  describe('Typography modifiers', () => {
    it('fontSize signal update changes style', () => {
      const [size, setSize] = createSignal(14)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [{ name: 'fontSize', args: [size] }])

      expect(element.style.fontSize).toBe('14px')
      setSize(20)
      flushSync()
      expect(element.style.fontSize).toBe('20px')
    })

    it('fontWeight signal update changes style weight', () => {
      const [weight, setWeight] = createSignal('400')
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [{ name: 'fontWeight', args: [weight] }])

      expect(element.style.fontWeight).toBe('400')
      setWeight('700')
      flushSync()
      expect(element.style.fontWeight).toBe('700')
    })

    it('textAlign signal update changes alignment', () => {
      const [align, setAlign] = createSignal<'left' | 'center' | 'right'>('left')
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [{ name: 'textAlign', args: [align] }])

      expect(element.style.textAlign).toBe('left')
      setAlign('right')
      flushSync()
      expect(element.style.textAlign).toBe('right')
    })
  })

  describe('Layout modifiers', () => {
    it('padding signal increase updates style', () => {
      const [paddingValue, setPaddingValue] = createSignal(8)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [{ name: 'padding', args: [paddingValue] }])

      expect(element.style.padding).toBe('8px')
      setPaddingValue(16)
      flushSync()
      expect(element.style.padding).toBe('16px')
    })

    it('directional margin signal change updates style', () => {
      const [marginTopValue, setMarginTopValue] = createSignal(4)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'marginTop', args: [marginTopValue] },
      ])

      expect(element.style.marginTop).toBe('4px')
      setMarginTopValue(12)
      flushSync()
      expect(element.style.marginTop).toBe('12px')
    })

    it('width and height signals update styles', () => {
      const [width, setWidth] = createSignal(100)
      const [height, setHeight] = createSignal(40)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'width', args: [width] },
        { name: 'height', args: [height] },
      ])

      expect(element.style.width).toBe('100px')
      expect(element.style.height).toBe('40px')

      setWidth(180)
      setHeight(72)
      flushSync()

      expect(element.style.width).toBe('180px')
      expect(element.style.height).toBe('72px')
    })

    it('frame with reactive dimensions updates width and height', () => {
      const [width, setWidth] = createSignal(120)
      const [height, setHeight] = createSignal(60)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'frame', args: [{ width, height }] },
      ])

      expect(element.style.width).toBe('120px')
      expect(element.style.height).toBe('60px')

      setWidth(200)
      setHeight(90)
      flushSync()

      expect(element.style.width).toBe('200px')
      expect(element.style.height).toBe('90px')
    })
  })

  describe('Interaction modifiers', () => {
    it('onTap handler reads latest signal value at call time', () => {
      const [count, setCount] = createSignal(0)
      const tappedValues: number[] = []
      const element = document.createElement('button')

      applyRegisteredModifiers(registry, element, [
        {
          name: 'onTap',
          args: [() => tappedValues.push(count())],
        },
      ])

      setCount(3)
      flushSync()
      element.click()

      expect(tappedValues).toEqual([3])
    })

    it('onHover with reactive state propagates correctly', () => {
      const [isHovered, setIsHovered] = createSignal(false)
      const hoverChanges: boolean[] = []
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        {
          name: 'onHover',
          args: [
            (hovered: boolean) => {
              setIsHovered(hovered)
              hoverChanges.push(isHovered())
            },
          ],
        },
      ])

      element.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
      flushSync()
      element.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
      flushSync()

      expect(hoverChanges.length).toBe(2)
      expect(hoverChanges).toEqual([true, false])
      expect(isHovered()).toBe(false)
    })
  })

  describe('Chain integrity', () => {
    it('10-modifier chain with signal in position 5 leaves others unchanged', () => {
      const [fontSize, setFontSize] = createSignal(14)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'padding', args: [8] },
        { name: 'marginTop', args: [6] },
        { name: 'foregroundColor', args: ['#111111'] },
        { name: 'backgroundColor', args: ['#eeeeee'] },
        { name: 'fontSize', args: [fontSize] },
        { name: 'width', args: [150] },
        { name: 'height', args: [80] },
        { name: 'opacity', args: [0.9] },
        { name: 'cornerRadius', args: [10] },
        { name: 'textAlign', args: ['center'] },
      ])

      const baseline = {
        padding: element.style.padding,
        marginTop: element.style.marginTop,
        color: element.style.color,
        backgroundColor: element.style.backgroundColor,
        width: element.style.width,
        height: element.style.height,
        opacity: element.style.opacity,
        borderRadius: element.style.borderRadius,
        textAlign: element.style.textAlign,
      }

      setFontSize(18)
      flushSync()

      expect(element.style.fontSize).toBe('18px')
      expect(element.style.padding).toBe(baseline.padding)
      expect(element.style.marginTop).toBe(baseline.marginTop)
      expect(element.style.color).toBe(baseline.color)
      expect(element.style.backgroundColor).toBe(baseline.backgroundColor)
      expect(element.style.width).toBe(baseline.width)
      expect(element.style.height).toBe(baseline.height)
      expect(element.style.opacity).toBe(baseline.opacity)
      expect(element.style.borderRadius).toBe(baseline.borderRadius)
      expect(element.style.textAlign).toBe(baseline.textAlign)
    })

    it('shared signal updates two components', () => {
      const [color, setColor] = createSignal('#ff0000')
      const first = document.createElement('div')
      const second = document.createElement('div')

      applyRegisteredModifiers(registry, first, [
        { name: 'foregroundColor', args: [color] },
      ])
      applyRegisteredModifiers(registry, second, [
        { name: 'foregroundColor', args: [color] },
      ])

      setColor('#00ff00')
      flushSync()

      expect(first.style.color).toBe('rgb(0, 255, 0)')
      expect(second.style.color).toBe('rgb(0, 255, 0)')
    })

    it("changing one reactive modifier doesn't affect others on same component", () => {
      const [color, setColor] = createSignal('#222222')
      const [opacity] = createSignal(0.5)
      const [width] = createSignal(120)
      const element = document.createElement('div')

      applyRegisteredModifiers(registry, element, [
        { name: 'foregroundColor', args: [color] },
        { name: 'opacity', args: [opacity] },
        { name: 'width', args: [width] },
      ])

      const opacityBefore = element.style.opacity
      const widthBefore = element.style.width

      setColor('#abcdef')
      flushSync()

      expect(element.style.color).toBe('rgb(171, 205, 239)')
      expect(element.style.opacity).toBe(opacityBefore)
      expect(element.style.width).toBe(widthBefore)
    })
  })
})
