/**
 * @tachui/effects - Basic functionality tests
 */

import { describe, it, expect } from 'vitest'
import { blur, scale, glassmorphism, hoverEffect } from '../src'

describe('@tachui/effects', () => {
  describe('Filters', () => {
    it('should create blur filter modifier', () => {
      const modifier = blur(5)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
      expect(modifier.priority).toBe(30)
    })

    it('should create brightness filter modifier', () => {
      const modifier = blur(1.2)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('filter')
    })
  })

  describe('Transforms', () => {
    it('should create scale transform modifier', () => {
      const modifier = scale(1.1)

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('transform')
      expect(modifier.priority).toBe(45)
    })
  })

  describe('Backdrop Effects', () => {
    it('should create glassmorphism effect', () => {
      const modifier = glassmorphism('medium')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('backdropFilter')
    })
  })

  describe('Interactive Effects', () => {
    it('should create hover effect modifier', () => {
      const modifier = hoverEffect('lift')

      expect(modifier).toBeDefined()
      expect(modifier.type).toBe('hover')
      expect(modifier.priority).toBe(15)
    })
  })
})
