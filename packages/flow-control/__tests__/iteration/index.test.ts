/**
 * Iteration Components Index Tests
 *
 * Tests that iteration components are properly exported
 */

import { describe, test, expect } from 'vitest'
import * as IterationExports from '../../src/iteration'
import { ForEach, ForEachComponent, For } from '../../src/iteration'

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

describe('Iteration Components Exports', () => {
  test('should export ForEach function', () => {
    expect(typeof ForEach).toBe('function')
    expect(ForEach.name).toBe('ForEach')
  })

  test('should export ForEachComponent class', () => {
    expect(typeof ForEachComponent).toBe('function')
    expect(ForEachComponent.name).toBe('ForEachComponent')
  })

  test('should export For function', () => {
    expect(typeof For).toBe('function')
    expect(For.name).toBe('For')
  })

  test('should export all expected functions from iteration module', () => {
    expect(IterationExports.ForEach).toBeDefined()
    expect(IterationExports.ForEachComponent).toBeDefined()
    expect(IterationExports.For).toBeDefined()
  })

  test('should have correct export structure', () => {
    const expectedExports = ['ForEach', 'ForEachComponent', 'For']
    const actualExports = Object.keys(IterationExports)

    expectedExports.forEach(exportName => {
      expect(actualExports).toContain(exportName)
    })
  })

  test('ForEach should create valid component instance', () => {
    const items = ['test1', 'test2']
    const component = ForEach({
      data: items,
      children: item => Text(item),
    })

    expect(component).toBeDefined()
    expect(component.type).toBe('component')
    expect(component.props.data).toBe(items)
  })

  test('For should create valid component instance', () => {
    const items = ['test1', 'test2']
    const component = For({
      each: items,
      children: item => ({ type: 'text', text: item }),
    })

    expect(component).toBeDefined()
    expect(component.type).toBe('component')
    expect(component.props.data).toBe(items)
  })
})
