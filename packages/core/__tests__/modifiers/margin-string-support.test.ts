/**
 * Test string support in margin modifier
 */

import { describe, expect, it } from 'vitest'
import {
  margin,
  marginHorizontal,
  marginVertical,
  marginTop,
  marginBottom,
} from '@tachui/modifiers/basic/margin'

describe('Margin Modifier - String Value Support', () => {
  it('should accept string values for horizontal/vertical', () => {
    const modifier = margin({ horizontal: 'auto', vertical: 30 })
    expect(modifier).toBeDefined()
    expect(modifier.type).toBe('margin')
  })

  it('should accept auto for all sides', () => {
    const modifier = margin({ all: 'auto' })
    expect(modifier).toBeDefined()
  })

  it('should accept mixed string and number values', () => {
    const modifier = margin({
      top: 10,
      bottom: 20,
      left: 'auto',
      right: 'auto',
    })
    expect(modifier).toBeDefined()
  })

  it('should support convenience functions with strings', () => {
    expect(marginHorizontal('auto')).toBeDefined()
    expect(marginVertical('2rem')).toBeDefined()
    expect(marginTop('1em')).toBeDefined()
    expect(marginBottom('50%')).toBeDefined()
  })

  it('should support margin shorthand function with string', () => {
    expect(margin('auto')).toBeDefined()
    expect(margin('1rem')).toBeDefined()
  })
})
