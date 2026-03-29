/**
 * Filter Effects Tests
 */

import { describe, it, expect } from 'vitest'
import { createSignal, flushSync } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import {
  FilterModifier,
  filter,
  blur,
  brightness,
  contrast,
  saturate,
  grayscale,
  sepia,
  hueRotate,
  invert,
  vintagePhoto,
  blackAndWhite,
  vibrant,
} from '../../src/effects/filters'

class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }

  constructor() {
    this.style = new Proxy({} as any, {
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
      get: (target, prop) => {
        if (prop === 'setProperty') {
          return (property: string, value: string) => {
            target[property] = value
          }
        }
        return target[prop] || ''
      },
    })
  }
}

describe('Filter Effects', () => {
  const createContext = (): {
    element: MockElement
    context: ModifierContext
  } => {
    const element = new MockElement()
    return {
      element,
      context: { element: element as unknown as HTMLElement },
    }
  }

  describe('FilterModifier', () => {
    it('should create filter modifier with config object', () => {
      const modifier = new FilterModifier({
        filter: { blur: 5, brightness: 1.2 },
      })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
      expect(modifier.priority).toBe(30)
    })

    it('should create filter modifier with CSS string', () => {
      const modifier = new FilterModifier({
        filter: 'blur(5px) brightness(1.2)',
      })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })
  })

  describe('Filter Functions', () => {
    it('should create blur filter', () => {
      const modifier = blur(5)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create brightness filter', () => {
      const modifier = brightness(1.2)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create contrast filter', () => {
      const modifier = contrast(1.5)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create saturate filter', () => {
      const modifier = saturate(1.3)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create grayscale filter', () => {
      const modifier = grayscale(0.8)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create sepia filter', () => {
      const modifier = sepia(0.6)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })
  })

  describe('Filter Combinations', () => {
    it('should create vintage photo effect', () => {
      const modifier = vintagePhoto()

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create black and white effect', () => {
      const modifier = blackAndWhite()

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create vibrant effect', () => {
      const modifier = vibrant()

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })
  })

  describe('General Filter Function', () => {
    it('should create filter with config object', () => {
      const modifier = filter({ blur: 3, brightness: 1.1 })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })

    it('should create filter with CSS string', () => {
      const modifier = filter('blur(3px) brightness(1.1)')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })
  })

  describe('Reactive Support', () => {
    it('updates blur() from signal values', () => {
      const [value, setValue] = createSignal(2)
      const modifier = blur(value as unknown as any)
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.filter).toContain('blur(2px)')
      setValue(9)
      flushSync()
      expect(element.style.filter).toContain('blur(9px)')
    })

    it('updates brightness, contrast, and saturate from signal values', () => {
      const [bright, setBright] = createSignal(1)
      const [cont, setCont] = createSignal(1.2)
      const [sat, setSat] = createSignal(1.5)
      const modifier = filter({
        blur: 1,
        brightness: bright as unknown as any,
        contrast: cont as unknown as any,
        saturate: sat as unknown as any,
      })
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.filter).toContain('brightness(1)')
      expect(element.style.filter).toContain('contrast(1.2)')
      expect(element.style.filter).toContain('saturate(1.5)')

      setBright(1.3)
      setCont(0.8)
      setSat(2)
      flushSync()

      expect(element.style.filter).toContain('brightness(1.3)')
      expect(element.style.filter).toContain('contrast(0.8)')
      expect(element.style.filter).toContain('saturate(2)')
      expect(element.style.filter).toContain('blur(1px)')
    })

    it('supports boolean and numeric signals for grayscale/sepia/invert', () => {
      const [gray, setGray] = createSignal<boolean | number>(true)
      const [sep, setSep] = createSignal<boolean | number>(0.2)
      const [inv, setInv] = createSignal<boolean | number>(false)
      const modifier = filter({
        grayscale: gray as unknown as any,
        sepia: sep as unknown as any,
        invert: inv as unknown as any,
      })
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.filter).toContain('grayscale(1)')
      expect(element.style.filter).toContain('sepia(0.2)')
      expect(element.style.filter).toContain('invert(0)')

      setGray(0.5)
      setSep(true)
      setInv(0.75)
      flushSync()
      expect(element.style.filter).toContain('grayscale(0.5)')
      expect(element.style.filter).toContain('sepia(1)')
      expect(element.style.filter).toContain('invert(0.75)')
    })

    it('updates hueRotate() from numeric signal values', () => {
      const [angle, setAngle] = createSignal(90)
      const modifier = hueRotate(angle as unknown as any)
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.filter).toContain('hue-rotate(90deg)')
      setAngle(210)
      flushSync()
      expect(element.style.filter).toContain('hue-rotate(210deg)')
    })

    it('composed filters keep sibling filters intact across updates', () => {
      const [blurValue, setBlurValue] = createSignal(3)
      const [invertValue, setInvertValue] = createSignal(0.2)
      const modifier = filter({
        blur: blurValue as unknown as any,
        invert: invertValue as unknown as any,
      })
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.filter).toContain('blur(3px)')
      expect(element.style.filter).toContain('invert(0.2)')

      setBlurValue(8)
      flushSync()
      expect(element.style.filter).toContain('blur(8px)')
      expect(element.style.filter).toContain('invert(0.2)')

      setInvertValue(1)
      flushSync()
      expect(element.style.filter).toContain('blur(8px)')
      expect(element.style.filter).toContain('invert(1)')
    })
  })
})
