/**
 * Enhanced Image Component (Phase 5.4)
 *
 * SwiftUI-inspired Image component with loading states, error handling,
 * responsive sizing, and advanced image handling capabilities.
 */

import type {
  ModifiableComponent,
  ModifierBuilder,
  ModifiableComponentWithModifiers,
} from '@tachui/core'
import { createEffect, createSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { isSignal, isComputed } from '@tachui/core/reactive'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import { ImageAsset } from '@tachui/core'
import type { ImageAssetProxy } from '@tachui/core/assets'
import { sanitizeSVG } from '@tachui/core'
// import { getThemeSignal } from '@tachui/core'
import { useLifecycle } from '@tachui/core'
import { registerComponentWithLifecycleHooks } from '@tachui/core'
import type {
  Concatenatable,
  ComponentSegment,
  ConcatenationMetadata,
} from '@tachui/core'
import { ConcatenatedComponent } from '@tachui/core'
import { processElementOverride, type ElementOverrideProps } from '@tachui/core'
import { ComponentWithCSSClasses, type CSSClassesProps } from '@tachui/core'
import { aspectRatio } from '@tachui/modifiers'

type ImageAssetLike = ImageAsset | ImageAssetProxy
type ImageSource = string | Signal<string> | ImageAssetLike
type ImageRenderingMode = 'original' | 'template'

const svgTemplateCache = new Map<string, string>()
const svgTemplateInFlight = new Map<string, Promise<string>>()

/**
 * Image loading state
 */
export type ImageLoadingState = 'idle' | 'loading' | 'loaded' | 'error'

/**
 * Image content mode (how image fits within bounds)
 */
export type ImageContentMode =
  | 'fit' // Aspect fit - scale to fit while maintaining aspect ratio
  | 'fill' // Aspect fill - scale to fill while maintaining aspect ratio
  | 'stretch' // Fill bounds exactly, may distort aspect ratio
  | 'center' // Center image without scaling
  | 'scaleDown' // Scale down if needed, never scale up

/**
 * Image resize mode for different screen densities
 */
export type ImageResizeMode = 'cover' | 'contain' | 'fill' | 'none'

/**
 * Image loading strategy
 */
export type ImageLoadingStrategy = 'eager' | 'lazy'

function isImageAssetLike(value: unknown): value is ImageAssetLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).resolve === 'function'
  )
}

function resolveImageAssetSource(
  source: ImageSource | undefined
): string | Signal<string> | undefined {
  if (!source) return source
  if (isImageAssetLike(source)) {
    return source.resolve()
  }
  return source
}

function resolveMaybeSignal<T>(value: T | Signal<T> | undefined): T | undefined {
  if (value === undefined) return undefined
  if (isSignal(value) || isComputed(value)) {
    return value()
  }
  return value
}

function resolveImageSourceValue(source: ImageSource | undefined): string | undefined {
  if (!source) return undefined
  if (isImageAssetLike(source)) return source.resolve()
  if (isSignal(source) || isComputed(source)) return source()
  return source
}

function warnTemplateUnsupportedProps(props: ImageProps): void {
  if (process.env.NODE_ENV === 'production') return

  const unsupported: string[] = []
  if (props.loadingStrategy !== undefined) unsupported.push('loadingStrategy')
  if (props.decoding !== undefined) unsupported.push('decoding')
  if (props.fetchPriority !== undefined) unsupported.push('fetchPriority')
  if (props.crossOrigin !== undefined) unsupported.push('crossOrigin')
  if (props.contentMode !== undefined) unsupported.push('contentMode')
  if (props.resizeMode !== undefined) unsupported.push('resizeMode')

  if (unsupported.length > 0) {
    console.warn(
      `Image(template): unsupported props ignored: ${unsupported.join(', ')}`
    )
  }
}

