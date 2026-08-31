/**
 * Sorted-modifier cache tests
 *
 * applyModifiersToNode memoizes the priority sort keyed on the source array
 * (#220). Modifier arrays are appended to in place after construction, so
 * these tests pin the behaviour that a warm cache must not mask: a modifier
 * pushed between two renders still reaches the DOM, and ordering stays
 * priority order on both the sequential and batch application paths.
 *
 * See #253 for the underlying mutability-invariant question.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { DOMNode } from '../../src/runtime/types'
import type { Modifier, ModifierContext } from '../../src/modifiers/types'
import { applyModifiersToNode } from '../../src/modifiers/registry'

/** Records its own name onto the node so application order is observable. */
function trackingModifier(name: string, priority: number): Modifier {
  return {
    type: name,
    priority,
    properties: {},
    apply(node: DOMNode) {
      const applied = ((node as any).__applied ??= [])
      applied.push(name)
      return node
    },
  } as unknown as Modifier
}

function makeNode(): DOMNode {
  return { type: 'element', tag: 'div', props: {}, children: [] } as DOMNode
}

const context: ModifierContext = { componentId: 'test', phase: 'creation' }

describe('sorted modifier cache (#220)', () => {
  let modifiers: Modifier[]

  beforeEach(() => {
    modifiers = [trackingModifier('first', 10), trackingModifier('second', 20)]
  })

  it('applies modifiers in priority order regardless of insertion order', () => {
    const unordered = [trackingModifier('late', 90), trackingModifier('early', 5)]
    const node = applyModifiersToNode(makeNode(), unordered, context)

    expect((node as any).__applied).toEqual(['early', 'late'])
  })

  it('returns the same sorted result across repeated renders of one array', () => {
    const first = applyModifiersToNode(makeNode(), modifiers, context)
    const second = applyModifiersToNode(makeNode(), modifiers, context)

    expect((first as any).__applied).toEqual(['first', 'second'])
    expect((second as any).__applied).toEqual(['first', 'second'])
  })

  // The regression PR #251 shipped: once the cache was warm, a modifier pushed
  // onto the array afterwards never reached the DOM.
  it('picks up a modifier pushed in place between two renders', () => {
    applyModifiersToNode(makeNode(), modifiers, context)

    modifiers.push(trackingModifier('third', 30))
    const node = applyModifiersToNode(makeNode(), modifiers, context)

    expect(modifiers).toHaveLength(3)
    expect((node as any).__applied).toEqual(['first', 'second', 'third'])
  })

  it('re-sorts when the pushed modifier belongs earlier in priority order', () => {
    applyModifiersToNode(makeNode(), modifiers, context)

    modifiers.push(trackingModifier('zeroth', 1))
    const node = applyModifiersToNode(makeNode(), modifiers, context)

    expect((node as any).__applied).toEqual(['zeroth', 'first', 'second'])
  })

  it('picks up an in-place push on the batch path too', () => {
    applyModifiersToNode(makeNode(), modifiers, context, { batch: true })

    modifiers.push(trackingModifier('third', 30))
    const node = applyModifiersToNode(makeNode(), modifiers, context, {
      batch: true,
    })

    expect((node as any).__applied).toEqual(['first', 'second', 'third'])
  })

  // Cross-group order is the order types first appear in the CALLER's array,
  // not priority order. Grouping the priority-sorted array instead would flip
  // this — and batch mode is the renderer's element path and the SSR
  // serializer, so it would move real DOM and prerendered HTML output.
  it('applies type groups in caller order, not priority order, on the batch path', () => {
    const modifiers: Modifier[] = [
      { ...trackingModifier('layout', 10), type: 'layout' } as Modifier,
      { ...trackingModifier('interaction', 5), type: 'interaction' } as Modifier,
    ]
    const node = applyModifiersToNode(makeNode(), modifiers, context, {
      batch: true,
    })

    // 'interaction' has the lower priority number but 'layout' is named first.
    expect((node as any).__applied).toEqual(['layout', 'interaction'])
  })

  it('keeps cross-group caller order while sorting within each group', () => {
    const modifiers: Modifier[] = [
      { ...trackingModifier('b-late', 90), type: 'beta' } as Modifier,
      { ...trackingModifier('a-late', 80), type: 'alpha' } as Modifier,
      { ...trackingModifier('b-early', 20), type: 'beta' } as Modifier,
      { ...trackingModifier('a-early', 10), type: 'alpha' } as Modifier,
    ]
    const node = applyModifiersToNode(makeNode(), modifiers, context, {
      batch: true,
    })

    // beta first (named first), each group internally in priority order.
    expect((node as any).__applied).toEqual([
      'b-early',
      'b-late',
      'a-early',
      'a-late',
    ])
  })

  it('keeps same-type modifiers in priority order on the batch path', () => {
    const sameType: Modifier[] = [
      { ...trackingModifier('high', 90), type: 'shared' } as Modifier,
      { ...trackingModifier('low', 10), type: 'shared' } as Modifier,
    ]
    const node = applyModifiersToNode(makeNode(), sameType, context, {
      batch: true,
    })

    expect((node as any).__applied).toEqual(['low', 'high'])
  })
})
