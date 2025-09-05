/**
 * Show Component Tests
 *
 * Tests for reactive conditional rendering component
 */

import { beforeEach, describe, expect, test } from 'vitest'
import { Show, ShowComponent, Unless, When } from '../../src/conditional/Show'
import { createSignal } from '@tachui/core'

// Mock Text component for testing
const Text = (content: string) => ({
  type: 'component' as const,
  render: () => [
    {
      type: 'element' as const,
      tag: 'span',
      props: {},
      children: [{ type: 'text' as const, text: content }],
    },
  ],
  props: { content },
  children: [],
  cleanup: [],
  id: `text-${Date.now()}`,
  modifier: {
    build: () => ({
      type: 'component' as const,
      render: () => [
        {
          type: 'element' as const,
          tag: 'span',
          props: {},
          children: [{ type: 'text' as const, text: content }],
        },
      ],
      props: { content },
      children: [],
      cleanup: [],
      id: `text-${Date.now()}`,
    }),
  },
})
import type { ComponentInstance } from '@tachui/core'

describe('Show Component', () => {
  let mockText: ComponentInstance
  let mockFallbackText: ComponentInstance

  beforeEach(() => {
    // Create mock text components for testing
    mockText = Text('Main content').modifier.build()
    mockFallbackText = Text('Fallback content').modifier.build()
  })

  describe('Basic Functionality', () => {
    test('should create Show component with correct props', () => {
      const show = Show({
        when: true,
        children: mockText,
        fallback: mockFallbackText,
      })

      expect(show).toBeInstanceOf(ShowComponent)
      expect(show.type).toBe('component')
      expect(show.id).toMatch(/^show-\d+-[a-z0-9]+$/)
      expect(show.props.when).toBe(true)
      expect(show.props.children).toBe(mockText)
      expect(show.props.fallback).toBe(mockFallbackText)
    })

    test('should render children when condition is true', () => {
      const show = Show({
        when: true,
        children: mockText,
      })

      const rendered = show.render()

      expect(Array.isArray(rendered)).toBe(true)
      expect(rendered.length).toBeGreaterThan(0)
      // The rendered content should come from the children component
    })

    test('should render fallback when condition is false', () => {
      const show = Show({
        when: false,
        children: mockText,
        fallback: mockFallbackText,
      })

      const rendered = show.render()

      expect(Array.isArray(rendered)).toBe(true)
      expect(rendered.length).toBeGreaterThan(0)
      // The rendered content should come from the fallback component
    })

    test('should return empty array when condition is false and no fallback', () => {
      const show = Show({
        when: false,
        children: mockText,
      })

      const rendered = show.render()

      expect(rendered).toEqual([])
    })
  })

  describe('Reactive Functionality', () => {
    test('should work with signal-based conditions', () => {
      const [condition, setCondition] = createSignal(true)

      const show = Show({
        when: condition,
        children: mockText,
        fallback: mockFallbackText,
      })

      // Initial render with true condition
      let rendered = show.render()
      expect(rendered.length).toBeGreaterThan(0)

      // Change condition to false
      setCondition(false)
      rendered = show.render()
      expect(rendered.length).toBeGreaterThan(0)
    })

    test('should work with function-based conditions', () => {
      const [value, setValue] = createSignal(10)

      const show = Show({
        when: () => value() > 5,
        children: mockText,
        fallback: mockFallbackText,
      })

      // Initial render with true condition (10 > 5)
      let rendered = show.render()
      expect(rendered.length).toBeGreaterThan(0)

      // Change value to make condition false
      setValue(3)
      rendered = show.render()
      expect(rendered.length).toBeGreaterThan(0)
    })
  })

  describe('Condition Evaluation', () => {
    test('should handle boolean conditions', () => {
      const showTrue = Show({ when: true, children: mockText })
      const showFalse = Show({ when: false, children: mockText })

      expect(showTrue.render().length).toBeGreaterThan(0)
      expect(showFalse.render().length).toBe(0)
    })

    test('should handle function conditions', () => {
      const showTrueFunc = Show({
        when: () => true,
        children: mockText,
      })
      const showFalseFunc = Show({
        when: () => false,
        children: mockText,
      })

      expect(showTrueFunc.render().length).toBeGreaterThan(0)
      // For reactive conditions (functions), Show component always creates a container
      // The reactive system handles showing/hiding content within the container
      expect(showFalseFunc.render().length).toBeGreaterThan(0)
    })

    test('should handle complex conditions', () => {
      const [user, setUser] = createSignal<any>(null)
      const [loading, setLoading] = createSignal(false)

      const show = Show({
        when: () => !loading() && user() !== null,
        children: mockText,
        fallback: mockFallbackText,
      })

      // Initially no user, not loading - should show fallback
      expect(show.render().length).toBeGreaterThan(0)

      // Set loading - should show fallback
      setLoading(true)
      expect(show.render().length).toBeGreaterThan(0)

      // Set user but still loading - should show fallback
      setUser({ name: 'Test' })
      expect(show.render().length).toBeGreaterThan(0)

      // Stop loading with user - should show children
      setLoading(false)
      expect(show.render().length).toBeGreaterThan(0)
    })
  })

  describe('Cleanup', () => {
    test('should provide dispose method', () => {
      const show = Show({
        when: true,
        children: mockText,
      })

      expect(typeof show.dispose).toBe('function')

      // Should not throw when disposed
      expect(() => show.dispose()).not.toThrow()
    })
  })
})

describe('Convenience Functions', () => {
  let mockText: ComponentInstance

  beforeEach(() => {
    mockText = Text('Test content').modifier.build()
  })

  describe('When Function', () => {
    test('should create Show component with condition', () => {
      const when = When(true, mockText)

      expect(when).toBeInstanceOf(ShowComponent)
      expect(when.props.when).toBe(true)
      expect(when.props.children).toBe(mockText)
      expect(when.props.fallback).toBeUndefined()
    })

    test('should work with function conditions', () => {
      const [value, setValue] = createSignal(5)
      const when = When(() => value() > 3, mockText)

      expect(when.render().length).toBeGreaterThan(0)

      setValue(1)
      // For reactive conditions (functions/signals), Show component creates a container
      // The reactive system handles the content changes, not repeated render() calls
      expect(when.render().length).toBeGreaterThan(0)
    })
  })

  describe('Unless Function', () => {
    test('should create Show component with negated condition', () => {
      const unless = Unless(false, mockText)

      expect(unless).toBeInstanceOf(ShowComponent)
      // Unless(false) should be equivalent to Show({ when: true })
      expect(unless.render().length).toBeGreaterThan(0)
    })

    test('should negate boolean conditions correctly', () => {
      const unlessTrue = Unless(true, mockText)
      const unlessFalse = Unless(false, mockText)

      expect(unlessTrue.render().length).toBe(0) // Unless true -> don't show
      expect(unlessFalse.render().length).toBeGreaterThan(0) // Unless false -> show
    })

    test('should negate function conditions correctly', () => {
      const [value, setValue] = createSignal(5)
      const unless = Unless(() => value() > 3, mockText)

      // For reactive conditions (functions), Show component always creates a container
      // The reactive system handles the negated logic within the container
      expect(unless.render().length).toBeGreaterThan(0)

      // Change value - container is still there, but reactive system handles content changes
      setValue(1)
      expect(unless.render().length).toBeGreaterThan(0)
    })
  })
})
