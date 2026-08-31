/**
 * Icon SVG sanitization tests (#218)
 *
 * Icon definitions come from pluggable icon sets and are not guaranteed
 * trusted: every innerHTML sink must receive allowlist-sanitized bodies and
 * validated/escaped attribute values.
 */

import { describe, expect, test } from 'vitest'
import {
  escapeHtmlAttr,
  getSafeViewBox,
  getSanitizedIconBody,
} from '../../src/utils/sanitize-icon.js'
import {
  IconPerformanceManager,
  OptimizedSVGRenderer,
} from '../../src/utils/performance.js'
import { IconRenderingStrategy } from '../../src/types.js'
import type { IconDefinition } from '../../src/types.js'

const LEGACY_BODY =
  '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>'

function makeDefinition(overrides: Partial<IconDefinition> = {}): IconDefinition {
  return {
    name: 'heart',
    variant: 'none',
    weight: 'regular',
    svg: LEGACY_BODY,
    viewBox: '0 0 24 24',
    ...overrides,
  }
}

describe('getSanitizedIconBody', () => {
  test('strips script elements and event handler attributes', () => {
    const definition = makeDefinition({
      svg: '<script>alert(1)</script><path d="M10 10" onload="alert(1)"/>',
    })

    const sanitized = getSanitizedIconBody(definition)

    expect(sanitized).not.toContain('<script')
    expect(sanitized).not.toContain('onload')
    expect(sanitized).toContain('<path')
  })

  test('leaves a normal Lucide-shaped body unchanged', () => {
    const definition = makeDefinition()

    // The DOM round-trip normalizes self-closing syntax (`/>` → `></path>`)
    // — elements and attributes must be preserved exactly
    expect(getSanitizedIconBody(definition)).toBe(
      LEGACY_BODY.replace('/>', '></path>')
    )
  })

  test('memoizes the sanitized body per definition object', () => {
    const definition = makeDefinition({
      svg: '<circle cx="12" cy="12" r="10"/>',
    })

    const first = getSanitizedIconBody(definition)
    definition.svg = '<script>alert(1)</script>'

    // Same object identity → cached sanitized result is reused
    expect(getSanitizedIconBody(definition)).toBe(first)
  })
})

describe('getSafeViewBox', () => {
  test('accepts standard numeric viewBox values', () => {
    expect(getSafeViewBox(makeDefinition())).toBe('0 0 24 24')
    expect(getSafeViewBox(makeDefinition({ viewBox: '0 0 48 48' }))).toBe(
      '0 0 48 48'
    )
  })

  test('falls back to the default viewBox for crafted values', () => {
    expect(
      getSafeViewBox(makeDefinition({ viewBox: '0 0 24 24" onload="x' }))
    ).toBe('0 0 24 24')
    expect(getSafeViewBox(makeDefinition({ viewBox: '' }))).toBe('0 0 24 24')
  })
})

describe('escapeHtmlAttr', () => {
  test('escapes attribute-breaking characters', () => {
    expect(escapeHtmlAttr('a"b<c&d')).toBe('a&quot;b&lt;c&amp;d')
  })
})

describe('OptimizedSVGRenderer integration', () => {
  test('inline SVG rendering strips scripts and handlers from the icon body', () => {
    const definition = makeDefinition({
      name: 'evil-icon',
      svg: '<script>alert(1)</script><path d="M10 10" onload="alert(1)"/>',
      viewBox: '0 0 24 24" onload="x',
    })

    const rendered = OptimizedSVGRenderer.render(
      definition,
      IconRenderingStrategy.INLINE_SVG
    )

    expect(rendered).not.toContain('<script')
    expect(rendered).not.toContain('onload')
    expect(rendered).toContain('viewBox="0 0 24 24"')
    expect(rendered).toContain('<path')
  })

  test('SVG use rendering escapes interpolated reference attributes', () => {
    const definition = makeDefinition({
      name: 'evil"icon',
      variant: 'none"onload="x',
    })

    const rendered = OptimizedSVGRenderer.render(
      definition,
      IconRenderingStrategy.SVG_USE
    )

    // The crafted values must stay escaped — no attribute breakout
    expect(rendered).not.toContain('onload="x"')
    expect(rendered).toContain('&quot;')
  })

  test('sprite insertion sanitizes the symbol body', () => {
    const definition = makeDefinition({
      name: 'sprite-evil',
      svg: '<script>alert(1)</script><path d="M10 10" onload="alert(1)"/>',
    })

    OptimizedSVGRenderer.render(definition, IconRenderingStrategy.SVG_USE)

    const symbolElement = document.querySelector('#icon-sprite-evil-none')
    expect(symbolElement).not.toBeNull()
    expect(symbolElement!.innerHTML).not.toContain('<script')
    expect(symbolElement!.innerHTML).not.toContain('onload')
    expect(symbolElement!.innerHTML).toContain('<path')
  })
})