async function loadTemplateSVG(
  url: string,
  customSanitizer?: (markup: string) => string
): Promise<string> {
  if (svgTemplateCache.has(url)) {
    return svgTemplateCache.get(url)!
  }

  if (svgTemplateInFlight.has(url)) {
    return svgTemplateInFlight.get(url)!
  }

  const request = fetch(url)
    .then(async response => {
      if (!response.ok) {
        throw new Error(`Failed to load SVG: ${response.status}`)
      }

      const rawMarkup = await response.text()
      const sanitized = customSanitizer
        ? customSanitizer(rawMarkup)
        : sanitizeSVG(rawMarkup)

      if (!sanitized || !/<svg[\s>]/i.test(sanitized)) {
        throw new Error('Sanitized SVG missing root <svg>')
      }

      svgTemplateCache.set(url, sanitized)
      return sanitized
    })
    .finally(() => {
      svgTemplateInFlight.delete(url)
    })

  svgTemplateInFlight.set(url, request)
  return request
}

/**
 * `object-fit` for each content mode. `stretch` is CSS `fill`, which is the
 * one name the two vocabularies disagree on: SwiftUI's "fill" keeps the
 * aspect ratio and crops, which CSS calls `cover`.
 */
const CONTENT_MODE_OBJECT_FIT: Record<ImageContentMode, string> = {
  fit: 'contain',
  fill: 'cover',
  stretch: 'fill',
  center: 'none',
  scaleDown: 'scale-down',
}

/**
 * Whether these styles ask the element to take a size.
 *
 * A `<span>` is `display: inline`, where `width`, `height` and `aspect-ratio`
 * do nothing at all — so template mode has to make a box of it before a
 * dimension means anything. Only the properties that need a box count:
 * `opacity` and `filter` apply to an inline element as they are.
 */
function needsSizingBox(styles: Record<string, string>): boolean {
  return (
    styles.width !== undefined ||
    styles.height !== undefined ||
    styles.aspectRatio !== undefined
  )
}

/**
 * A CSS length from a dimension prop: a bare number is pixels, a string is
 * whatever the caller wrote — `100%`, `12rem`, `calc(...)`.
 */
function toCssLength(value: number | string | undefined): string | undefined {
  if (value === undefined) return undefined
  return typeof value === 'number' ? `${value}px` : value
}

export interface ImageProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
  // Source
  src?: ImageSource
  renderingMode?: ImageRenderingMode
  decorative?: boolean | Signal<boolean>
  customSanitizer?: (markup: string) => string
  srcSet?: string | Signal<string>
  alt?: string | Signal<string>

  // Dimensions
  width?: number | string | Signal<number | string>
  height?: number | string | Signal<number | string>
  aspectRatio?: number | Signal<number>

  // Content mode
  contentMode?: ImageContentMode
  resizeMode?: ImageResizeMode

  // Loading
  loadingStrategy?: ImageLoadingStrategy
  placeholder?: string | ComponentInstance // URL or component to show while loading
  errorPlaceholder?: string | ComponentInstance // URL or component to show on error

  // State management
  loadingState?: Signal<ImageLoadingState>
  onLoadingStateChange?: (state: ImageLoadingState) => void

  // Events
  onLoad?: (event: Event) => void
  onError?: (event: Event) => void
  onLoadStart?: () => void

  // Performance
  crossOrigin?: 'anonymous' | 'use-credentials'
  decoding?: 'sync' | 'async' | 'auto'
  fetchPriority?: 'high' | 'low' | 'auto'

  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: string

  // Advanced
  blur?: number | Signal<number>
  opacity?: number | Signal<number>
  grayscale?: boolean | Signal<boolean>
  sepia?: boolean | Signal<boolean>

  // Progressive loading
  lowQualitySrc?: string // Low quality placeholder for progressive loading
  highQualitySrc?: string // High quality version
}

/**
 * Enhanced Image component class with element override support and CSS classes
 */
