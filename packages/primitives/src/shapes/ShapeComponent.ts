/**
 * Shape engine
 *
 * A shape is a path-in-rect function (`Shape` in `@tachui/types`) drawn as one
 * `<path>` inside an `<svg>` that fills the shape's frame. The frame is
 * measured with a ResizeObserver and the path is recomputed from the measured
 * rect, so every shape is exact in any box. Percentage geometry was rejected:
 * SVG resolves a percentage radius against the normalized diagonal rather than
 * the short side, so a circle in a non-square box overshoots, and a capsule
 * has no percentage form at all. Measurement is also what a custom shape
 * (a user-supplied path-in-rect function) needs, so it is the foundation.
 *
 * The `<svg>` cannot be expressed as ordinary `DOMNode` children — the renderer
 * has no namespace support — so it is built with `createElementNS` and handed
 * over as an owned node through `reactiveElement`. The accessor always returns
 * the *same* element and updates its attributes in place: a signal-driven
 * stroke or a size change never replaces the element, so a CSS transition
 * running on it survives the update. The renderer's swap path (which `Symbol`
 * uses) would restart it.
 *
 * Modifiers land on a wrapper `div`, never on the owned node (see
 * `DOMNode.owned`), so `.frame()`, `.opacity()` and the rest behave as on any
 * element. Server-side the wrapper serializes with an `<svg>` shell inside it
 * — everything about the element that does not depend on a measurement, with
 * an empty `<path>` — so the shape has its layout box in the first paint. The
 * geometry arrives when the client renders and measures.
 */

import type {
  ComponentProps,
  DOMNode,
  ModifiableComponentWithModifiers,
  Signal,
} from '@tachui/core'
import {
  clonePropsPreservingReactivity,
  createSignal,
  h,
  isSignal,
  resetLifecycleState,
  withModifiers,
} from '@tachui/core'
import type { ColorAssetProxy } from '@tachui/core/assets'
import type {
  CloneableComponent,
  CloneOptions,
} from '@tachui/core/runtime/types'
import type { Shape, ShapeRect } from '@tachui/types/shapes'
import { formatLength, insetRect } from './geometry'

/**
 * A fill or stroke style: a CSS color, a signal of one, or a color asset.
 */
export type ShapeStyle = string | Signal<string> | ColorAssetProxy

export type ShapeLength = number | Signal<number>

export interface ShapeProps extends ComponentProps {}

/**
 * What a shape factory returns: the shape's own methods (`fill`, `stroke`,
 * `strokeBorder`, `inset`) plus the modifier chain, in either order.
 */
export type ShapeInstance = ShapeComponent &
  ModifiableComponentWithModifiers<ShapeProps>

interface ShapeStyling {
  fill: ShapeStyle | undefined
  stroke: ShapeStyle | undefined
  lineWidth: ShapeLength
  /** Every `.inset()` call, summed at paint time so signals stay live. */
  insets: ShapeLength[]
  /** `strokeBorder`: inset by half the line width so the stroke stays inside. */
  strokeInside: boolean
}

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const EMPTY_RECT: ShapeRect = { x: 0, y: 0, width: 0, height: 0 }

/**
 * The `<svg>` shell: everything about the element that does not depend on a
 * measurement.
 *
 * Declared once because it is built twice — with `createElementNS` on the
 * client, and described as a plain node for the server — and the two must
 * agree, or the server's box and the client's would differ.
 */
const SVG_SHELL_ATTRS: Record<string, string> = {
  class: 'tachui-shape__svg',
  width: '100%',
  height: '100%',
  // Decorative: the shape carries no meaning of its own.
  'aria-hidden': 'true',
  focusable: 'false',
}

const SVG_SHELL_STYLE: Record<string, string> = {
  display: 'block',
  // The viewport would otherwise clip the outer half of a centered stroke.
  overflow: 'visible',
}

