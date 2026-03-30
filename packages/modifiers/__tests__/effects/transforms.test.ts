/**
 * Transform Effects Tests
 */

import { describe, it, expect } from 'vitest'
import { createSignal, flushSync } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import {
  TransformModifier,
  AdvancedTransformModifier,
  transform,
  scale,
  rotate,
  translate,
  skew,
  rotateX,
  rotateY,
  rotateZ,
  perspective,
  matrix3d,
  translateZ,
  offset,
} from '../../src/effects/transforms'

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

describe('Transform Effects', () => {
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

  describe('TransformModifier', () => {
    it('should create transform modifier', () => {
      const modifier = new TransformModifier({
        transform: { scale: 1.1, rotate: '45deg' },
      })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
      expect(modifier.priority).toBe(45)
    })
  })

  describe('Basic Transform Functions', () => {
    it('should create scale transform', () => {
      const modifier = scale(1.2)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })

    it('should create rotate transform', () => {
      const modifier = rotate('45deg')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })

    it('should create translate transform', () => {
      const modifier = translate({ x: 10, y: 20 })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })

    it('should create skew transform', () => {
      const modifier = skew({ x: '10deg', y: '5deg' })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })
  })

  describe('3D Transform Functions', () => {
    it('should create rotateX transform', () => {
      const modifier = rotateX('45deg')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })

    it('should create rotateY transform', () => {
      const modifier = rotateY('90deg')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })

    it('should create rotateZ transform', () => {
      const modifier = rotateZ('180deg')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })

    it('should create perspective transform', () => {
      const modifier = perspective(1000)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })
  })

  describe('Advanced Transform Functions', () => {
    it('should create matrix3d transform', () => {
      const modifier = matrix3d([
        1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 50, 100, 0, 1,
      ])

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('advancedTransform')
    })
  })

  describe('SwiftUI Compatibility Functions', () => {
    it('should create offset transform', () => {
      const modifier = offset(10, 20)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('advancedTransform')
    })
  })

  describe('General Transform Function', () => {
    it('should create transform with config', () => {
      const modifier = transform({ scale: 1.1, rotate: '30deg' })

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
    })
  })

  describe('Reactive Support', () => {
    it('updates rotate() transform from signal values', () => {
      const [angle, setAngle] = createSignal(15)
      const modifier = rotate(angle as unknown as any)
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.transform).toContain('rotate(15deg)')
      setAngle(75)
      flushSync()
      expect(element.style.transform).toContain('rotate(75deg)')
    })

    it('updates skew(x,y) transform from signal values', () => {
      const [x, setX] = createSignal(10)
      const [y, setY] = createSignal(20)
      const modifier = skew({
        x: x as unknown as any,
        y: y as unknown as any,
      })
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.transform).toContain('skew(10deg, 20deg)')
      setX(25)
      setY(5)
      flushSync()
      expect(element.style.transform).toContain('skew(25deg, 5deg)')
    })

    it('supports skewX and skewY paths from reactive skew config', () => {
      const [x, setX] = createSignal(12)
      const xOnly = skew({ x: x as unknown as any })
      const xCtx = createContext()
      xOnly.apply({} as DOMNode, xCtx.context)
      expect(xCtx.element.style.transform).toContain('skewX(12deg)')
      setX(30)
      flushSync()
      expect(xCtx.element.style.transform).toContain('skewX(30deg)')

      const [y, setY] = createSignal(8)
      const yOnly = skew({ y: y as unknown as any })
      const yCtx = createContext()
      yOnly.apply({} as DOMNode, yCtx.context)
      expect(yCtx.element.style.transform).toContain('skewY(8deg)')
      setY(18)
      flushSync()
      expect(yCtx.element.style.transform).toContain('skewY(18deg)')
    })

    it('composes multiple reactive transforms without clobbering siblings', () => {
      const [angle, setAngle] = createSignal(10)
      const [skewX, setSkewX] = createSignal(5)

      const modifier = transform({
        rotate: angle as unknown as any,
        skew: { x: skewX as unknown as any },
      })
      const { element, context } = createContext()
      modifier.apply({} as DOMNode, context)

      expect(element.style.transform).toContain('rotate(10deg)')
      expect(element.style.transform).toContain('skewX(5deg)')

      setAngle(45)
      flushSync()
      expect(element.style.transform).toContain('rotate(45deg)')
      expect(element.style.transform).toContain('skewX(5deg)')

      setSkewX(15)
      flushSync()
      expect(element.style.transform).toContain('rotate(45deg)')
      expect(element.style.transform).toContain('skewX(15deg)')
    })

    it('composes chained transform modifiers instead of overwriting', () => {
      const { element, context } = createContext()

      perspective(800).apply({} as DOMNode, context)
      rotateY('-22deg').apply({} as DOMNode, context)
      rotateX('14deg').apply({} as DOMNode, context)
      translateZ('8px').apply({} as DOMNode, context)

      expect(element.style.transform).toContain('perspective(800px)')
      expect(element.style.transform).toContain('rotateY(-22deg)')
      expect(element.style.transform).toContain('rotateX(14deg)')
      expect(element.style.transform).toContain('translateZ(8px)')
    })

    it('updates one chained transform without duplicating or dropping siblings', () => {
      const [xAngle, setXAngle] = createSignal(14)
      const { element, context } = createContext()

      perspective(800).apply({} as DOMNode, context)
      rotateY('-22deg').apply({} as DOMNode, context)
      rotateX(xAngle as unknown as any).apply({} as DOMNode, context)
      translateZ('8px').apply({} as DOMNode, context)

      expect(element.style.transform).toContain('rotateX(14deg)')
      expect(element.style.transform.match(/rotateX\(/g)?.length ?? 0).toBe(1)

      setXAngle(30)
      flushSync()

      expect(element.style.transform).toContain('perspective(800px)')
      expect(element.style.transform).toContain('rotateY(-22deg)')
      expect(element.style.transform).toContain('rotateX(30deg)')
      expect(element.style.transform).toContain('translateZ(8px)')
      expect(element.style.transform.match(/rotateX\(/g)?.length ?? 0).toBe(1)
    })
  })
})
