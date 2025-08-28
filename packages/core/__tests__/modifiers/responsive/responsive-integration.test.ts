/**
 * Responsive System Integration Tests
 * 
 * Tests integration of responsive system with the main modifier builder.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createModifierBuilder } from '../../../src/modifiers/builder'
import { configureBreakpoints, initializeResponsiveSystem } from '../../../src/modifiers/responsive'

// Mock component instance
const mockComponent = {
  type: 'div',
  props: {},
  children: [],
  key: 'test-component'
}

// Mock window and DOM APIs
const mockWindow = {
  innerWidth: 1024,
  innerHeight: 768,
  matchMedia: vi.fn(() => ({
    matches: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn()
}

Object.defineProperty(global, 'window', {
  writable: true,
  value: mockWindow
})

describe('Responsive System Integration', () => {
  beforeEach(() => {
    // Reset window mock
    mockWindow.innerWidth = 1024
    mockWindow.innerHeight = 768
    
    // Initialize responsive system
    initializeResponsiveSystem()
  })

  it('should integrate responsive methods with modifier builder', () => {
    const builder = createModifierBuilder(mockComponent)
    
    // Check that responsive method exists
    expect(builder.responsive).toBeDefined()
    expect(typeof builder.responsive).toBe('function')
    
    // Check that addModifier method exists
    expect(builder.addModifier).toBeDefined()
    expect(typeof builder.addModifier).toBe('function')
  })

  it('should create responsive modifier builder from base builder', () => {
    const builder = createModifierBuilder(mockComponent)
    const responsiveBuilder = builder.responsive()
    
    // Check responsive methods exist
    expect(responsiveBuilder.responsive).toBeDefined()
    expect(responsiveBuilder.responsiveWidth).toBeDefined()
    expect(responsiveBuilder.responsiveHeight).toBeDefined()
    expect(responsiveBuilder.responsivePadding).toBeDefined()
    expect(responsiveBuilder.responsiveMargin).toBeDefined()
    expect(responsiveBuilder.responsiveFont).toBeDefined()
    
    // Check breakpoint shorthand methods exist
    expect(responsiveBuilder.sm).toBeDefined()
    expect(responsiveBuilder.md).toBeDefined()
    expect(responsiveBuilder.lg).toBeDefined()
    expect(responsiveBuilder.xl).toBeDefined()
    expect(responsiveBuilder['2xl']).toBeDefined()
  })

  it('should allow chaining responsive modifiers', () => {
    const builder = createModifierBuilder(mockComponent)
    
    // Test responsive modifier chaining
    const chainedBuilder = builder
      .responsive()
      .responsiveWidth({ base: 100, md: 200, lg: 300 })
      .responsiveHeight({ base: 50, lg: 100 })
      .responsivePadding({ base: 8, sm: 12, md: 16 })
    
    expect(chainedBuilder).toBeDefined()
    expect(chainedBuilder.build).toBeDefined()
  })

  it('should allow shorthand breakpoint syntax', () => {
    const builder = createModifierBuilder(mockComponent)
    
    // Test breakpoint shorthand chaining
    const chainedBuilder = builder
      .responsive()
      .sm.width(200)
      .md.width(400)
      .lg.width(600)
      .sm.padding(12)
      .md.padding(16)
    
    expect(chainedBuilder).toBeDefined()
    expect(chainedBuilder.build).toBeDefined()
  })

  it('should integrate with existing modifier chains', () => {
    const builder = createModifierBuilder(mockComponent)
    
    // Test mixing responsive and regular modifiers
    const chainedBuilder = builder
      .padding(8)
      .css({ color: 'blue' })
      .responsive()
      .responsiveWidth({ base: 100, md: 200 })
      .sm.fontSize('16px')
      .md.fontSize('18px')
    
    expect(chainedBuilder).toBeDefined()
    expect(chainedBuilder.build).toBeDefined()
  })

  it('should maintain builder pattern throughout responsive chain', () => {
    const builder = createModifierBuilder(mockComponent)
    
    // Each step should return a builder
    const step1 = builder.responsive()
    expect(step1.responsive).toBeDefined()
    
    const step2 = step1.responsiveWidth({ base: 100, md: 200 })
    expect(step2.responsive).toBeDefined()
    
    const step3 = step2.sm.width(150)
    expect(step3.responsive).toBeDefined()
    
    const step4 = step3.md.padding(20)
    expect(step4.responsive).toBeDefined()
    
    // Should be able to build at the end
    const finalComponent = step4.build()
    expect(finalComponent).toBeDefined()
  })

  it('should handle multiple responsive configurations', () => {
    const builder = createModifierBuilder(mockComponent)
    
    // Test complex responsive configuration
    const responsiveBuilder = builder
      .responsive()
      .responsive({
        fontSize: { base: 14, sm: 16, md: 18, lg: 20 },
        padding: { base: 8, md: 16 },
        margin: { base: 0, lg: 'auto' },
        display: { base: 'block', md: 'flex' },
        flexDirection: { md: 'row', lg: 'column' }
      })
      .responsiveLayout({
        direction: { base: 'column', md: 'row' },
        justify: { base: 'flex-start', md: 'center' },
        align: { base: 'stretch', md: 'center' },
        gap: { base: 8, md: 16, lg: 24 }
      })
    
    expect(responsiveBuilder).toBeDefined()
    
    const finalComponent = responsiveBuilder.build()
    expect(finalComponent).toBeDefined()
  })
})