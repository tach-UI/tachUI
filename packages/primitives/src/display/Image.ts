/**
 * Enhanced Image Component (Phase 5.4)
 *
 * SwiftUI-inspired Image component with loading states, error handling,
 * responsive sizing, and advanced image handling capabilities.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { createEffect, createSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import { ImageAsset } from '@tachui/core'
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

/**
 * Image component properties with element override support and CSS classes
 */
export interface ImageProps
  extends ComponentProps,
    ElementOverrideProps,
    CSSClassesProps {
  // Source
  src?: string | Signal<string> | ImageAsset
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

    // Create loading state signal
    const initialState: ImageLoadingState = this.props.src ? 'idle' : 'error'
    const [loadingStateSignal, setLoadingState] =
      createSignal<ImageLoadingState>(initialState)
    this.loadingStateSignal = loadingStateSignal
    this.setLoadingState = setLoadingState

    // ENHANCED: Set up lifecycle hooks for reliable DOM access
    useLifecycle(this, {
      onDOMReady: (_elements, primaryElement) => {
        // Set up ImageAsset reactivity when DOM is ready
        if (
          this.props.src instanceof ImageAsset &&
          primaryElement instanceof HTMLImageElement
        ) {
          this.setupImageAssetReactivityForDOMElement(
            this.props.src,
            primaryElement
          )
        }
      },
    })

    // Register this component for lifecycle processing
    registerComponentWithLifecycleHooks(this)
  }

  /**
   * Render the image component with reactive content handling
   */
  render() {
    // Use reactive loading state
    const loadingState = this.loadingStateSignal()

    // Handle different loading states
    if (loadingState === 'loading' && this.props.placeholder) {
      if (typeof this.props.placeholder === 'string') {
        // Show placeholder image
        const placeholderElement = h('img', {
          class: 'tachui-image-placeholder',
          src: this.props.placeholder,
          alt: 'Loading...',
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
        })
        return [errorElement]
      } else if (
        this.props.errorPlaceholder &&
        typeof this.props.errorPlaceholder === 'object'
      ) {
        return this.props.errorPlaceholder.render()
      }
    }

    // Resolve ImageAsset to initial src value, reactive updates handled separately
    const initialSrc =
      this.props.src instanceof ImageAsset
        ? this.props.src.resolve()
        : this.props.src

    // Process CSS classes for this component
    const baseClasses = ['tachui-image']
    const classString = this.createClassString(this.props, baseClasses)

    // Create main image element - pass reactive props directly to DOM renderer
    const element = h(this.effectiveTag, {
      className: classString,
      src: initialSrc, // Pass resolved src for initial render
      alt: this.props.alt, // Pass reactive alt directly
      loading: this.props.loadingStrategy || 'lazy',
      crossorigin: this.props.crossOrigin,
      decoding: this.props.decoding || 'async',
      fetchpriority: this.props.fetchPriority,
    })

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
    imageAsset: ImageAsset,
    domElement: HTMLImageElement
  ): void {
    // Create the reactive effect that watches for theme changes
    // ImageAsset.resolve() now internally calls getThemeSignal() which establishes the reactive dependency
    const effect = createEffect(() => {
      const resolvedSrc = imageAsset.resolve() // This will track the theme signal reactively

      // Direct DOM element access - no need for fallbacks since we have the real element
      domElement.src = resolvedSrc
      this.setLoadingStateWithCallback('loading')
    })

    // Add cleanup
    this.cleanup.push(() => effect.dispose())
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
export interface ImageWithShorthands extends ModifiableComponent<ImageProps> {
  modifier: ModifierBuilder<ModifiableComponent<ImageProps>>
  scaledToFit(): ImageWithShorthands
  scaledToFill(): ImageWithShorthands
}

export function Image(
  src: string | Signal<string> | ImageAsset,
  props: Omit<ImageProps, 'src'> = {}
): ImageWithShorthands {
  const imageProps: ImageProps = { ...props, src }
  const component = new EnhancedImage(imageProps)
  const modifiableComponent = withModifiers(component) as any

  // Add SwiftUI-style shorthands for aspect ratio
  modifiableComponent.scaledToFit = function (): ImageWithShorthands {
    // Create a new Image component with the same props but with aspectRatio modifier applied
    const newComponent = new EnhancedImage({
      ...imageProps,
      aspectRatio: undefined,
      contentMode: 'fit',
    })
    const newModifiableComponent = withModifiers(newComponent) as any

    // Add the shorthand methods to the new component
    newModifiableComponent.scaledToFit = modifiableComponent.scaledToFit
    newModifiableComponent.scaledToFill = modifiableComponent.scaledToFill

    // Apply aspectRatio modifier using the real implementation from @tachui/modifiers
    newModifiableComponent.modifiers.push(aspectRatio(undefined, 'fit'))

    return newModifiableComponent
  }

  modifiableComponent.scaledToFill = function (): ImageWithShorthands {
    // Create a new Image component with the same props but with aspectRatio modifier applied
    const newComponent = new EnhancedImage({
      ...imageProps,
      aspectRatio: undefined,
      contentMode: 'fill',
    })
    const newModifiableComponent = withModifiers(newComponent) as any

    // Add the shorthand methods to the new component
    newModifiableComponent.scaledToFit = modifiableComponent.scaledToFit
    newModifiableComponent.scaledToFill = modifiableComponent.scaledToFill

    // Apply aspectRatio modifier using the real implementation from @tachui/modifiers
    newModifiableComponent.modifiers.push(aspectRatio(undefined, 'fill'))

    return newModifiableComponent
  }

  return modifiableComponent
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
