/**
 * Icon SVG sanitization tests (#218)
 *
 * Icon definitions come from pluggable icon sets and are not guaranteed
 * trusted: every innerHTML sink must receive allowlist-sanitized bodies and
 * validated/escaped attribute values.
 */

import { describe, expect, test, vi } from 'vitest'
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

describe('DOM-free SSR fallback (#218 review)', () => {
  test('inline SVG rendering works without DOMParser/document', () => {
    vi.stubGlobal('DOMParser', undefined)
    vi.stubGlobal('document', undefined)

    const definition = makeDefinition({ name: 'ssr-icon' })
    const rendered = OptimizedSVGRenderer.render(
      definition,
      IconRenderingStrategy.INLINE_SVG
    )

    expect(rendered).toContain('<svg')
    expect(rendered).toContain('<path d="M20.84')
    vi.unstubAllGlobals()
  })

  test('DOM-free sanitizer strips scripts, handlers, and unknown elements', () => {
    vi.stubGlobal('DOMParser', undefined)
    vi.stubGlobal('document', undefined)

    const definition = makeDefinition({
      name: 'ssr-evil',
      svg: '<script>alert(1)</script><a href="#x"><path d="M10 10" onload="alert(1)"/></a>',
    })

    // Throwing computed values are memoized per object — use a fresh body
    // via a direct call on a fresh definition
    const sanitized = getSanitizedIconBody(makeDefinition(definition))

    expect(sanitized).not.toContain('<script')
    expect(sanitized).not.toContain('onload')
    expect(sanitized).not.toContain('<a')
    expect(sanitized).toContain('<path d="M10 10"/>')

    vi.unstubAllGlobals()
  })

  test('DOM-free sanitizer drops malformed markup instead of emitting it', () => {
    vi.stubGlobal('DOMParser', undefined)
    vi.stubGlobal('document', undefined)

    // Unquoted attribute values do not match the strict token grammar —
    // the element must be dropped, not emitted with the raw attributes
    const sanitized = getSanitizedIconBody(
      makeDefinition({ name: 'ssr-malformed', svg: `<path d=M12 onload=x>` })
    )

    expect(sanitized).not.toContain('onload')
    expect(sanitized).not.toContain('d=M12')

    vi.unstubAllGlobals()
  })

  test('DOM-free sanitizer fails closed when malformed markup precedes a valid tag', () => {
    vi.stubGlobal('DOMParser', undefined)
    vi.stubGlobal('document', undefined)

    // The malformed first tag must not leak through as text ahead of the
    // valid second tag — a '<' that cannot tokenize drops the rest (fail closed)
    const sanitized = getSanitizedIconBody(
      makeDefinition({
        name: 'ssr-chained',
        svg: '<path d=M12 onload=alert(1)><path d="M0 0"/>',
      })
    )

    expect(sanitized).not.toContain('onload')
    expect(sanitized).not.toContain('alert(1)')
    expect(sanitized).toBe('')

    vi.unstubAllGlobals()
  })

  /**
   * `href`/`xlink:href` are allowlisted attributes, so the protocol check is
   * what stands between a `<use>` reference and script execution. The DOM path
   * is covered by `@tachui/core`'s sanitizer tests; this pins the DOM-free
   * rebuilder, which reimplements the rule and has to stay in step with it.
   */
  test('DOM-free sanitizer drops unsafe href protocols', () => {
    vi.stubGlobal('DOMParser', undefined)
    vi.stubGlobal('document', undefined)

    // Each case on its own definition: a value containing angle brackets fails
    // the token grammar outright and drops everything after it (fail closed,
    // asserted above), which would mask the per-attribute filtering under test.
    const sanitize = (name: string, svg: string) =>
      getSanitizedIconBody(makeDefinition({ name, svg }))

    expect(sanitize('h1', '<use href="javascript:alert(1)"/>')).toBe('<use/>')
    expect(sanitize('h2', '<use xlink:href="JaVaScRiPt:alert(1)"/>')).toBe('<use/>')
    // Control characters are stripped before the protocol check, so padding
    // does not sneak it past.
    expect(sanitize('h3', '<use href="java\tscript:alert(1)"/>')).toBe('<use/>')
    expect(sanitize('h4', '<use href="data:text/html;base64,PHN2Zz4="/>')).toBe('<use/>')

    // The safe fragment reference survives, so the rule is a filter on the
    // value and not a blanket drop of the attribute.
    expect(sanitize('h5', '<use href="#legit"/>')).toBe('<use href="#legit"/>')

    vi.unstubAllGlobals()
  })
})
