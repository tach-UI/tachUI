/**
 * The overlay's server path.
 *
 * With no DOM to build the layer in, the modifier describes it as nodes
 * instead of appending an element. The SSR serializer hands modifiers a
 * style-collecting stand-in with no child API, which is what selects this
 * path; here a bare `{ style }` object stands in for it.
 *
 * The point of most of these is that the described layer and the built one
 * agree — a disagreement would show as the overlay jumping when the client
 * takes over.
 */

import { describe, expect, it } from 'vitest'
import { OverlayModifier } from '../../src/layout/overlay'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '@tachui/types/modifiers'

/** An element that can be styled but not built into, as SSR's stand-in is. */
function styleOnlyElement(): { style: Record<string, string> } {
  return { style: {} }
}

function describeOverlay(
  properties: Record<string, unknown>,
  node: DOMNode = { type: 'element', tag: 'div', props: {}, children: [] }
): { host: Record<string, string>; layer: DOMNode; result: DOMNode } {
  const element = styleOnlyElement()
  const result = new OverlayModifier(properties as any).apply(node, {
    componentId: 'test',
    phase: 'creation',
    element,
  } as unknown as ModifierContext) as { node: DOMNode }

  const children = result.node.children ?? []
  return {
    host: element.style,
    layer: children[children.length - 1],
    result: result.node,
  }
}

/** `inset-inline-start` as the described styles spell it. */
const toCamelCase = (property: string): string =>
  property.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase())

const layerStyle = (layer: DOMNode) =>
  (layer.props as { style: Record<string, string> }).style

describe('overlay without a DOM', () => {
  it('appends the layer as a node rather than building an element', () => {
    const { layer, result } = describeOverlay({ content: 'BADGE' })

    expect(result.children).toHaveLength(1)
    expect(layer.tag).toBe('div')
    expect(layer.children).toEqual([{ type: 'text', text: 'BADGE' }])
  })

  it('keeps the host a positioned container', () => {
    const { host } = describeOverlay({ content: 'B' })
    expect(host.position).toBe('relative')
  })

  it('leaves a host that is already positioned alone', () => {
    const element = styleOnlyElement()
    element.style.position = 'absolute'
    new OverlayModifier({ content: 'B' } as any).apply(
      { type: 'element', tag: 'div', props: {}, children: [] },
      {
        componentId: 't',
        phase: 'creation',
        element,
      } as unknown as ModifierContext
    )
    expect(element.style.position).toBe('absolute')
  })

  it('covers the host with one definite cell', () => {
    const style = layerStyle(describeOverlay({ content: 'B' }).layer)

    expect(style).toMatchObject({
      position: 'absolute',
      top: '0px',
      bottom: '0px',
      insetInlineStart: '0px',
      insetInlineEnd: '0px',
      display: 'grid',
      gridTemplateColumns: '100%',
      gridTemplateRows: '100%',
      pointerEvents: 'none',
    })
  })

  it('expresses alignment as the item placement, following the inline axis', () => {
    expect(
      layerStyle(describeOverlay({ content: 'B', alignment: 'topTrailing' }).layer)
    ).toMatchObject({ justifyItems: 'end', alignItems: 'start' })

    expect(
      layerStyle(describeOverlay({ content: 'B', alignment: 'bottomLeading' }).layer)
    ).toMatchObject({ justifyItems: 'start', alignItems: 'end' })
  })

  it('hides a disabled overlay rather than dropping it', () => {
    const style = layerStyle(
      describeOverlay({ content: 'B', enabled: false }).layer
    )
    expect(style.display).toBe('none')
  })

  describe('content forms', () => {
    it('renders a number as text', () => {
      const { layer } = describeOverlay({ content: 7 })
      expect(layer.children).toEqual([{ type: 'text', text: '7' }])
    })

    // Read once and untracked: there is no client here to update it.
    it('reads a signal once', () => {
      let reads = 0
      const signal = Object.assign(
        () => {
          reads += 1
          return 'LIVE'
        },
        { isSignal: true as const }
      )
      const { layer } = describeOverlay({ content: signal })

      expect(layer.children).toEqual([{ type: 'text', text: 'LIVE' }])
      expect(reads).toBe(1)
    })

    it('calls a content closure', () => {
      const { layer } = describeOverlay({ content: () => 'FROM CLOSURE' })
      expect(layer.children).toEqual([{ type: 'text', text: 'FROM CLOSURE' }])
    })

    it('describes nothing for empty content', () => {
      expect(describeOverlay({ content: null }).layer.children).toEqual([])
      expect(describeOverlay({ content: undefined }).layer.children).toEqual([])
    })
  })

  // Auto-placement would put a second item in an implicit row below the
  // `100%` one, outside the host. The DOM walk shares the one cell; so does
  // this one.
  describe('layering more than one item', () => {
    const twoItems = {
      type: 'component' as const,
      render: () => [
        { type: 'element', tag: 'span', props: {}, children: [] },
        { type: 'element', tag: 'span', props: {}, children: [] },
      ],
    }

    it('shares the one cell', () => {
      const { layer } = describeOverlay({ content: twoItems })
      for (const item of layer.children ?? []) {
        expect((item.props as any).style.gridArea).toBe('1 / 1')
      }
    })

    // The nodes come from a component's own `render()`, so a component that
    // returned a cached or shared node would otherwise carry `gridArea` away
    // with it. The DOM path has no equivalent risk: it styles elements it
    // built itself.
    it('copies the content nodes rather than writing to them', () => {
      const shared = [
        { type: 'element', tag: 'span', props: {}, children: [] },
        { type: 'element', tag: 'span', props: {}, children: [] },
      ]
      const { layer } = describeOverlay({
        content: { type: 'component' as const, render: () => shared },
      })

      for (const item of layer.children ?? []) {
        expect((item.props as any).style.gridArea).toBe('1 / 1')
      }
      for (const original of shared) {
        expect(original.props).toEqual({})
      }
    })

    it('leaves a lone item alone', () => {
      const { layer } = describeOverlay({
        content: {
          type: 'component' as const,
          render: () => ({ type: 'element', tag: 'span', props: {}, children: [] }),
        },
      })
      expect((layer.children?.[0].props as any).style).toBeUndefined()
    })

    // A `ForEach` or `Show` mounts a `display: contents` shell that generates
    // no box, so its children are the grid items.
    it('descends through a display:contents shell', () => {
      const { layer } = describeOverlay({
        content: {
          type: 'component' as const,
          render: () => ({
            type: 'element',
            tag: 'div',
            props: { style: { display: 'contents' } },
            children: [
              { type: 'element', tag: 'span', props: {}, children: [] },
              { type: 'element', tag: 'span', props: {}, children: [] },
            ],
          }),
        },
      })

      const shell = layer.children?.[0] as DOMNode
      expect((shell.props as any).style.gridArea).toBeUndefined()
      for (const item of shell.children ?? []) {
        expect((item.props as any).style.gridArea).toBe('1 / 1')
      }
    })
  })
})

