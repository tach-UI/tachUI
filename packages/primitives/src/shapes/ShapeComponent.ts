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
 * element. The wrapper also serializes server-side; the svg is drawn on
 * hydration, since there is no DOM to build it into and no size to measure.
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
import { insetRect } from './geometry'

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

function resolveLength(value: ShapeLength): number {
  return isSignal(value) ? value() : value
}

function resolveStyle(style: ShapeStyle): string {
  const value = isSignal(style) ? style() : style
  if (typeof value === 'string') return value
  const asset = value as { resolve?: () => string; value?: unknown }
  if (typeof asset.resolve === 'function') return asset.resolve()
  if (typeof asset.value === 'string') return asset.value
  return String(value)
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

  private readonly frame: Signal<ShapeRect>
  private readonly setFrame: (rect: ShapeRect) => void
  private svg: SVGSVGElement | undefined
  private pathElement: SVGPathElement | undefined
  private observer: ResizeObserver | undefined

  constructor(
    public readonly shape: Shape,
    public readonly kind: string,
    props: ShapeProps = {}
  ) {
    this.props = props
    this.id = `shape-${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
    const [frame, setFrame] = createSignal<ShapeRect>(EMPTY_RECT)
    this.frame = frame
    this.setFrame = setFrame
  }

  // ---- Shape-only methods -------------------------------------------------
  //
  // These are methods on the instance, not modifiers, as `fill`/`stroke` live
  // on SwiftUI's `Shape` rather than on `View`. The component proxy resolves a
  // name that is not a modifier to the instance's own method, so they chain
  // with modifiers in either order.

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
    return this
  }

  /**
   * Stroke entirely inside the frame: the shape is inset by half the line
   * width first. SwiftUI's `strokeBorder`.
   */
  strokeBorder(style: ShapeStyle, lineWidth: ShapeLength = 1): this {
    this.styling.strokeInside = true
    return this.stroke(style, lineWidth)
  }

  /** Shrink the shape by `by` on every side. Repeated calls accumulate. */
  inset(by: ShapeLength): this {
    this.styling.insets.push(by)
    return this
  }

  // ---- Shape contract -----------------------------------------------------

  /** Path data for this shape, with its insets applied, drawn in `rect`. */
  path(rect: ShapeRect): string {
    return this.shape.path(insetRect(rect, this.totalInset()))
  }

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
    // No DOM to build into server-side, and nothing to measure: the wrapper
    // serializes alone and the svg is drawn when the component hydrates.
    if (typeof document === 'undefined') return []

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
   * The renderer's subscription. Its reads — the measured frame, insets, line
   * width and colors — are exactly the dependencies a repaint should have,
   * and it always returns the one element it built.
   */
  private readonly contentElement = (): Element => {
    const svg = this.svg ?? this.buildSvg()
    if (!this.observer) this.observe(svg)
    this.paint()
    return svg
  }

  private readonly teardown = (): void => {
    this.observer?.disconnect()
    this.observer = undefined
  }

  private buildSvg(): SVGSVGElement {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg')
    svg.setAttribute('class', 'tachui-shape__svg')
    svg.setAttribute('width', '100%')
    svg.setAttribute('height', '100%')
    // Decorative: the shape carries no meaning of its own.
    svg.setAttribute('aria-hidden', 'true')
    svg.setAttribute('focusable', 'false')
    svg.style.display = 'block'
    // The viewport would otherwise clip the outer half of a centered stroke.
    svg.style.overflow = 'visible'

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
    const current = this.frame()
    if (current.width === width && current.height === height) return
    this.setFrame({ x: 0, y: 0, width, height })
  }

  private totalInset(): number {
    let total = 0
    for (const inset of this.styling.insets) total += resolveLength(inset)
    return total
  }

  private paint(): void {
    const path = this.pathElement
    if (!path) return

    const { fill, stroke, strokeInside } = this.styling
    const lineWidth = resolveLength(this.styling.lineWidth)
    const strokeValue = stroke === undefined ? undefined : resolveStyle(stroke)
    const fillValue = fill === undefined ? undefined : resolveStyle(fill)

    let inset = this.totalInset()
    if (strokeValue !== undefined && strokeInside) inset += lineWidth / 2
    const rect = insetRect(this.frame(), inset)

    setAttributeIfChanged(
      path,
      'd',
      rect.width > 0 && rect.height > 0 ? this.shape.path(rect) : ''
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
      strokeValue === undefined ? undefined : String(lineWidth)
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

/**
 * Wrap a shape in the modifier chain.
 */
export function createShape(shape: Shape, kind: string): ShapeInstance {
  return withModifiers(
    new ShapeComponent(shape, kind)
  ) as unknown as ShapeInstance
}