/**
 * A length, with anything that is not a finite number treated as zero.
 *
 * A `NaN` inset would otherwise reach `Math.max(0, NaN)` and put `NaN` in the
 * path data, which renders as nothing with no error anywhere — the silent
 * failure `resolveStyle` avoids for colors.
 */
export function resolveLength(value: ShapeLength): number {
  const resolved = isSignal(value) ? value() : value
  return Number.isFinite(resolved) ? resolved : 0
}

function resolveStyle(style: ShapeStyle): string {
  const value = isSignal(style) ? style() : style
  if (typeof value === 'string') return value
  const asset = value as { resolve?: () => string; value?: unknown }
  if (typeof asset?.resolve === 'function') return asset.resolve()
  if (typeof asset?.value === 'string') return asset.value
  // Neither a color string, a signal of one, nor an asset. Stringifying it
  // would paint `[object Object]` and look like a rendering bug, so say what
  // happened and draw nothing.
  console.warn(
    '[tachUI/primitives] A shape style must be a CSS color string, a signal ' +
      'of one, or a color asset. Received:',
    value
  )
  return 'none'
}

function setAttributeIfChanged(
  element: Element,
  name: string,
  value: string | undefined
): void {
  if (value === undefined) {
    if (element.hasAttribute(name)) element.removeAttribute(name)
    return
  }
  if (element.getAttribute(name) !== value) element.setAttribute(name, value)
}

