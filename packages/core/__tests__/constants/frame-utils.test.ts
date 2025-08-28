/**
 * Tests for TachUI Frame Utilities
 */

import { describe, it, expect } from 'vitest'
import {
  fillMaxWidth,
  fillMaxHeight,
  fillMaxSize,
  expand,
  fixedWidthExpandHeight,
  fixedHeightExpandWidth,
  constrainedExpand,
  responsive,
  flexible,
  fullScreen,
  remainingSpace,
  equalShare,
} from '../../src/constants/frame-utils'
import { infinity } from '../../src/constants/layout'
import type { LayoutModifierProps } from '../../src/modifiers/types'

describe('Frame Utilities', () => {
  describe('fillMaxWidth', () => {
    it('should create frame with infinity maxWidth', () => {
      const modifier = fillMaxWidth()
      expect(modifier.type).toBe('layout')
      expect((modifier.properties as any).frame.maxWidth).toBe(infinity)
    })

    it('should not affect other dimensions', () => {
      const modifier = fillMaxWidth()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBeUndefined()
      expect(frame.height).toBeUndefined()
      expect(frame.maxHeight).toBeUndefined()
    })
  })

  describe('fillMaxHeight', () => {
    it('should create frame with infinity maxHeight', () => {
      const modifier = fillMaxHeight()
      expect(modifier.type).toBe('layout')
      expect((modifier.properties as any).frame.maxHeight).toBe(infinity)
    })

    it('should not affect other dimensions', () => {
      const modifier = fillMaxHeight()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBeUndefined()
      expect(frame.height).toBeUndefined()
      expect(frame.maxWidth).toBeUndefined()
    })
  })

  describe('fillMaxSize', () => {
    it('should create frame with both infinity maxWidth and maxHeight', () => {
      const modifier = fillMaxSize()
      expect(modifier.type).toBe('layout')
      const frame = (modifier.properties as any).frame
      expect(frame.maxWidth).toBe(infinity)
      expect(frame.maxHeight).toBe(infinity)
    })

    it('should not affect width and height directly', () => {
      const modifier = fillMaxSize()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBeUndefined()
      expect(frame.height).toBeUndefined()
    })
  })

  describe('expand', () => {
    it('should create frame with infinity width and height', () => {
      const modifier = expand()
      expect(modifier.type).toBe('layout')
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(infinity)
      expect(frame.height).toBe(infinity)
    })
  })

  describe('fixedWidthExpandHeight', () => {
    it('should create frame with fixed width and infinity maxHeight', () => {
      const modifier = fixedWidthExpandHeight(250)
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(250)
      expect(frame.maxHeight).toBe(infinity)
    })

    it('should work with string width values', () => {
      const modifier = fixedWidthExpandHeight('20%')
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe('20%')
      expect(frame.maxHeight).toBe(infinity)
    })
  })

  describe('fixedHeightExpandWidth', () => {
    it('should create frame with fixed height and infinity maxWidth', () => {
      const modifier = fixedHeightExpandWidth(60)
      const frame = (modifier.properties as any).frame
      expect(frame.height).toBe(60)
      expect(frame.maxWidth).toBe(infinity)
    })

    it('should work with string height values', () => {
      const modifier = fixedHeightExpandWidth('10vh')
      const frame = (modifier.properties as any).frame
      expect(frame.height).toBe('10vh')
      expect(frame.maxWidth).toBe(infinity)
    })
  })

  describe('constrainedExpand', () => {
    it('should create frame with infinity dimensions and constraints', () => {
      const modifier = constrainedExpand(800, 600)
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(infinity)
      expect(frame.height).toBe(infinity)
      expect(frame.maxWidth).toBe(800)
      expect(frame.maxHeight).toBe(600)
    })

    it('should handle undefined constraints', () => {
      const modifier = constrainedExpand()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(infinity)
      expect(frame.height).toBe(infinity)
      expect(frame.maxWidth).toBeUndefined()
      expect(frame.maxHeight).toBeUndefined()
    })

    it('should handle partial constraints', () => {
      const modifier = constrainedExpand(800)
      const frame = (modifier.properties as any).frame
      expect(frame.maxWidth).toBe(800)
      expect(frame.maxHeight).toBeUndefined()
    })
  })

  describe('responsive', () => {
    it('should create frame with all constraint options', () => {
      const modifier = responsive(320, 800, 200, 600)
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(infinity)
      expect(frame.height).toBe(infinity)
      expect(frame.minWidth).toBe(320)
      expect(frame.maxWidth).toBe(800)
      expect(frame.minHeight).toBe(200)
      expect(frame.maxHeight).toBe(600)
    })

    it('should handle partial constraints', () => {
      const modifier = responsive(320, 800)
      const frame = (modifier.properties as any).frame
      expect(frame.minWidth).toBe(320)
      expect(frame.maxWidth).toBe(800)
      expect(frame.minHeight).toBeUndefined()
      expect(frame.maxHeight).toBeUndefined()
    })

    it('should work with string values', () => {
      const modifier = responsive('20%', '80%', '100px', '500px')
      const frame = (modifier.properties as any).frame
      expect(frame.minWidth).toBe('20%')
      expect(frame.maxWidth).toBe('80%')
      expect(frame.minHeight).toBe('100px')
      expect(frame.maxHeight).toBe('500px')
    })
  })

  describe('flexible', () => {
    it('should create frame with infinity maxWidth and maxHeight', () => {
      const modifier = flexible()
      const frame = (modifier.properties as any).frame
      expect(frame.maxWidth).toBe(infinity)
      expect(frame.maxHeight).toBe(infinity)
      expect(frame.width).toBeUndefined()
      expect(frame.height).toBeUndefined()
    })
  })

  describe('fullScreen', () => {
    it('should create frame with viewport dimensions', () => {
      const modifier = fullScreen()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe('100vw')
      expect(frame.height).toBe('100vh')
    })
  })

  describe('remainingSpace', () => {
    it('should create frame with infinity width and height', () => {
      const modifier = remainingSpace()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(infinity)
      expect(frame.height).toBe(infinity)
    })
  })

  describe('equalShare', () => {
    it('should create frame with infinity width for equal distribution', () => {
      const modifier = equalShare()
      const frame = (modifier.properties as any).frame
      expect(frame.width).toBe(infinity)
      expect(frame.height).toBeUndefined()
    })
  })

  describe('Type safety', () => {
    it('should create valid LayoutModifier instances', () => {
      const modifiers = [
        fillMaxWidth(),
        fillMaxHeight(),
        fillMaxSize(),
        expand(),
        flexible(),
      ]

      modifiers.forEach(modifier => {
        expect(modifier.type).toBe('layout')
        expect(modifier.priority).toBeGreaterThan(0)
        expect(modifier.properties).toBeDefined()
        expect((modifier.properties as any).frame).toBeDefined()
      })
    })

    it('should preserve frame structure', () => {
      const modifier = responsive(320, 800, 200, 600)
      const frame = (modifier.properties as LayoutModifierProps).frame

      expect(frame).toBeDefined()
      expect(typeof frame).toBe('object')
      expect(frame?.width).toBe(infinity)
      expect(frame?.height).toBe(infinity)
    })
  })

  describe('Common use cases', () => {
    it('should support button layouts', () => {
      const buttonModifier = fillMaxWidth()
      const frame = (buttonModifier.properties as any).frame
      expect(frame.maxWidth).toBe(infinity)
    })

    it('should support sidebar layouts', () => {
      const sidebarModifier = fixedWidthExpandHeight(250)
      const frame = (sidebarModifier.properties as any).frame
      expect(frame.width).toBe(250)
      expect(frame.maxHeight).toBe(infinity)
    })

    it('should support header layouts', () => {
      const headerModifier = fixedHeightExpandWidth(60)
      const frame = (headerModifier.properties as any).frame
      expect(frame.height).toBe(60)
      expect(frame.maxWidth).toBe(infinity)
    })

    it('should support card layouts', () => {
      const cardModifier = responsive(320, 800, 200)
      const frame = (cardModifier.properties as any).frame
      expect(frame.minWidth).toBe(320)
      expect(frame.maxWidth).toBe(800)
      expect(frame.minHeight).toBe(200)
    })

    it('should support modal layouts', () => {
      const modalModifier = fullScreen()
      const frame = (modalModifier.properties as any).frame
      expect(frame.width).toBe('100vw')
      expect(frame.height).toBe('100vh')
    })
  })
})
