import { describe, expect, it } from 'vitest'
import { circlePath, formatLength, insetRect } from '../../src/shapes/geometry'

describe('formatLength', () => {
  it('trims float noise so equal lengths produce equal path data', () => {
    expect(formatLength(19.999999999)).toBe('20')
    expect(formatLength(20)).toBe('20')
    expect(formatLength(12.3456)).toBe('12.346')
  })
})

describe('insetRect', () => {
  it('shrinks every side and keeps the center', () => {
    expect(insetRect({ x: 0, y: 0, width: 40, height: 20 }, 3)).toEqual({
      x: 3,
      y: 3,
      width: 34,
      height: 14,
    })
  })

  it('collapses to the center rather than inverting when the inset is too large', () => {
    expect(insetRect({ x: 10, y: 10, width: 8, height: 20 }, 6)).toEqual({
      x: 14,
      y: 16,
      width: 0,
      height: 8,
    })
  })
})

describe('circlePath', () => {
  // Inscribed in the short side and centered, as SwiftUI draws it. A
  // percentage `r` in SVG would resolve against the normalized diagonal
  // instead and overshoot a non-square box.
  it('inscribes in the short side of a wide rect', () => {
    expect(circlePath({ x: 0, y: 0, width: 100, height: 50 })).toBe(
      'M 75 25 A 25 25 0 1 1 25 25 A 25 25 0 1 1 75 25 Z'
    )
  })

  it('inscribes in the short side of a tall rect', () => {
    expect(circlePath({ x: 0, y: 0, width: 50, height: 100 })).toBe(
      'M 50 50 A 25 25 0 1 1 0 50 A 25 25 0 1 1 50 50 Z'
    )
  })

  it('honours the rect origin', () => {
    expect(circlePath({ x: 1, y: 1, width: 38, height: 38 })).toBe(
      'M 39 20 A 19 19 0 1 1 1 20 A 19 19 0 1 1 39 20 Z'
    )
  })

  it('draws nothing for an empty rect', () => {
    expect(circlePath({ x: 0, y: 0, width: 0, height: 40 })).toBe('')
  })
})