export class ShapeComponent
  implements CloneableComponent<ShapeProps>, Shape
{
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: ShapeProps
  public mounted = false
  public cleanup: (() => void)[] = []

  private styling: ShapeStyling = {
    fill: undefined,
    stroke: undefined,
    lineWidth: 1,
    insets: [],
    strokeInside: false,
  }

  // Named to stay clear of the `frame` modifier. A *private* member whose
  // name collides with a public one on the intersected modifier surface
  // reduces the whole intersection to `never`, which nothing inside this
  // package would notice — only a typed consumer, for whom `Circle()` then
  // has no usable type at all. `Circle.test-d.ts` pins it.
  private readonly measuredFrame: Signal<ShapeRect>
  private readonly setMeasuredFrame: (rect: ShapeRect) => void
  private svg: SVGSVGElement | undefined
  private pathElement: SVGPathElement | undefined
  private observer: ResizeObserver | undefined
  private measurePending = false
  /**
   * Whether a real measurement has landed for the element as currently
   * mounted. Cleared on teardown, because the frame kept from the last mount
   * is no evidence about the new host's size.
   */
  private hasMeasured = false

  constructor(
    public readonly shape: Shape,
    public readonly kind: string,
    props: ShapeProps = {}
  ) {
    this.props = props
    this.id = `shape-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const [frame, setFrame] = createSignal<ShapeRect>(EMPTY_RECT)
    this.measuredFrame = frame
    this.setMeasuredFrame = setFrame
  }

  // ---- Shape-only methods -------------------------------------------------
  //
  // These are methods on the instance, not modifiers, as `fill`/`stroke` live
  // on SwiftUI's `Shape` rather than on `View`. The component proxy resolves a
  // name that is not a modifier to the instance's own method, so they chain
  // with modifiers in either order.
  //
  // The proxy resolves a *modifier* of the same name first, so registering a
  // `fill`, `stroke`, `strokeBorder`, `inset` or `trim` modifier would shadow
  // the method here. None are registered, and these are exactly the names a
  // future SwiftUI-shaped modifier would reach for, so the collision is worth
  // knowing about before adding one.
  //
  // These record styling and are **chain-time only**. `ModifierBuilder.build()`
  // clones the component and renders the clone, so the instance a caller holds
  // is never the one on screen and a call after mount changes nothing visible.
  // `clone()` carries the styling across, which is what makes the chain work at
  // all. Drive anything that changes after mount with a signal instead: every
  // style and length accepts one.

  /** Fill the shape. Without `fill` or `stroke`, a shape fills with `currentColor`. */
  fill(style: ShapeStyle): this {
    this.styling.fill = style
    return this
  }

  /**
   * Stroke the shape's edge with a line `lineWidth` wide, centered on the
   * path, so half of it lies outside the frame as in SwiftUI. Without `fill`
   * the interior is left empty.
   */
  stroke(style: ShapeStyle, lineWidth: ShapeLength = 1): this {
    this.styling.stroke = style
    this.styling.lineWidth = lineWidth
    // A plain stroke is centered on the edge, so it clears any inset a
    // previous `strokeBorder` asked for rather than inheriting it.
    this.styling.strokeInside = false
    return this
  }

  /**
   * Stroke entirely inside the frame: the shape is inset by half the line
   * width first. SwiftUI's `strokeBorder`.
   */
  strokeBorder(style: ShapeStyle, lineWidth: ShapeLength = 1): this {
    this.stroke(style, lineWidth)
    this.styling.strokeInside = true
    return this
  }

  /** Shrink the shape by `by` on every side. Repeated calls accumulate. */
  inset(by: ShapeLength): this {
    this.styling.insets.push(by)
    return this
  }

  // ---- Shape contract -----------------------------------------------------

  /**
   * Path data for this shape drawn in `rect`.
   *
   * This is the path the shape actually draws, so a consumer such as
   * `clipShape` sees the same geometry as the rendered `<path>`. `paint()`
   * routes through here rather than computing its own rect.
   */
  path(rect: ShapeRect): string {
    return this.shape.path(this.drawRect(rect))
  }

  /**
   * The rect the shape draws into: every `.inset()`, plus half the line width
   * when `strokeBorder` asked for the stroke to stay inside the frame.
   */
  private drawRect(rect: ShapeRect): ShapeRect {
    let inset = this.totalInset()
    if (this.styling.stroke !== undefined && this.styling.strokeInside) {
      inset += this.strokeWidth() / 2
    }
    return insetRect(rect, inset)
  }

  /**
   * The line width as drawn, floored at zero.
   *
   * SVG ignores a negative `stroke-width`, so it is floored rather than
   * written out and silently dropped by the renderer. The same floored width
   * is what `strokeBorder`'s inset is taken from: a raw negative one would
   * *outset* the path, pushing the fill outside the frame that
   * `strokeBorder` promises to stay inside, while no stroke is drawn at all.
   */
  private strokeWidth(): number {
    return Math.max(0, resolveLength(this.styling.lineWidth))
  }


  /**
   * The CSS `clip-path` for this shape filling its box.
   *
   * Insets do not apply, unlike `path`, because CSS basic shapes cannot
   * express an inset circle. See `Shape.clipPath` for why, and for the way
   * to add it if a consumer ever needs it.
   */
  clipPath(): string {
    return this.shape.clipPath()
  }

  // ---- Rendering ----------------------------------------------------------

  render(): DOMNode {
    return h(
      'div',
      {
        className: `tachui-shape tachui-shape-${this.kind}`,
        style: {
          display: 'block',
          width: '100%',
          height: '100%',
          minWidth: '0',
          minHeight: '0',
        },
      },
      ...this.contentChildren()
    )
  }

  private contentChildren(): DOMNode[] {
    if (typeof document === 'undefined') return this.shellChildren()

    return [
      {
        type: 'element',
        // The slot's name: stable across renders so the reconciler pairs
        // this node with its predecessor (see `DOMNode.reactiveElement`).
        tag: 'svg',
        props: {},
        children: [],
        reactiveElement: this.contentElement,
        owned: true,
        // Registered by the renderer against the mounted element, so it runs
        // when that element is removed. A stable reference, so re-registering
        // it on every render is a no-op.
        dispose: this.teardown,
      },
    ]
  }

  /**
   * The `<svg>` shell, described rather than built, for the server.
   *
   * There is no DOM to build into and no layout to measure, so the path's `d`
   * is unknowable here — but everything else about the element is known, and
   * emitting it gives the shape its layout box in the very first paint
   * instead of leaving a hole until scripts run. An ordinary node, not an
   * owned one: an owned node's element *is* its markup, so it needs a DOM to
   * serialize, while this shell is fully describable without one.
   *
   * The `<path>` is left bare. Its fill and stroke would resolve server-side,
   * but with no `d` there is nothing for them to paint, so emitting them
   * would run a caller's signals and assets during serialization to no
   * visible end.
   */
  private shellChildren(): DOMNode[] {
    return [
      {
        type: 'element',
        tag: 'svg',
        props: { ...SVG_SHELL_ATTRS, style: { ...SVG_SHELL_STYLE } },
        children: [
          { type: 'element', tag: 'path', props: {}, children: [] },
        ],
      },
    ]
  }

  /**
   * The renderer's subscription. Its reads — the measured frame, insets, line
   * width and colors — are exactly the dependencies a repaint should have,
   * and it always returns the one element it built.
   */
  private readonly contentElement = (): Element => {
    const svg = this.svg ?? this.buildSvg()
    if (!this.observer) this.observe(svg)
    this.scheduleFirstMeasure()
    this.paint()
    return svg
  }

  private readonly teardown = (): void => {
    this.observer?.disconnect()
    this.observer = undefined
    this.measurePending = false
    this.hasMeasured = false
  }

  /**
   * Measure once as soon as the element is in the document.
   *
   * This accessor runs during the render pass, before the renderer inserts
   * the element, so measuring here would read a detached box of zeros. A
   * microtask lands after the synchronous render that mounts it.
   *
   * ResizeObserver's first delivery is also asynchronous, so without this the
   * shape would paint empty once before its real path arrived. It is the only
   * measurement at all where `ResizeObserver` is missing.
   *
   * It runs again for a shape that is unmounted and remounted — through a
   * toggled `Show`, say. The previous frame is kept so the shape repaints
   * with its old path rather than flashing empty, but it does not count as
   * having measured the new host; without `ResizeObserver` there is nothing
   * else to correct it.
   */
  private scheduleFirstMeasure(): void {
    if (this.measurePending || this.hasMeasured) return
    this.measurePending = true
    queueMicrotask(() => {
      if (!this.measurePending) return
      this.measurePending = false
      this.measureFromBox()
    })
  }

  private measureFromBox(): void {
    const svg = this.svg
    if (typeof svg?.getBoundingClientRect !== 'function') return
    const box = svg.getBoundingClientRect()
    // A zero box means the element is not laid out — detached, `display:
    // none`, or an environment that does no layout at all, as jsdom does.
    // That is the absence of a measurement rather than a measurement of
    // zero, so it must not overwrite a size the observer already reported.
    if (box.width <= 0 && box.height <= 0) return
    this.measured(box.width, box.height)
  }

  private buildSvg(): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
    for (const [name, value] of Object.entries(SVG_SHELL_ATTRS)) {
      svg.setAttribute(name, value)
    }
    for (const [name, value] of Object.entries(SVG_SHELL_STYLE)) {
      // Assigned, not `setProperty`: the keys are camelCase because the
      // server description hands them to the serializer, which kebab-cases
      // them. `setProperty` would need kebab-case and silently ignore any
      // key of more than one word.
      ;(svg.style as unknown as Record<string, string>)[name] = value
    }

    const path = document.createElementNS(SVG_NAMESPACE, 'path')
    svg.appendChild(path)

    this.svg = svg
    this.pathElement = path
    return svg
  }

  private observe(svg: SVGSVGElement): void {
    if (typeof ResizeObserver === 'undefined') return

    const observer = new ResizeObserver(entries => {
      const entry = entries[entries.length - 1]
      if (!entry) return
      this.measured(entry.contentRect.width, entry.contentRect.height)
    })
    observer.observe(svg)
    this.observer = observer
  }

  private measured(width: number, height: number): void {
    this.hasMeasured = true
    const current = this.measuredFrame()
    if (current.width === width && current.height === height) return
    this.setMeasuredFrame({ x: 0, y: 0, width, height })
  }

  private totalInset(): number {
    let total = 0
    for (const inset of this.styling.insets) total += resolveLength(inset)
    return total
  }

  private paint(): void {
    const path = this.pathElement
    if (!path) return

    const { fill, stroke } = this.styling
    const lineWidth = this.strokeWidth()
    const strokeValue = stroke === undefined ? undefined : resolveStyle(stroke)
    const fillValue = fill === undefined ? undefined : resolveStyle(fill)

    // Through `path()`, so the geometry drawn here and the geometry a `Shape`
    // consumer reads are the same by construction.
    const frame = this.measuredFrame()
    setAttributeIfChanged(
      path,
      'd',
      frame.width > 0 && frame.height > 0 ? this.path(frame) : ''
    )
    setAttributeIfChanged(
      path,
      'fill',
      fillValue ?? (strokeValue === undefined ? 'currentColor' : 'none')
    )
    setAttributeIfChanged(path, 'stroke', strokeValue)
    setAttributeIfChanged(
      path,
      'stroke-width',
      strokeValue === undefined ? undefined : formatLength(lineWidth)
    )
  }

  // ---- Lifecycle ----------------------------------------------------------

  dispose(): void {
    this.teardown()
    for (const fn of this.cleanup) {
      try {
        fn()
      } catch (error) {
        console.error('Shape component cleanup error:', error)
      }
    }
    this.cleanup = []
  }

  clone(options: CloneOptions = {}): this {
    return options.deep ? this.deepClone() : this.shallowClone()
  }

  shallowClone(): this {
    return this.cloneWith(clonePropsPreservingReactivity(this.props))
  }

  deepClone(): this {
    return this.cloneWith(
      clonePropsPreservingReactivity(this.props, { deep: true })
    )
  }

  /** The clone carries the shape's styling; the element and observer are not shared. */
  private cloneWith(props: ShapeProps): this {
    const clone = new ShapeComponent(this.shape, this.kind, props)
    clone.styling = { ...this.styling, insets: [...this.styling.insets] }
    resetLifecycleState(clone)
    return clone as this
  }
}