export class EnhancedImage
  extends ComponentWithCSSClasses
  implements ComponentInstance<ImageProps>, Concatenatable<ImageProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  private effectiveTag: string
  private validationResult: any

  // Reactive state for loading
  private loadingStateSignal: () => ImageLoadingState
  private setLoadingState: (state: ImageLoadingState) => void

  /**
   * Set loading state and notify callback
   */
  private setLoadingStateWithCallback(state: ImageLoadingState): void {
    if (this.props.loadingState) {
      return
    }

    this.setLoadingState(state)

    if (this.props.onLoadingStateChange) {
      this.props.onLoadingStateChange(state)
    }
  }

  constructor(public props: ImageProps) {
    super()
    this.id = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Process element override for tag specification enhancement
    // Note: Image components overriding to non-img tags may break functionality
    const override = processElementOverride('Image', 'img', this.props.element)
    this.effectiveTag = override.tag
    this.validationResult = override.validation

    // Create loading state signal (or honor external state signal override)
    if (this.props.loadingState) {
      this.loadingStateSignal = this.props.loadingState
      this.setLoadingState = (_state: ImageLoadingState) => {}
    } else {
      const initialState: ImageLoadingState = this.props.src ? 'idle' : 'error'
      const [loadingStateSignal, setLoadingState] =
        createSignal<ImageLoadingState>(initialState)
      this.loadingStateSignal = loadingStateSignal
      this.setLoadingState = setLoadingState
    }

    // ENHANCED: Set up lifecycle hooks for reliable DOM access
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        const renderingMode = this.props.renderingMode ?? 'original'
        if (
          renderingMode === 'template' &&
          primaryElement instanceof HTMLSpanElement
        ) {
          this.setupTemplateModeReactivityForDOMElement(primaryElement)
          return
        }

        if (renderingMode === 'template') {
          if (process.env.NODE_ENV !== 'production') {
            console.warn(
              'Image(template): expected HTMLSpanElement primary element; skipping mismatched lifecycle binding.'
            )
          }
          this.setLoadingStateWithCallback('error')
          this.props.onError?.(new Event('error'))
          return
        }

        if (primaryElement instanceof HTMLImageElement) {
          this.setupLoadingStateReactivityForDOMElement(primaryElement)
        }
      },
    })

    // Register this component for lifecycle processing
    registerComponentWithLifecycleHooks(this)
  }

  /**
   * The styles the declared props ask for.
   *
   * Written as a style prop rather than `width`/`height` attributes, because
   * the props are typed to take a CSS length — `100%` is as valid as `246` —
   * and an attribute takes only a bare pixel count. A modifier writing the
   * same property wins, which is the precedence `.css()` already has over a
   * component's own styles.
   */
  private getDeclaredStyles(): Record<string, string> {
    const styles: Record<string, string> = {}

    const width = toCssLength(resolveMaybeSignal(this.props.width))
    if (width !== undefined) styles.width = width

    const height = toCssLength(resolveMaybeSignal(this.props.height))
    if (height !== undefined) styles.height = height

    const aspectRatio = resolveMaybeSignal(this.props.aspectRatio)
    if (aspectRatio !== undefined) styles.aspectRatio = String(aspectRatio)

    const opacity = resolveMaybeSignal(this.props.opacity)
    if (opacity !== undefined) styles.opacity = String(opacity)

    const filter = this.getFilter()
    if (filter !== undefined) styles.filter = filter

    return styles
  }

  /**
   * How the image sits in the box it was given. `resizeMode` is named for the
   * CSS values themselves, so where both are set it is the more specific of
   * the two and wins.
   */
  private getObjectFit(): string | undefined {
    const { contentMode, resizeMode } = this.props

    if (resizeMode !== undefined) return resizeMode
    if (contentMode !== undefined) return CONTENT_MODE_OBJECT_FIT[contentMode]
    return undefined
  }

  private getFilter(): string | undefined {
    const filters: string[] = []

    const blur = resolveMaybeSignal(this.props.blur)
    if (blur !== undefined) filters.push(`blur(${blur}px)`)

    if (resolveMaybeSignal(this.props.grayscale)) filters.push('grayscale(1)')
    if (resolveMaybeSignal(this.props.sepia)) filters.push('sepia(1)')

    return filters.length > 0 ? filters.join(' ') : undefined
  }

  /**
   * Render the image component with reactive content handling
   */
  render() {
    // Use reactive loading state
    const loadingState = this.loadingStateSignal()

    // Worked out before the loading-state branches, because a placeholder
    // standing in for the image should stand in at its size: sizing only the
    // final image makes the box jump the moment it loads, and leaves an error
    // placeholder unsized for good.
    const declaredStyles = this.getDeclaredStyles()
    const objectFit = this.getObjectFit()
    const imageStyles = objectFit
      ? { ...declaredStyles, objectFit }
      : declaredStyles

    // Handle different loading states
    if (loadingState === 'loading' && this.props.placeholder) {
      if (typeof this.props.placeholder === 'string') {
        // Show placeholder image
        const placeholderElement = h('img', {
          class: 'tachui-image-placeholder',
          src: this.props.placeholder,
          alt: 'Loading...',
          style: imageStyles,
        })
        return [placeholderElement]
      } else if (
        this.props.placeholder &&
        typeof this.props.placeholder === 'object'
      ) {
        // Show placeholder component
        return this.props.placeholder.render()
      }
    }

    if (loadingState === 'error' && this.props.errorPlaceholder) {
      if (typeof this.props.errorPlaceholder === 'string') {
        const errorElement = h('img', {
          class: 'tachui-image-error',
          src: this.props.errorPlaceholder,
          alt: 'Error loading image',
          style: imageStyles,
        })
        return [errorElement]
      } else if (
        this.props.errorPlaceholder &&
        typeof this.props.errorPlaceholder === 'object'
      ) {
        return this.props.errorPlaceholder.render()
      }
    }

    // Process CSS classes for this component
    const baseClasses = ['tachui-image']
    const classString = this.createClassString(this.props, baseClasses)

    const renderingMode = this.props.renderingMode ?? 'original'
    let element

    if (renderingMode === 'template') {
      warnTemplateUnsupportedProps(this.props)

      const resolvedAlt = resolveMaybeSignal(this.props.alt)
      const isDecorative = Boolean(resolveMaybeSignal(this.props.decorative)) || resolvedAlt === ''

      // `object-fit` is left to the image branch: template mode paints an
      // inline SVG into the span, where there is no replaced content for it to
      // act on, and `warnTemplateUnsupportedProps` already says as much.
      element = h('span', {
        // Built through `createClassString` rather than interpolated, so a
        // reactive `css` prop stays a computed instead of being flattened into
        // the text of its own accessor.
        className: this.createClassString(this.props, [
          ...baseClasses,
          'tachui-image-template',
        ]),
        style: needsSizingBox(declaredStyles)
          ? { display: 'inline-block', ...declaredStyles }
          : declaredStyles,
        role: 'img',
        ...(isDecorative
          ? { 'aria-hidden': 'true' }
          : { 'aria-label': resolvedAlt || this.props.accessibilityLabel || 'Image' }),
      })
    } else {
      // Resolve ImageAsset to initial src value, reactive updates handled separately
      const initialSrc = resolveImageAssetSource(this.props.src)

      // Create main image element - pass reactive props directly to DOM renderer
      element = h(this.effectiveTag, {
        className: classString,
        style: imageStyles,
        src: initialSrc, // Pass resolved src for initial render
        alt: this.props.alt, // Pass reactive alt directly
        loading: this.props.loadingStrategy || 'lazy',
        crossorigin: this.props.crossOrigin,
        decoding: this.props.decoding || 'async',
        fetchpriority: this.props.fetchPriority,
      })
    }

    // Add component metadata for semantic role processing
    ;(element as any).componentMetadata = {
      id: this.id,
      type: 'Image',
      originalType: 'Image',
      overriddenTo: this.effectiveTag !== 'img' ? this.effectiveTag : undefined,
      validationResult: this.validationResult,
    }

    return [element]
  }

  /**
   * Set up ImageAsset reactivity for a real DOM element (called from onDOMReady)
   */
  private setupImageAssetReactivityForDOMElement(
    imageAsset: ImageAssetLike,
    domElement: HTMLImageElement
  ): void {
    // Create the reactive effect that watches for theme changes
    // ImageAsset.resolve() now internally calls getThemeSignal() which establishes the reactive dependency
    const effect = createEffect(() => {
      const resolvedSrc = imageAsset.resolve() // This will track the theme signal reactively

      // Direct DOM element access - no need for fallbacks since we have the real element
      this.props.onLoadStart?.()
      this.setLoadingStateWithCallback('loading')
      domElement.src = resolvedSrc
    })

    // Add cleanup
    this.cleanup.push(() => effect.dispose())
  }

  private setupTemplateModeReactivityForDOMElement(
    domElement: HTMLSpanElement
  ): void {
    let activeRequestId = 0

    const accessibilityEffect = createEffect(() => {
      const alt = resolveMaybeSignal(this.props.alt) ?? this.props.accessibilityLabel
      const isDecorative =
        Boolean(resolveMaybeSignal(this.props.decorative)) || alt === ''

      domElement.setAttribute('role', 'img')

      if (isDecorative) {
        domElement.setAttribute('aria-hidden', 'true')
        domElement.removeAttribute('aria-label')
      } else {
        domElement.removeAttribute('aria-hidden')
        domElement.setAttribute('aria-label', alt || 'Image')
      }
    })
    this.cleanup.push(() => accessibilityEffect.dispose())

    const effect = createEffect(() => {
      const src = resolveImageSourceValue(this.props.src)
      const requestId = ++activeRequestId

      if (!src) {
        domElement.innerHTML = ''
        this.setLoadingStateWithCallback('error')
        this.props.onError?.(new Event('error'))
        return
      }

      this.props.onLoadStart?.()
      this.setLoadingStateWithCallback('loading')

      loadTemplateSVG(src, this.props.customSanitizer)
        .then(markup => {
          if (requestId !== activeRequestId) {
            return
          }

          domElement.innerHTML = markup
          const svg = domElement.querySelector('svg')
          if (!(svg instanceof SVGElement)) {
            throw new Error('No <svg> root after template injection')
          }

          svg.setAttribute('aria-hidden', 'true')
          svg.setAttribute('focusable', 'false')
          svg.setAttribute('width', '100%')
          svg.setAttribute('height', '100%')

          this.setLoadingStateWithCallback('loaded')
          this.props.onLoad?.(new Event('load'))
        })
        .catch((_error: unknown) => {
          if (requestId !== activeRequestId) {
            return
          }
          this.setLoadingStateWithCallback('error')
          this.props.onError?.(new Event('error'))
        })
    })

    this.cleanup.push(() => {
      effect.dispose()
      activeRequestId = Number.POSITIVE_INFINITY
    })
  }

  private setupLoadingStateReactivityForDOMElement(
    domElement: HTMLImageElement
  ): void {
    const onLoad = (event: Event): void => {
      this.setLoadingStateWithCallback('loaded')
      this.props.onLoad?.(event)
    }

    const onError = (event: Event): void => {
      this.setLoadingStateWithCallback('error')
      this.props.onError?.(event)
    }

    domElement.addEventListener('load', onLoad)
    domElement.addEventListener('error', onError)
    this.cleanup.push(() => {
      domElement.removeEventListener('load', onLoad)
      domElement.removeEventListener('error', onError)
    })

    const updateSource = (nextSrc: string | undefined): void => {
      if (!nextSrc) {
        domElement.src = ''
        this.setLoadingStateWithCallback('error')
        return
      }

      this.props.onLoadStart?.()
      this.setLoadingStateWithCallback('loading')
      domElement.src = nextSrc
    }

    if (isImageAssetLike(this.props.src)) {
      this.setupImageAssetReactivityForDOMElement(this.props.src, domElement)
      return
    }

    const reactiveSrc = this.props.src
    if (isSignal(reactiveSrc) || isComputed(reactiveSrc)) {
      const effect = createEffect(() => {
        updateSource(reactiveSrc())
      })
      this.cleanup.push(() => effect.dispose())
      return
    }

    updateSource(
      typeof this.props.src === 'string' ? this.props.src : undefined
    )
  }

  // ============================================================================
  // Concatenation Support (Phase 3.1)
  // ============================================================================

  /**
   * Concatenate this image with another concatenatable component
   */
  concat<U extends Concatenatable<any>>(
    other: U
  ): ConcatenatedComponent<ImageProps | U> {
    const thisSegment = this.toSegment()
    const otherSegment = other.toSegment()

    const metadata: ConcatenationMetadata = {
      totalSegments:
        other instanceof ConcatenatedComponent ? other.segments.length + 1 : 2,
      accessibilityRole:
        other instanceof ConcatenatedComponent
          ? this.mergeAccessibilityRoles(
              'group',
              other.metadata.accessibilityRole
            )
          : this.determineAccessibilityRole(other),
      semanticStructure: 'inline', // Images are typically inline in concatenation
    }

    return new ConcatenatedComponent([thisSegment, otherSegment], metadata)
  }

  /**
   * Convert this image to a segment for concatenation
   */
  toSegment(): ComponentSegment {
    return {
      id: this.id,
      component: this,
      modifiers: [], // Images don't typically have concatenation-specific modifiers
      render: () => {
        const rendered = this.render()
        return Array.isArray(rendered) ? rendered[0] : rendered
      },
    }
  }

  /**
   * Check if this component supports concatenation
   */
  isConcatenatable(): boolean {
    return true
  }

  /**
   * Determine accessibility role for concatenation
   */
  private determineAccessibilityRole(
    other: Concatenatable
  ): 'text' | 'group' | 'composite' {
    const componentType = (other as any).constructor.name

    switch (componentType) {
      case 'EnhancedText':
        return 'group' // Image + Text = group
      case 'EnhancedImage':
        return 'group' // Image + Image = group
      case 'EnhancedButton':
      case 'EnhancedLink':
        return 'composite' // Image + Interactive = composite
      default:
        return 'composite'
    }
  }

  /**
   * Merge accessibility roles when combining components
   */
  private mergeAccessibilityRoles(
    thisRole: 'text' | 'group' | 'composite',
    existingRole: 'text' | 'group' | 'composite'
  ): 'text' | 'group' | 'composite' {
    // Images always contribute as 'group', so combining with anything results in group or higher
    if (thisRole === 'composite' || existingRole === 'composite')
      return 'composite'
    return 'group'
  }
}

