/**
 * Test string support in padding modifier
 */

import { describe, expect, it } from 'vitest'
import {
  padding,
  paddingHorizontal,
  paddingVertical,
  paddingTop,
  paddingBottom,
} from '../padding'

describe('Padding Modifier - String Value Support', () => {
  it('should accept string values for horizontal/vertical', () => {
    const modifier = padding({ horizontal: '2rem', vertical: 30 })
    expect(modifier).toBeDefined()
    expect(modifier.type).toBe('padding')
  })

  it('should accept string for all sides', () => {
    const modifier = padding({ all: '1rem' })
    expect(modifier).toBeDefined()
  })

  it('should accept mixed string and number values', () => {
    const modifier = padding({
      top: 10,
      bottom: 20,
      left: '1rem',
      right: '2rem',
    })
    expect(modifier).toBeDefined()
  })

  it('should support convenience functions with strings', () => {
    expect(paddingHorizontal('2rem')).toBeDefined()
    expect(paddingVertical('1em')).toBeDefined()
    expect(paddingTop('10px')).toBeDefined()
    expect(paddingBottom('50%')).toBeDefined()
  })

  it('should support padding shorthand function with string', () => {
    expect(padding('1rem')).toBeDefined()
    expect(padding('10px')).toBeDefined()
  })
})
