import { 
  ComponentInstance, 
  createSignal, 
  createEffect,
  createRoot,
  untrack,
  Signal,
  ModifiableComponent,
  ModifierBuilder,
  withModifiers
} from '@tachui/core'
import {
  getSafeViewBox,
  getSanitizedIconBody,
} from '../utils/sanitize-icon.js'
import type { 
  SymbolProps, 
  IconDefinition, 
  SymbolVariant, 
  SymbolScale, 
  SymbolWeight,
  SymbolRenderingMode,
  SymbolEffect
} from '../types.js'
import { IconLoader } from '../utils/icon-loader.js'
import { SymbolAccessibility } from '../utils/accessibility.js'
import { injectSymbolStyles } from '../rendering/index.js'
import { 
  generateAnimation, 
  generateEffectClasses,
  generateReducedMotionAnimation
} from '../animations/SymbolAnimations.js'
import { getWeightStyles, WEIGHT_TO_STROKE_WIDTH } from '../compatibility/weight-mapping.js'

/**
 * Symbol component - SwiftUI-inspired icon system
 */
export function Symbol(
  name: string | Signal<string>,
  props: Partial<SymbolProps> = {}
): ModifiableComponent<SymbolProps> & { modifier: ModifierBuilder<ModifiableComponent<SymbolProps>> } {
  // Create reactive state for icon loading
  const [iconDefinition, setIconDefinition] = createSignal<IconDefinition | undefined>(undefined)
  const [isLoading, setIsLoading] = createSignal(true)
  const [error, setError] = createSignal<string | undefined>(undefined)

  // The element handed to the renderer for the current state, kept so an
  // unrelated re-render does not swap identical DOM.
  let cachedContent: { signature: string; element: Element } | undefined

  // The most recent wrapper node handed to the renderer. The repaint effect
  // reaches the mounted element through it, since the renderer assigns
  // `element` only after `render()` has returned.
  let wrapperNode: any | undefined
  
  // Resolve signal values
  const getName = () => typeof name === 'function' ? name() : name
  const getVariant = (): SymbolVariant => {
    const variant = props.variant
    return typeof variant === 'function' ? variant() : (variant || 'none')
  }
  const getScale = (): SymbolScale => {
    const scale = props.scale
    return typeof scale === 'function' ? scale() : (scale || 'medium')
  }
  // Helper function to convert numeric weights to SymbolWeight strings
  const normalizeWeight = (weight: SymbolWeight | number | undefined): SymbolWeight => {
    if (weight === undefined) return 'regular'
    
    // If it's already a string, return it
    if (typeof weight === 'string') return weight
    
    // Convert numeric weight to SymbolWeight string
    const weightMap: Record<number, SymbolWeight> = {
      100: 'ultraLight',
      200: 'thin',
      300: 'light',
      400: 'regular',
      500: 'medium',
      600: 'semibold',
      700: 'bold',
      800: 'heavy',
      900: 'black'
    }
    
    return weightMap[weight] || 'regular'
  }
  
  const getWeight = (): SymbolWeight => {
    const weight = props.weight
    const resolvedWeight = typeof weight === 'function' ? weight() : weight
    return normalizeWeight(resolvedWeight)
  }
  const getRenderingMode = (): SymbolRenderingMode => {
    const mode = props.renderingMode
    return typeof mode === 'function' ? mode() : (mode || 'monochrome')
  }
  const getEffect = (): SymbolEffect => {
    const effect = props.effect
    return typeof effect === 'function' ? effect() : (effect || 'none')
  }
  
  // Load icon when name or variant changes
  createEffect(() => {
    const iconName = getName()
    const variant = getVariant()
    
    if (!iconName) {
      setError('Icon name is required')
      setIsLoading(false)
      return
    }
    
    setIsLoading(true)
    setError(undefined)
    
    // Handle async loading
    const loadIcon = async () => {
      try {
        // `IconLoader` resolves SF Symbol names to their icon-set-native
        // equivalents, so both the name and the fallback are passed through as
        // the caller spelled them.
        let icon = await IconLoader.loadIcon(iconName, variant, props.iconSet)

        if (!icon && props.fallback) {
          icon = await IconLoader.loadIcon(
            props.fallback,
            variant,
            props.iconSet
          )
        }
        
        if (!icon) {
          setError(`Icon "${iconName}" not found`)
          setIsLoading(false)
        } else {
          setIconDefinition(icon)
          setIsLoading(false)
        }
      } catch (err) {
        setError(`Failed to load icon: ${err}`)
        setIsLoading(false)
      }
    }
    
    loadIcon()
  })
  
  // Calculate size based on custom size/width/height or fallback to scale
  const getSize = (): { width: number, height: number } => {
    // Priority 1: Explicit size (square)
    if (props.size !== undefined) {
      const size = typeof props.size === 'function' ? props.size() : props.size
      return { width: size, height: size }
    }
    
    // Priority 2: Explicit width/height
    if (props.width !== undefined || props.height !== undefined) {
      const width = props.width !== undefined 
        ? (typeof props.width === 'function' ? props.width() : props.width)
        : (props.height !== undefined 
          ? (typeof props.height === 'function' ? props.height() : props.height)
          : 24) // default width when only height is specified
      
      const height = props.height !== undefined
        ? (typeof props.height === 'function' ? props.height() : props.height)
        : (props.width !== undefined 
          ? (typeof props.width === 'function' ? props.width() : props.width)
          : 24) // default height when only width is specified
      
      return { width, height }
    }
    
    // Priority 3: Fall back to scale
    const scale = getScale()
    const sizes = { small: 16, medium: 24, large: 32 }
    const size = sizes[scale]
    return { width: size, height: size }
  }
  
  // Get colors and styling based on rendering mode and weight
  const getColors = (): { stroke: string, fill: string, opacity?: string, strokeWidth: number } => {
    const mode = getRenderingMode()
    const weight = getWeight()
    const primaryColor = props.primaryColor
    const secondaryColor = props.secondaryColor
    const resolvedPrimaryColor = typeof primaryColor === 'function' ? primaryColor() : primaryColor
    const resolvedSecondaryColor = typeof secondaryColor === 'function' ? secondaryColor() : secondaryColor
    
    // Get stroke width based on weight
    const strokeWidth = WEIGHT_TO_STROKE_WIDTH[weight]
    
    switch (mode) {
      case 'monochrome':
        // Monochrome should use stroke color, not fill, for Lucide icons
        // Use black as fallback instead of currentColor to ensure visibility
        const monoColor = resolvedPrimaryColor || '#000000'
        return { stroke: monoColor, fill: 'none', strokeWidth }
      
      case 'hierarchical':
        // Hierarchical uses stroke for outline, fill for interior with opacity
        const hierColor = resolvedPrimaryColor || 'currentColor'
        return { 
          stroke: hierColor, 
          fill: resolvedSecondaryColor || 'none', // Don't default to stroke color for fill
          opacity: '0.6', // Hierarchical uses opacity variations
          strokeWidth
        }
      
      case 'palette':
        return { 
          stroke: resolvedPrimaryColor || 'currentColor', 
          fill: resolvedSecondaryColor || 'none',
          strokeWidth
        }
      
      case 'multicolor':
        // Multicolor uses the icon's designed colors, so use currentColor as fallback
        return { stroke: 'currentColor', fill: 'none', strokeWidth }
      
      default:
        return { stroke: 'currentColor', fill: 'none', strokeWidth }
    }
  }
  
  // Get primary color for CSS (backward compatibility)
  const getColor = (): string => {
    const colors = getColors()
    return colors.stroke
  }
  
  // Generate CSS classes for styling using advanced animation manager
  const getClasses = (): string => {
    const classes = ['tachui-symbol']
    const scale = getScale()
    const effect = getEffect()
    const renderingMode = getRenderingMode()
    
    classes.push(`tachui-symbol--${scale}`)
    classes.push(`tachui-symbol--${renderingMode}`)
    
    if (effect !== 'none') {
      // Use advanced animation manager for effect classes
      const effectValue = props.effectValue
      const resolvedEffectValue = typeof effectValue === 'function' ? effectValue() : (effectValue || 0.5)
      
      const animationConfig = {
        effect,
        speed: props.effectSpeed || 1,
        value: resolvedEffectValue,
      }
      
      const effectClasses = generateEffectClasses(animationConfig)
      classes.push(...effectClasses)
    }
    
    if (isLoading()) {
      classes.push('tachui-symbol--loading')
    }
    
    if (error()) {
      classes.push('tachui-symbol--error')
    }
    
    return classes.join(' ')
  }
  
  // Generate CSS styles using advanced animation manager
  const getStyles = (): Record<string, string> => {
    const { width, height } = getSize()
    const weight = getWeight()
    const colors = getColors()
    const weightStyles = getWeightStyles(weight, (props.iconSet as 'lucide' | 'sf-symbols' | 'material' | 'feather') || 'lucide')
    
    const baseStyles: Record<string, string> = {
      width: `${width}px`,
      height: `${height}px`,
      color: getColor(),
      display: 'inline-block',
      lineHeight: '1',
    }
    
    // Add CSS to ensure stroke-width is properly inherited by SVG children
    if (colors.strokeWidth !== 1.5) {
      baseStyles['--symbol-stroke-width'] = `${colors.strokeWidth}`
    }
    
    // Apply weight-specific CSS styles (filter, font-weight, etc.)
    Object.entries(weightStyles).forEach(([key, value]) => {
      if (key === 'strokeWidth') {
        // Apply stroke-width via CSS to affect all inner elements
        baseStyles['--stroke-width'] = `${value}px`
      } else {
        baseStyles[key] = String(value)
      }
    })
    
    const effect = getEffect()
    
    // Use advanced animation manager for effect styles
    if (effect !== 'none') {
      const effectValue = props.effectValue
      const resolvedEffectValue = typeof effectValue === 'function' ? effectValue() : (effectValue || 0.5)
      
      const animationConfig = {
        effect,
        speed: props.effectSpeed || 1,
        value: resolvedEffectValue,
        iterationCount: props.effectRepeat || 'infinite',
      }
      
      // Check for reduced motion preference
      const prefersReducedMotion = typeof window !== 'undefined' && 
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
        
      const computedAnimation = prefersReducedMotion 
        ? generateReducedMotionAnimation(animationConfig)
        : generateAnimation(animationConfig)
      
      // Apply animation styles (including animation: none for reduced motion)
      Object.assign(baseStyles, {
        animationName: computedAnimation.animationName,
        animationDuration: computedAnimation.animationDuration,
        animationTimingFunction: computedAnimation.animationTimingFunction,
        animationIterationCount: computedAnimation.animationIterationCount,
        animationDirection: computedAnimation.animationDirection,
        animationFillMode: computedAnimation.animationFillMode,
        animationDelay: computedAnimation.animationDelay,
      })
      
      // Add transform if provided
      if (computedAnimation.transform) {
        baseStyles.transform = computedAnimation.transform
      }
      
      // Add custom properties for variable effects
      if (computedAnimation.customProperties) {
        Object.assign(baseStyles, computedAnimation.customProperties)
      }
    }
    
    return baseStyles
  }
  
  // Main render function - removed dead code paths that use undefined 'h' function
  // The actual rendering is handled by createReactiveSymbol() below
  
  // Create the component instance  
  const symbolProps: SymbolProps = {
    ...props,
    name,
  }
  
  // Create a reactive DOM node that updates itself when signals change
  const createReactiveSymbol = () => {
    const styleString = styleStringFrom(getStyles())
    
    // Generate accessibility attributes
    const accessibilityProps = SymbolAccessibility.generateAccessibilityProps({
      ...props,
      name
    })
      
    const symbolElement: any = {
      type: 'element',
      tag: 'span',
      props: {
        className: getClasses(),
        style: styleString,
        ...accessibilityProps
      },
      // The content is built below and mounted as an owned child, so the
      // renderer reconciles it like anything else.
      children: contentChildren(),
      dispose: disposeRepaint,
    }

    wrapperNode = symbolElement

    return symbolElement
  }

  function styleStringFrom(styles: Record<string, any>): string {
    return Object.entries(styles)
      .map(([key, value]) => `${key}: ${value}`)
      .join('; ')
  }

  /**
   * Build the element for the current load state.
   *
   * An SVG subtree cannot be expressed as ordinary `DOMNode` children — the
   * renderer has no namespace support and would produce HTMLUnknownElement — so
   * the element is built here with `createElementNS` and handed over as an
   * owned node for the renderer to mount (see `DOMNode.owned`).
   *
   * The first paint comes from `render()`; every later one comes from the
   * repaint effect, which is only safe because `owned` stops `updateChildren`
   * reconciling this subtree away. That overwriting is what made the earlier
   * effect-based attempt fail (#303).
   */
  function contentChildren(): any[] {
    // Server-side there is no DOM to build into, and no icon has resolved yet
    // either, so the wrapper serializes alone and the icon is drawn when the
    // component hydrates. Emitting nothing keeps the server markup a prefix of
    // the hydrated markup; before the icon moved into `render()` this position
    // was empty server-side too.
    if (typeof document === 'undefined') return []

    return [contentNode()]
  }

  function contentNode(): any {
    const element = contentElement()
    return {
      type: 'element',
      tag: element.tagName.toLowerCase(),
      props: {},
      children: [],
      element,
      owned: true,
    }
  }

  function contentElement(): Element {
    const loading = isLoading()
    const errorMsg = error()
    const iconDef = iconDefinition()
    const { width, height } = getSize()
    const colors = getColors()

    // Rebuild only when something the element depends on has changed, so a
    // re-render for an unrelated reason does not swap the DOM needlessly.
    const signature = JSON.stringify([
      loading,
      errorMsg ?? null,
      iconDef?.name ?? null,
      iconDef?.variant ?? null,
      width,
      height,
      colors,
    ])
    if (cachedContent && cachedContent.signature === signature) {
      return cachedContent.element
    }

    let element: Element
    if (loading) {
      element = document.createElement('div')
      element.className = 'tachui-symbol__spinner'
      element.textContent = '⟳'
    } else if (errorMsg || !iconDef) {
      element = buildSvgShell(width, height, colors, '0 0 24 24')
      element.innerHTML =
        '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>'
    } else {
      element = buildSvgShell(width, height, colors, getSafeViewBox(iconDef))
      // Only the allowlist-sanitized icon body is set as markup (#218).
      element.innerHTML = getSanitizedIconBody(iconDef)
    }

    cachedContent = { signature, element }
    return element
  }

  function buildSvgShell(
    width: number,
    height: number,
    colors: ReturnType<typeof getColors>,
    viewBox: string
  ): SVGElement {
    // Attribute values go through setAttribute so they are escaped (#218).
    const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
    const svgElement = document.createElementNS(SVG_NAMESPACE, 'svg')
    svgElement.setAttribute('width', String(width))
    svgElement.setAttribute('height', String(height))
    svgElement.setAttribute('viewBox', viewBox)
    svgElement.setAttribute('fill', colors.fill)
    svgElement.setAttribute('stroke', colors.stroke)
    svgElement.setAttribute('stroke-width', String(colors.strokeWidth))
    svgElement.setAttribute('stroke-linecap', 'round')
    svgElement.setAttribute('stroke-linejoin', 'round')
    if (colors.opacity) {
      svgElement.setAttribute('opacity', colors.opacity)
    }
    return svgElement
  }

  /**
   * Repaint this symbol, and only this symbol, when its state changes.
   *
   * The signal reads have to happen here rather than in `render()`. A child's
   * `render()` is called inline by `renderChildrenArray`, inside the *enclosing*
   * component's render effect, so reading `isLoading`/`error`/`iconDefinition`
   * there subscribes the parent: every icon that resolved would re-render the
   * whole surrounding subtree, once per symbol on the screen.
   *
   * Owning a root instead keeps each symbol's updates to itself, and patching
   * the mounted element directly is safe because `owned` stops the renderer
   * reconciling this subtree (see `DOMNode.owned`).
   */
  const disposeRepaint = createRoot(() => {
    const effect = createEffect(() => {
      // Subscribed explicitly, so that a pass with nothing to paint into still
      // re-runs when the load resolves. Reaching them through `contentElement()`
      // alone would mean never subscribing on the passes that return early.
      isLoading()
      error()
      iconDefinition()

      const classes = getClasses()
      const styleString = styleStringFrom(getStyles())

      const wrapper = wrapperNode?.element

      // Nothing mounted: either the first paint has not happened — `render()`
      // builds it from these same values, so there is nothing to catch up — or
      // this is a server render, where there is no DOM to paint into and the
      // icon is drawn on hydration. No DOM is touched in either case, so
      // constructing a Symbol stays free of side effects.
      //
      // `Element` has to be tested for before it is named: in a real Node
      // process it is not defined at all, and this effect runs eagerly while
      // the Symbol is being constructed, so naming it would throw a
      // ReferenceError before `@tachui/ssr` could emit anything.
      if (typeof Element === 'undefined' || !(wrapper instanceof Element)) return

      const content = contentElement()

      wrapper.className = classes
      wrapper.setAttribute('style', styleString)

      const mounted = wrapper.firstElementChild
      if (content === mounted) return

      if (mounted) {
        wrapper.replaceChild(content, mounted)
      } else {
        wrapper.appendChild(content)
      }
    })

    return () => effect.dispose()
  })

  const instance: ComponentInstance<SymbolProps> = {
    type: 'component',
    // Untracked so the reads above stay this symbol's business: `render()` runs
    // inside whichever effect the caller is rendering under.
    render: () => untrack(() => [createReactiveSymbol()]),
    props: symbolProps,
    children: [],
    cleanup: [],
    id: `symbol-${Math.random().toString(36).substr(2, 9)}`
  }
  
  return withModifiers(instance)
}

// Auto-inject enhanced styles when component is used
injectSymbolStyles()