/**
 * Create enhanced Image component with modifier support and SwiftUI-style shorthands
 *
 * @example
 * ```typescript
 * // Using aspectRatio modifier
 * Image('photo.jpg')
 *   .aspectRatio(16/9, 'fit')
 *
 * // Using SwiftUI-style shorthands
 * Image('photo.jpg')
 *   .scaledToFit()  // Same as aspectRatio(undefined, 'fit')
 *
 * Image('photo.jpg')
 *   .scaledToFill() // Same as aspectRatio(undefined, 'fill')
 * ```
 */
/**
 * Extended Image component interface with SwiftUI-style shorthands
 */
export interface ImageWithShorthands
  extends ModifiableComponentWithModifiers<ImageProps> {
  scaledToFit(): ImageWithShorthands
  scaledToFill(): ImageWithShorthands
}

export function Image(
  src: ImageSource,
  props: Omit<ImageProps, 'src'> = {}
): ImageWithShorthands {
  const imageProps: ImageProps = { ...props, src }
  const component = new EnhancedImage(imageProps)
  const modifiableComponent = withModifiers(component) as any

  const resolveShorthandTarget = (candidate: any): any => {
    if (candidate && Array.isArray(candidate.modifiers)) {
      return candidate
    }
    if (
      candidate?._modifiableComponent &&
      Array.isArray(candidate._modifiableComponent.modifiers)
    ) {
      return candidate._modifiableComponent
    }
    if (Array.isArray(modifiableComponent?.modifiers)) {
      return modifiableComponent
    }
    if (
      modifiableComponent?._modifiableComponent &&
      Array.isArray(modifiableComponent._modifiableComponent.modifiers)
    ) {
      return modifiableComponent._modifiableComponent
    }
    throw new Error('Image shorthand target is not modifiable')
  }

  // Add SwiftUI-style shorthands for aspect ratio.
  // Important: mutate current modifier chain so call order is preserved.
  modifiableComponent.scaledToFit = function (): ImageWithShorthands {
    const target = resolveShorthandTarget(this)
    target.modifiers.push(aspectRatio(undefined, 'fit'))
    return modifiableComponent
  }

  modifiableComponent.scaledToFill = function (): ImageWithShorthands {
    const target = resolveShorthandTarget(this)
    target.modifiers.push(aspectRatio(undefined, 'fill'))
    return modifiableComponent
  }

  return modifiableComponent
}

