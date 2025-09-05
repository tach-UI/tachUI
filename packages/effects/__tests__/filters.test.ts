/**
 * Filter Effects Tests
 */

import { describe, it, expect } from 'vitest'
import {
  FilterModifier,
  filter,
  blur,
  brightness,
  contrast,
  saturate,
  grayscale,
  sepia,
  vintagePhoto,
  blackAndWhite,
  vibrant,
} from '../src/filters'

describe('Filter Effects', () => {
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
})
