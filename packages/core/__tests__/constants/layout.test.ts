/**
 * Tests for TachUI Layout Constants
 */

import { describe, it, expect } from 'vitest'
import {
  infinity,
  InfinityValue,
  Dimension,
  SUI,
  isInfinity,
  dimensionToCSS,
  infinityToFlexCSS,
  shouldExpandForInfinity,
} from '../../src/constants/layout'

describe('TachUI Layout Constants', () => {
  describe('infinity constant', () => {
    it('should be a unique symbol', () => {
      expect(typeof infinity).toBe('symbol')
      expect(infinity.toString()).toBe('Symbol(tachui.infinity)')
    })

    it('should be the same symbol when accessed multiple times', () => {
      const infinity1 = infinity
      const infinity2 = infinity
      expect(infinity1).toBe(infinity2)
    })

    it('should be available through SUI compatibility object', () => {
      expect(SUI.infinity).toBe(infinity)
    })
  })

  describe('isInfinity', () => {
    it('should correctly identify infinity symbol', () => {
      expect(isInfinity(infinity)).toBe(true)
      expect(isInfinity(SUI.infinity)).toBe(true)
    })

    it('should return false for non-infinity values', () => {
      expect(isInfinity(100)).toBe(false)
      expect(isInfinity('100%')).toBe(false)
      expect(isInfinity('100px')).toBe(false)
      expect(isInfinity(null)).toBe(false)
      expect(isInfinity(undefined)).toBe(false)
      expect(isInfinity({})).toBe(false)
      expect(isInfinity(Symbol('other'))).toBe(false)
    })
  })

  describe('dimensionToCSS', () => {
    it('should convert infinity to 100%', () => {
      expect(dimensionToCSS(infinity)).toBe('100%')
    })

    it('should convert numbers to px values', () => {
      expect(dimensionToCSS(100)).toBe('100px')
      expect(dimensionToCSS(0)).toBe('0px')
      expect(dimensionToCSS(42.5)).toBe('42.5px')
    })

    it('should pass through string values', () => {
      expect(dimensionToCSS('100%')).toBe('100%')
      expect(dimensionToCSS('50vh')).toBe('50vh')
      expect(dimensionToCSS('auto')).toBe('auto')
      expect(dimensionToCSS('1rem')).toBe('1rem')
    })

    it('should return undefined for undefined input', () => {
      expect(dimensionToCSS(undefined)).toBeUndefined()
    })
  })

  describe('infinityToFlexCSS', () => {
    it('should return proper flex properties for expansion', () => {
      const flexProps = infinityToFlexCSS()
      expect(flexProps).toEqual({
        flexGrow: '1',
        flexShrink: '1',
        flexBasis: '0%',
      })
    })
  })

  describe('shouldExpandForInfinity', () => {
    it('should detect width expansion when width is infinity', () => {
      const result = shouldExpandForInfinity({ width: infinity })
      expect(result.expandWidth).toBe(true)
      expect(result.expandHeight).toBe(false)
      expect(result.cssProps).toEqual({
        flexGrow: '1 !important',
        flexShrink: '1 !important',
        flexBasis: '0% !important',
        alignSelf: 'stretch !important',
      })
    })

    it('should detect height expansion when height is infinity', () => {
      const result = shouldExpandForInfinity({ height: infinity })
      expect(result.expandWidth).toBe(false)
      expect(result.expandHeight).toBe(true)
      expect(result.cssProps).toEqual({
        flexGrow: '1 !important',
        flexShrink: '1 !important',
        flexBasis: '0% !important',
        alignSelf: 'stretch !important',
      })
    })

    it('should detect width expansion when maxWidth is infinity', () => {
      const result = shouldExpandForInfinity({ maxWidth: infinity })
      expect(result.expandWidth).toBe(true)
      expect(result.expandHeight).toBe(false)
      expect(result.cssProps).toEqual({
        flexGrow: '1 !important',
        flexShrink: '1 !important',
        flexBasis: '0% !important',
        alignSelf: 'stretch !important',
      })
    })

    it('should detect height expansion when maxHeight is infinity', () => {
      const result = shouldExpandForInfinity({ maxHeight: infinity })
      expect(result.expandWidth).toBe(false)
      expect(result.expandHeight).toBe(true)
      expect(result.cssProps).toEqual({
        flexGrow: '1 !important',
        flexShrink: '1 !important',
        flexBasis: '0% !important',
        alignSelf: 'stretch !important',
      })
    })

    it('should handle both dimensions being infinity', () => {
      const result = shouldExpandForInfinity({
        width: infinity,
        height: infinity,
      })
      expect(result.expandWidth).toBe(true)
      expect(result.expandHeight).toBe(true)
      expect(result.cssProps).toEqual({
        flexGrow: '1 !important',
        flexShrink: '1 !important',
        flexBasis: '0% !important',
        alignSelf: 'stretch !important',
      })
    })

    it('should not expand for non-infinity values', () => {
      const result = shouldExpandForInfinity({
        width: 100,
        height: '50%',
        maxWidth: 500,
        maxHeight: '80vh',
      })
      expect(result.expandWidth).toBe(false)
      expect(result.expandHeight).toBe(false)
      expect(result.cssProps).toEqual({})
    })

    it('should prioritize infinity constraints over regular values', () => {
      const result = shouldExpandForInfinity({
        width: 100,
        maxWidth: infinity,
        height: 200,
        maxHeight: infinity,
      })
      expect(result.expandWidth).toBe(true)
      expect(result.expandHeight).toBe(true)
      expect(result.cssProps).toEqual({
        flexGrow: '1 !important',
        flexShrink: '1 !important',
        flexBasis: '0% !important',
        alignSelf: 'stretch !important',
      })
    })

    it('should handle empty options', () => {
      const result = shouldExpandForInfinity({})
      expect(result.expandWidth).toBe(false)
      expect(result.expandHeight).toBe(false)
      expect(result.cssProps).toEqual({})
    })
  })

  describe('Type compatibility', () => {
    it('should accept infinity as Dimension type', () => {
      const dimension: Dimension = infinity
      expect(isInfinity(dimension)).toBe(true)
    })

    it('should accept numbers as Dimension type', () => {
      const dimension: Dimension = 100
      expect(typeof dimension).toBe('number')
    })

    it('should accept strings as Dimension type', () => {
      const dimension: Dimension = '100%'
      expect(typeof dimension).toBe('string')
    })
  })

  describe('Symbol identity', () => {
    it('should maintain symbol identity across imports', () => {
      const symbolKey = Symbol.for('tachui.infinity')
      expect(infinity).toBe(symbolKey)
    })

    it('should be serializable for debugging', () => {
      expect(infinity.toString()).toBe('Symbol(tachui.infinity)')
      expect(infinity.description).toBe('tachui.infinity')
    })
  })
})
