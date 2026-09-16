/**
 * `overlay()` through the real serializer.
 *
 * The modifier's own suite stands a plain `{ style: {} }` object in for the
 * element, where reads work. The serializer's stand-in is a proxy, and a read
 * that returns nothing there is exactly how the server came to write a style
 * the client never writes — so the cases that turn on a *read* belong here,
 * against the real thing.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { renderToString } from '../src/render-to-string'
import '@tachui/modifiers'
import { Text, ZStack } from '@tachui/primitives'

function build(component: unknown): unknown {
  const candidate = component as { build?: () => unknown }
  return typeof candidate.build === 'function' ? candidate.build() : component
}

describe('overlay serialized without a DOM', () => {
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

  it('emits the layer and its content', () => {
    const markup = renderToString(build(Text('hi').overlay('BADGE')) as any)

    expect(markup).toContain('BADGE')
    expect(markup).toMatch(/position:\s*absolute/)
    expect(markup).toMatch(/grid-template-rows:\s*100%/)
    expect(markup).toMatch(/pointer-events:\s*none/)
  })

  it('makes an unpositioned host a positioned container', () => {
    const markup = renderToString(build(Text('hi').overlay('B')) as any)
    expect(markup).toMatch(/class="tachui-text"[^>]*position:\s*relative/)
  })

  // The regression. A host that positions itself — every `ZStack` child does —
  // must keep the position it declared. The serializer's style stand-in used
  // to report nothing for *any* read, so the guard never fired and `relative`
  // was appended and won the cascade, dropping the child out of the stack
  // until the client took over and put it back.
  it('leaves a host that declares its own position alone', () => {
    const markup = renderToString(
      build(
        ZStack({
          children: [Text('back'), build(Text('front').overlay('BADGE'))],
        })
      ) as any
    )

    expect(markup).toContain('position:absolute;top:0;left:0;right:0;bottom:0')
    expect(markup).not.toContain('position:absolute;position:relative')
  })

  it('carries alignment through to the layer', () => {
    const markup = renderToString(
      build(Text('hi').overlay('B', 'topTrailing')) as any
    )

    expect(markup).toMatch(/justify-items:\s*end/)
    expect(markup).toMatch(/align-items:\s*start/)
  })
})
