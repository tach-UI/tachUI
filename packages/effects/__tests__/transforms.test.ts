/**
 * Transform Effects Tests
 */

import { describe, it, expect } from 'vitest'
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
  offset,
} from '../src/transforms'

describe('Transform Effects', () => {
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
})
