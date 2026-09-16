import { describe, expect, it } from 'vitest'
import {
  capsulePath,
  circlePath,
  clampCornerRadius,
  ellipsePath,
  formatLength,
  insetRect,
  rectanglePath,
  roundedRectPath,
} from '../../src/shapes/geometry'

const WIDE = { x: 0, y: 0, width: 100, height: 50 }
const TALL = { x: 0, y: 0, width: 50, height: 100 }

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

describe('rectanglePath', () => {
  it('traces the rect clockwise from the top-left', () => {
    expect(rectanglePath(WIDE)).toBe('M 0 0 L 100 0 L 100 50 L 0 50 Z')
  })

  it('honours the rect origin', () => {
    expect(rectanglePath({ x: 10, y: 20, width: 30, height: 40 })).toBe(
      'M 10 20 L 40 20 L 40 60 L 10 60 Z'
    )
  })

  it('draws nothing for an empty rect', () => {
    expect(rectanglePath({ x: 0, y: 0, width: 0, height: 40 })).toBe('')
  })
})

describe('clampCornerRadius', () => {
  it('leaves a radius that fits', () => {
    expect(clampCornerRadius(WIDE, 12)).toBe(12)
  })

  // SwiftUI clamps to half the *short* side. An SVG `<rect rx ry>` clamps each
  // axis separately and would draw 50x25 elliptical corners here.
  it('clamps to half the short side, not half of each axis', () => {
    expect(clampCornerRadius(WIDE, 40)).toBe(25)
    expect(clampCornerRadius(TALL, 40)).toBe(25)
  })

  it('floors a negative radius at zero', () => {
    expect(clampCornerRadius(WIDE, -4)).toBe(0)
  })
})

describe('roundedRectPath', () => {
  it('draws circular corners in a wide rect', () => {
    expect(roundedRectPath(WIDE, 12)).toBe(
      'M 12 0 L 88 0 A 12 12 0 0 1 100 12 L 100 38 A 12 12 0 0 1 88 50 ' +
        'L 12 50 A 12 12 0 0 1 0 38 L 0 12 A 12 12 0 0 1 12 0 Z'
    )
  })

  it('draws circular corners in a tall rect', () => {
    expect(roundedRectPath(TALL, 12)).toBe(
      'M 12 0 L 38 0 A 12 12 0 0 1 50 12 L 50 88 A 12 12 0 0 1 38 100 ' +
        'L 12 100 A 12 12 0 0 1 0 88 L 0 12 A 12 12 0 0 1 12 0 Z'
    )
  })

  // The corners stay circular rather than stretching into ellipses, which is
  // what an over-large `rx`/`ry` on an SVG `<rect>` would give.
  it('clamps an over-large radius to the capsule instead of distorting', () => {
    expect(roundedRectPath(WIDE, 40)).toBe(capsulePath(WIDE))
    expect(roundedRectPath(WIDE, 40)).toContain('A 25 25')
  })

  it('falls back to square corners for a zero radius', () => {
    expect(roundedRectPath(WIDE, 0)).toBe(rectanglePath(WIDE))
  })

  it('draws nothing for an empty rect', () => {
    expect(roundedRectPath({ x: 0, y: 0, width: 40, height: 0 }, 4)).toBe('')
  })
})

describe('ellipsePath', () => {
  // Unlike a circle, an ellipse fills the rect rather than inscribing in the
  // short side, so each axis gets its own radius.
  it('fills a wide rect', () => {
    expect(ellipsePath(WIDE)).toBe(
      'M 100 25 A 50 25 0 1 1 0 25 A 50 25 0 1 1 100 25 Z'
    )
  })

  it('fills a tall rect', () => {
    expect(ellipsePath(TALL)).toBe(
      'M 50 50 A 25 50 0 1 1 0 50 A 25 50 0 1 1 50 50 Z'
    )
  })

  it('matches the circle inscribed in a square', () => {
    const square = { x: 0, y: 0, width: 40, height: 40 }
    expect(ellipsePath(square)).toBe(circlePath(square))
  })

  it('draws nothing for an empty rect', () => {
    expect(ellipsePath({ x: 0, y: 0, width: 0, height: 40 })).toBe('')
  })
})

describe('capsulePath', () => {
  it('caps the short axis of a wide rect', () => {
    expect(capsulePath(WIDE)).toBe(
      'M 25 0 L 75 0 A 25 25 0 0 1 100 25 L 100 25 A 25 25 0 0 1 75 50 ' +
        'L 25 50 A 25 25 0 0 1 0 25 L 0 25 A 25 25 0 0 1 25 0 Z'
    )
  })

  it('caps the short axis of a tall rect', () => {
    expect(capsulePath(TALL)).toBe(
      'M 25 0 L 25 0 A 25 25 0 0 1 50 25 L 50 75 A 25 25 0 0 1 25 100 ' +
        'L 25 100 A 25 25 0 0 1 0 75 L 0 25 A 25 25 0 0 1 25 0 Z'
    )
  })

  // Both radii equal in either orientation: the caps are semicircles, not
  // half-ellipses.
  it('keeps the caps circular in both orientations', () => {
    for (const rect of [WIDE, TALL]) {
      const radii = capsulePath(rect).match(/A (\S+) (\S+)/g) ?? []
      expect(radii).not.toHaveLength(0)
      for (const arc of radii) {
        const [, rx, ry] = arc.split(' ')
        expect(rx).toBe(ry)
        expect(Number(rx)).toBe(Math.min(rect.width, rect.height) / 2)
      }
    }
  })

  it('is a circle in a square rect', () => {
    const square = { x: 0, y: 0, width: 40, height: 40 }
    expect(capsulePath(square)).toContain('A 20 20')
  })
})