export function __resetImageTemplateCacheForTests(): void {
  svgTemplateCache.clear()
  svgTemplateInFlight.clear()
}

/**
 * Image loading states for external use
 */
export const ImageStates = {
  idle: 'idle' as const,
  loading: 'loading' as const,
  loaded: 'loaded' as const,
  error: 'error' as const,
}

/**
 * Image content modes for external use
 */
export const ImageContentModes = {
  fit: 'fit' as const,
  fill: 'fill' as const,
  stretch: 'stretch' as const,
  center: 'center' as const,
  scaleDown: 'scaleDown' as const,
}

/**
 * Image utility functions
 *
 * These utilities work seamlessly with the new scaledTo* shorthands:
 *
 * @example
 * ```typescript
 * // Combine utilities with shorthands
 * ImageUtils.responsive([...])
 *   .scaledToFit()
 *   .frame(200, 200)
 * ```
 */
export const ImageUtils = {
  /**
   * Create a responsive image with multiple sources
   */
  responsive(
    sources: { src: string; width?: number; media?: string }[],
    fallbackSrc: string,
    props: Omit<ImageProps, 'src' | 'srcSet'> = {}
  ): ModifiableComponent<ImageProps> & {
    modifier: ModifierBuilder<ModifiableComponent<ImageProps>>
  } {
    const srcSet = sources
      .map(source => {
        const parts = [source.src]
        if (source.width) parts.push(`${source.width}w`)
        return parts.join(' ')
      })
      .join(', ')

    return Image(fallbackSrc, { ...props, srcSet })
  },

  /**
   * Create an image with progressive loading
   */
  progressive(
    lowQualitySrc: string,
    highQualitySrc: string,
    props: Omit<ImageProps, 'src' | 'lowQualitySrc' | 'highQualitySrc'> = {}
  ): ModifiableComponent<ImageProps> & {
    modifier: ModifierBuilder<ModifiableComponent<ImageProps>>
  } {
    return Image(lowQualitySrc, {
      ...props,
      lowQualitySrc,
      highQualitySrc,
    })
  },

  /**
   * Create an image with loading placeholder
   */
  withPlaceholder(
    src: string | Signal<string>,
    placeholderSrc: string,
    props: Omit<ImageProps, 'src' | 'placeholder'> = {}
  ): ModifiableComponent<ImageProps> & {
    modifier: ModifierBuilder<ModifiableComponent<ImageProps>>
  } {
    return Image(src, {
      ...props,
      placeholder: placeholderSrc,
    })
  },
}
