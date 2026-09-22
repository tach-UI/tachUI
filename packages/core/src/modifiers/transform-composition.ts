/**
 * Transform composition
 *
 * `offset`, `rotationEffect`, `scaleEffect` and a raw `transform` string all
 * land in one CSS `transform`. Each owns a part of it, recorded per element,
 * and every write recomposes the whole value from the parts, so no modifier
 * can erase another by writing after it — including a signal-driven one
 * updating later.
 *
 * Parts compose in a fixed order, outermost first: offset, rotation, scale,
 * raw. Modifiers are applied in priority order rather than chain order, so the
 * chain cannot decide this; the fixed order is the one a view is expected to
 * follow — it turns and scales in place, and the offset then moves it by the
 * amount asked, unscaled.
 *
 * Each effect carries its own anchor inside its part, as
 * `translate(a) f translate(-a)` around the element's center, instead of
 * through `transform-origin`, which is one value per element and so could only
 * ever honor one effect's anchor. This relies on `transform-origin` keeping
 * its HTML default of the center.
 *
 * The record lives here, in core, so every writer shares it: the modifiers
 * package's factories, and core's own `AnimationModifier` constructed directly.
 * A second copy of this module would keep a second record and overwrite the
 * first's work.
 *
 * Anything else on the element's `transform` — written directly by a
 * component, or by a modifier outside this set — is kept, ahead of the parts,
 * except functions of the kind a part replaces: setting an offset drops a
 * translate already there, a scale drops a scale, a rotation a rotate.
 * `translateZ(0)`, the compositing hint `position` writes, is kept. A raw
 * part is opaque, so a raw `scale()` and a `scaleEffect` both apply rather
 * than one replacing the other.
 *
 * Known limitation: the composer tells its own functions from someone else's
 * by comparing strings, so an outside writer that appends an exact copy of a
 * function the composer wrote has that copy treated as the composer's own
 * preserved one, and it renders twice. No writer in the repo does this.
 */

import type { TransformAnchor } from './types'

export type TransformPart = 'offset' | 'rotation' | 'scale' | 'raw'

const PART_ORDER: readonly TransformPart[] = ['offset', 'rotation', 'scale', 'raw']

// The functions each part replaces when it finds them already on the element.
const REPLACES: Record<TransformPart, (fn: string) => boolean> = {
  offset: fn => /^translate(X|Y|Z|3d)?\(/.test(fn) && fn !== 'translateZ(0)',
  rotation: fn => fn.startsWith('rotate('),
  scale: fn => /^scale(X|Y|Z|3d)?\(/.test(fn),
  raw: () => false,
}

// Anchor position relative to the center, as a percentage of the element's
// own box — which is what a percentage in `translate()` resolves against.
const ANCHOR_OFFSETS: Record<TransformAnchor, readonly [number, number]> = {
  center: [0, 0],
  top: [0, -50],
  topLeading: [-50, -50],
  topTrailing: [50, -50],
  bottom: [0, 50],
  bottomLeading: [-50, 50],
  bottomTrailing: [50, 50],
  leading: [-50, 0],
  trailing: [50, 0],
}

interface CompositionState {
  parts: Map<TransformPart, string>
  // What the element carried that is not ours, as last seen.
  foreign: string
  // The element's `transform` as read back after our last write. Reading it
  // back, rather than keeping the string we wrote, means a later comparison is
  // between two values the style object has serialized the same way.
  written: string
}

type StyledElement = { style: { transform?: string } }

const compositions = new WeakMap<object, CompositionState>()

/**
 * Wrap a transform function so it turns around `anchor` rather than the
 * element's center.
 */
export function anchorTransform(
  transformFunction: string,
  anchor: TransformAnchor = 'center'
): string {
  const [x, y] = ANCHOR_OFFSETS[anchor] ?? ANCHOR_OFFSETS.center
  if (x === 0 && y === 0) return transformFunction
  return `translate(${x}%, ${y}%) ${transformFunction} translate(${-x}%, ${-y}%)`
}

/**
 * Set, replace or clear (`null`) one part of an element's transform, and
 * write the recomposed value.
 */
export function setTransformPart(
  element: StyledElement,
  part: TransformPart,
  value: string | null
): void {
  const current = element.style.transform || ''
  let state = compositions.get(element)

  if (!state) {
    // Keep only the functions. `none` is the identity rather than a function,
    // and left in place it would make `none rotate(90deg)`, which is not a
    // transform list at all, so the browser would drop the whole value.
    const foreign = splitFunctions(current).join(' ')
    // `written` is set below, after the first write.
    state = { parts: new Map(), foreign, written: '' }
    compositions.set(element, state)
  } else if (current !== state.written) {
    // Someone else wrote since we did. Keep what they wrote, minus our own
    // functions, which they may have preserved.
    const ours = subtractFunctions(
      splitFunctions(state.written),
      splitFunctions(state.foreign)
    )
    state.foreign = subtractFunctions(splitFunctions(current), ours).join(' ')
  }

  const normalized = value?.trim()
  if (normalized && normalized !== 'none') {
    state.foreign = splitFunctions(state.foreign)
      .filter(fn => !REPLACES[part](fn))
      .join(' ')
    state.parts.set(part, normalized)
  } else {
    state.parts.delete(part)
  }

  const composed = PART_ORDER.map(name => state.parts.get(name))
    .filter(Boolean)
    .join(' ')

  element.style.transform = [state.foreign, composed].filter(Boolean).join(' ')
  state.written = element.style.transform || ''
}

// Split a transform into its top-level functions, matching parentheses to any
// depth so a `calc()`, `max()` or `var()` argument stays inside the function
// that holds it. Anything that is not a function, such as `none`, is dropped,
// as is an unclosed function, which the browser would reject anyway.
function splitFunctions(transform: string): string[] {
  const functions: string[] = []
  let depth = 0
  let start = -1

  for (let index = 0; index < transform.length; index += 1) {
    const char = transform[index]

    if (char === '(') {
      if (depth === 0) {
        let nameStart = index
        while (nameStart > 0 && /[a-zA-Z0-9-]/.test(transform[nameStart - 1])) {
          nameStart -= 1
        }
        start = nameStart < index ? nameStart : -1
      }
      depth += 1
    } else if (char === ')' && depth > 0) {
      depth -= 1
      if (depth === 0 && start !== -1) {
        functions.push(transform.slice(start, index + 1))
        start = -1
      }
    }
  }

  return functions
}

// Remove each of `remove` once from `from`, as a multiset.
function subtractFunctions(from: string[], remove: string[]): string[] {
  const remaining = [...from]
  for (const item of remove) {
    const index = remaining.indexOf(item)
    if (index !== -1) remaining.splice(index, 1)
  }
  return remaining
}