/** Chainable shape methods, which hand back the wrapper so modifiers follow. */
const CHAINABLE_SHAPE_METHODS = [
  'fill',
  'stroke',
  'strokeBorder',
  'inset',
] as const

/** Shape methods that return a value rather than the shape. */
const SHAPE_CONTRACT_METHODS = ['path', 'clipPath'] as const

/**
 * Wrap a shape in the modifier chain.
 *
 * Under the default component proxy the instance's own methods resolve
 * through it, so nothing more is needed. With `proxyModifiers: false`
 * `withModifiers` returns a plain wrapper that carries neither the modifier
 * chain nor the prototype, which for an ordinary component only costs the
 * chainable modifier form — `.modifier.frame()` still works. A shape has no
 * such fallback, because `fill` and `stroke` are not modifiers and exist
 * nowhere else, so the methods are forwarded onto the wrapper explicitly.
 */
export function createShape(shape: Shape, kind: string): ShapeInstance {
  const component = new ShapeComponent(shape, kind)
  const wrapper = withModifiers(component) as unknown as ShapeInstance

  if (typeof (wrapper as { fill?: unknown }).fill === 'function') {
    return wrapper
  }

  for (const name of CHAINABLE_SHAPE_METHODS) {
    Object.defineProperty(wrapper, name, {
      configurable: true,
      enumerable: false,
      value: (...args: unknown[]) => {
        ;(component[name] as (...a: unknown[]) => unknown)(...args)
        return wrapper
      },
    })
  }

  for (const name of SHAPE_CONTRACT_METHODS) {
    Object.defineProperty(wrapper, name, {
      configurable: true,
      enumerable: false,
      value: (...args: unknown[]) =>
        (component[name] as (...a: unknown[]) => unknown)(...args),
    })
  }

  return wrapper
}
