/**
 * SwiftUI Compatibility Functions Tests
 * 
 * Tests for the new SwiftUI-style API wrapper functions that enhance
 * compatibility between SwiftUI and TachUI modifier systems.
 */

import { describe, test, expect } from 'vitest'
import { scaleEffect, offset, colorInvert, saturation, hueRotation } from '../../src/modifiers'

describe('SwiftUI Compatibility Functions', () => {
  describe('scaleEffect', () => {
    test('applies uniform scale', () => {
      const modifier = scaleEffect(1.5)
      expect(modifier.type).toBe('advancedTransform')
      expect(modifier.properties.transform).toEqual({
        scaleX: 1.5,
        scaleY: 1.5
      })
      expect(modifier.properties.transformOrigin).toBe('center center')
    })

    test('applies non-uniform scale', () => {
      const modifier = scaleEffect(1.5, 2.0)
      expect(modifier.properties.transform).toEqual({
        scaleX: 1.5,
        scaleY: 2.0
      })
    })

    test('sets transform origin correctly', () => {
      const modifier = scaleEffect(1.5, undefined, 'topLeading')
      expect(modifier.properties.transformOrigin).toBe('left top')
    })

    test('handles all anchor points', () => {
      const anchorTests = [
        { anchor: 'center' as const, expected: 'center center' },
        { anchor: 'top' as const, expected: 'center top' },
        { anchor: 'bottom' as const, expected: 'center bottom' },
        { anchor: 'leading' as const, expected: 'left center' },
        { anchor: 'trailing' as const, expected: 'right center' },
        { anchor: 'topLeading' as const, expected: 'left top' },
        { anchor: 'topTrailing' as const, expected: 'right top' },
        { anchor: 'bottomLeading' as const, expected: 'left bottom' },
        { anchor: 'bottomTrailing' as const, expected: 'right bottom' }
      ]

      anchorTests.forEach(({ anchor, expected }) => {
        const modifier = scaleEffect(1.0, undefined, anchor)
        expect(modifier.properties.transformOrigin).toBe(expected)
      })
    })
  })

  describe('offset', () => {
    test('applies relative positioning via transform', () => {
      const modifier = offset(100, 50)
      expect(modifier.type).toBe('advancedTransform')
      expect(modifier.properties.transform).toEqual({
        translateX: 100,
        translateY: 50
      })
    })

    test('handles negative coordinates', () => {
      const modifier = offset(-20, -10)
      expect(modifier.properties.transform).toEqual({
        translateX: -20,
        translateY: -10
      })
    })
  })

  describe('colorInvert', () => {
    test('creates full inversion filter', () => {
      const modifier = colorInvert()
      expect(modifier.type).toBe('filter')
      expect(modifier.properties.filter).toEqual({
        invert: 1
      })
    })
  })

  describe('saturation', () => {
    test('aliases to saturate function', () => {
      const modifier = saturation(1.5)
      expect(modifier.type).toBe('filter')
      expect(modifier.properties.filter).toEqual({
        saturate: 1.5
      })
    })

    test('handles zero saturation (grayscale)', () => {
      const modifier = saturation(0)
      expect(modifier.properties.filter).toEqual({
        saturate: 0
      })
    })
  })

  describe('hueRotation', () => {
    test('aliases to hueRotate function', () => {
      const modifier = hueRotation('90deg')
      expect(modifier.type).toBe('filter')
      expect(modifier.properties.filter).toEqual({
        hueRotate: '90deg'
      })
    })

    test('handles different angle units', () => {
      const modifier = hueRotation('0.25turn')
      expect(modifier.properties.filter).toEqual({
        hueRotate: '0.25turn'
      })
    })
  })

  describe('SwiftUI API Compatibility', () => {
    test('scaleEffect matches SwiftUI behavior', () => {
      // SwiftUI: .scaleEffect(1.5, anchor: .topLeading)
      const modifier = scaleEffect(1.5, undefined, 'topLeading')
      
      expect(modifier.properties.transform).toEqual({
        scaleX: 1.5,
        scaleY: 1.5
      })
      expect(modifier.properties.transformOrigin).toBe('left top')
    })

    test('offset matches SwiftUI relative positioning', () => {
      // SwiftUI: .offset(x: 100, y: 50) 
      const modifier = offset(100, 50)
      
      expect(modifier.properties.transform).toEqual({
        translateX: 100,
        translateY: 50
      })
    })

    test('filter functions match SwiftUI naming', () => {
      // SwiftUI: .colorInvert()
      const invertModifier = colorInvert()
      expect(invertModifier.properties.filter).toEqual({ invert: 1 })

      // SwiftUI: .saturation(0.5)  
      const satModifier = saturation(0.5)
      expect(satModifier.properties.filter).toEqual({ saturate: 0.5 })

      // SwiftUI: .hueRotation(Angle(degrees: 90))
      const hueModifier = hueRotation('90deg')
      expect(hueModifier.properties.filter).toEqual({ hueRotate: '90deg' })
    })
  })
})