// The strongest claim this change makes.
// The serializer fails cleanly on a self-referential builder at top level;
// arriving as overlay content should not turn that into a stack overflow.
describe('cyclic content', () => {
  it('fails rather than recursing forever', () => {
    const cyclic: any = { type: 'component' }
    cyclic.render = () => cyclic

    expect(() => describeOverlay({ content: cyclic })).toThrow(TypeError)
    expect(() => describeOverlay({ content: cyclic })).toThrow(/cyclic/i)
  })

  // Beside itself, not inside itself. The guard tracks the current path, as
  // the serializer's does, so one component used twice as a sibling is fine —
  // and has to be, since `renderToString([leaf, leaf])` serializes both at top
  // level. Getting this wrong costs the whole overlay, because the pipeline
  // swallows the throw.
  it('allows the same component beside itself', () => {
    const leaf = {
      type: 'component' as const,
      render: () => ({ type: 'element', tag: 'i', props: {}, children: [] }),
    }
    const { layer } = describeOverlay({
      content: {
        type: 'component' as const,
        render: () => [leaf, leaf],
      },
    })

    expect(layer.children).toHaveLength(2)
    expect(layer.children?.map(child => child.tag)).toEqual(['i', 'i'])
  })

  it('allows the same component at two depths', () => {
    const leaf = {
      type: 'component' as const,
      render: () => ({ type: 'element', tag: 'i', props: {}, children: [] }),
    }
    const middle = { type: 'component' as const, render: () => leaf }
    const { layer } = describeOverlay({
      content: { type: 'component' as const, render: () => [middle, leaf] },
    })

    expect(layer.children?.map(child => child.tag)).toEqual(['i', 'i'])
  })
})

describe('the described layer and the built one agree', () => {
  const cases = [
    { content: 'B' },
    { content: 'B', alignment: 'topTrailing' },
    { content: 'B', alignment: 'bottomLeading', offset: 4 },
    { content: 'B', alignment: 'center', offset: { x: -3, y: 6 } },
    { content: 'B', enabled: false },
  ]

  it.each(cases)('for %j', properties => {
    const described = layerStyle(describeOverlay(properties).layer)

    const host = document.createElement('div')
    new OverlayModifier(properties as any).apply(
      { type: 'element', tag: 'div', props: {}, children: [], element: host } as any,
      {
        componentId: 't',
        phase: 'creation',
        element: host,
      } as unknown as ModifierContext
    )
    const built = host.lastElementChild as HTMLElement

    // Both directions. `described ⊆ built` alone would miss a style the DOM
    // path writes and the described one forgets, which is the more likely way
    // for the two to grow apart.
    for (const [property, value] of Object.entries(described)) {
      expect(built.style[property as any]).toBe(value)
    }

    // By index, not `Object.keys`: a `CSSStyleDeclaration`'s named properties
    // are prototype accessors, so `Object.keys` yields only `"0"`, `"1"`, …
    // and any filter over them drops every real property.
    expect(built.style.length).toBeGreaterThan(0)
    for (let index = 0; index < built.style.length; index += 1) {
      const property = built.style[index]
      expect(described[toCamelCase(property)]).toBe(
        built.style.getPropertyValue(property)
      )
    }
  })
})
