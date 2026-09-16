/**
 * Shapes serialize as an `<svg>` shell.
 *
 * A shape's geometry comes from measuring its frame, which no server can do,
 * but everything else about the element is known ahead of time. Emitting the
 * shell gives the shape its layout box in the first paint instead of leaving
 * a hole until scripts run; only the path's `d` arrives later.
 *
 * `@tachui/primitives` is imported through the shared vitest alias, not a
 * package dependency — this package depends on `@tachui/core` alone, and that
 * stays true. The import is test-only, and it is here because the shell is
 * only worth anything if the *serializer* emits it.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderToString } from '../src/render-to-string'
// Registers the modifier set; `.frame()` and `.overlay()` are unresolvable
// without it.
import '@tachui/modifiers'
import { Circle, Rectangle } from '@tachui/primitives/shapes'

describe('a shape serialized without a DOM', () => {
  // This package's own runner is a `node` environment, but the root runner is
  // jsdom, where a shape takes the owned-element path instead and emits the
  // built `<svg>`. Both reserve the box; they are different markup, so the
  // condition is forced here rather than inherited from whichever runner is
  // in use.
  let originalDocument: typeof globalThis.document

  beforeEach(() => {
    originalDocument = globalThis.document
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: undefined,
    })
  })

  afterEach(() => {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: originalDocument,
    })
  })

  it('emits the svg shell inside the wrapper', () => {
    const markup = renderToString(Circle().fill('red') as any)

    expect(markup).toContain('class="tachui-shape tachui-shape-circle"')
    expect(markup).toContain('<svg')
    expect(markup).toContain('class="tachui-shape__svg"')
    expect(markup).toContain('<path')
  })

  it('reserves the box: full size, block, and overflow visible', () => {
    const markup = renderToString(Circle() as any)

    expect(markup).toContain('width="100%"')
    expect(markup).toContain('height="100%"')
    expect(markup).toMatch(/display:\s*block/)
    expect(markup).toMatch(/overflow:\s*visible/)
  })

  it('stays decorative', () => {
    const markup = renderToString(Circle() as any)

    expect(markup).toContain('aria-hidden="true"')
    expect(markup).toContain('focusable="false"')
  })

  // `d` is the one thing a measurement is needed for, so it is the one thing
  // the server leaves out. An empty path draws nothing and reserves the box.
  it('emits no path data', () => {
    const markup = renderToString(Circle().fill('red') as any)

    expect(markup).not.toContain(' d=')
    expect(markup).not.toContain('M ')
  })
})

// With a DOM shim the owner's element is the only source of truth for its
// markup, so the serializer emits it verbatim rather than the described
// shell. The shape still reserves the same box; it just arrives by the other
// route. Pinned because the two paths are easy to confuse when reading the
// serializer.
describe('a shape serialized with a DOM shim', () => {
  it('emits the built element, which already carries the shell', () => {
    if (typeof document === 'undefined') return

    const markup = renderToString(Circle().fill('red') as any)

    expect(markup).toContain('class="tachui-shape__svg"')
    expect(markup).toContain('width="100%"')
    expect(markup).toContain('aria-hidden="true"')
    // Built, so `paint()` has run — but with no frame measured there is still
    // no geometry.
    expect(markup).toContain('d=""')
  })
})
