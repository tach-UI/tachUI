/**
 * ConcatenatedComponent Implementation
 *
 * The main class that represents a concatenated component composed of multiple
 * component segments. Handles rendering, accessibility, and further concatenation.
 */

import { h } from '../runtime/renderer'
import type { DOMNode } from '../runtime/types'
import type {
  Concatenatable,
  ComponentSegment,
  ConcatenationMetadata,
  AccessibilityNode
} from './types'
import type { ModifiableComponent, Modifier } from '../modifiers/types'
import { applyModifiersToNode } from '../modifiers/registry'
// import { CONCAT_SYMBOL } from './concatenatable' // Unused

/**
 * A component that represents the concatenation of multiple components
 */
export class ConcatenatedComponent<T = any>
  implements ModifiableComponent<any>, Concatenatable<T> {

  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []
  public props: any = {} // Required by ComponentInstance interface
  public segments: ComponentSegment[] // Make segments public
  public modifiers: Modifier[] = [] // Required by ModifiableComponent interface

  constructor(
    segments: ComponentSegment[],
    public metadata: ConcatenationMetadata,
    _enableOptimization: boolean = true
  ) {
    this.id = `concat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Temporarily disable optimization to avoid require() issues in browser
    // TODO: Fix text optimization to work in browser environment
    this.segments = segments

    // Apply text optimization if enabled and beneficial (disabled for now)
    // if (enableOptimization && TextConcatenationOptimizer.shouldOptimize(segments)) {
    //   this.segments = TextConcatenationOptimizer.optimize(segments)
    //
    //   // Log optimization stats in development
    //   if (process.env.NODE_ENV === 'development') {
    //     const stats = TextConcatenationOptimizer.getOptimizationStats(segments, this.segments)
    //     console.log(`TachUI Concatenation: Optimized ${stats.originalCount} → ${stats.optimizedCount} segments (${stats.reductionPercent}% reduction)`)
    //   }
    // } else {
    //   this.segments = segments
    // }
  }

  /**
   * Render the concatenated component to DOM nodes (Enhanced - Phase 4.2)
   */
  render(): DOMNode[] {
    const containerClass = this.determineContainerClass()
    const ariaLabel = this.buildAccessibilityLabel()
    const accessibilityAttributes = this.buildAccessibilityAttributes()

    // Check if the concatenated component itself has asHTML modifiers
    const hasAsHTMLModifiers = this.modifiers && this.modifiers.some(mod => mod.type === 'asHTML')

    let segmentNodes: DOMNode[]

    if (hasAsHTMLModifiers) {
      // Special handling for asHTML modifiers - apply them to individual segments
      segmentNodes = this.renderSegmentsWithAsHTML()
    } else {
      // Normal rendering
      segmentNodes = this.segments.map(segment => segment.render()).flat()
    }

    // Create container element with comprehensive accessibility
    const container = h('span', {
      class: `tachui-concatenated ${containerClass}`,
      ...accessibilityAttributes,
      'aria-label': ariaLabel || undefined,
      // Enhanced live region support for dynamic content
      ...(this.hasInteractiveContent() && {
        'aria-live': 'polite',
        'aria-atomic': 'true'
      }),
      // Add debug information in development
      ...(process.env.NODE_ENV === 'development' && {
        'data-concatenated-segments': this.segments.length,
        'data-semantic-structure': this.metadata.semanticStructure,
        'data-accessibility-role': this.metadata.accessibilityRole
      })
    }, ...segmentNodes)

    return [container]
  }

  /**
   * Build comprehensive accessibility attributes
   */
  private buildAccessibilityAttributes(): Record<string, string> {
    const attributes: Record<string, string> = {}

    // Set appropriate role based on metadata
    switch (this.metadata.accessibilityRole) {
      case 'text':
        // For text-only content, no explicit role needed (default text semantics)
        break

      case 'group':
        attributes.role = 'group'
        // Add description for groups to clarify purpose
        attributes['aria-describedby'] = this.generateGroupDescription()
        break

      case 'composite':
        attributes.role = 'group'
        // For composite content (with interactive elements), mark as application region
        attributes['aria-roledescription'] = 'interactive content group'
        break
    }

    // Add reading order hints for complex layouts
    if (this.metadata.semanticStructure === 'mixed' && this.segments.length > 2) {
      attributes['aria-flowto'] = this.generateFlowTargets()
    }

    // Add keyboard navigation hints for interactive content
    if (this.hasInteractiveContent()) {
      attributes.tabindex = '0'
      attributes['aria-description'] = 'Contains interactive elements. Use Tab to navigate.'
    }

    return attributes
  }

  /**
   * Generate description for grouped content
   */
  private generateGroupDescription(): string {
    const componentTypes = this.getUniqueComponentTypes()

    if (componentTypes.length === 1) {
      return `Group of ${this.segments.length} ${componentTypes[0]} elements`
    }

    return `Group containing ${componentTypes.join(', ')} elements`
  }

  /**
   * Generate flow targets for reading order
   */
  private generateFlowTargets(): string {
    // This would typically reference IDs of next focusable elements
    // For now, return empty string as it requires DOM coordination
    return ''
  }

  /**
   * Check if concatenated content contains interactive elements
   */
  private hasInteractiveContent(): boolean {
    return this.segments.some(segment => {
      const componentType = segment.component.constructor.name
      return componentType === 'EnhancedButton' || componentType === 'EnhancedLinkComponent'
    })
  }

  /**
   * Get unique component types in this concatenation
   */
  private getUniqueComponentTypes(): string[] {
    const types = new Set(this.segments.map(segment => {
      const componentType = segment.component.constructor.name
      switch (componentType) {
        case 'EnhancedText': return 'text'
        case 'EnhancedImage': return 'image'
        case 'EnhancedButton': return 'button'
        case 'EnhancedLinkComponent': return 'link'
        default: return 'component'
      }
    }))

    return Array.from(types)
  }

  /**
   * Concatenate this component with another concatenatable component
   */
  concat<U extends Concatenatable<any>>(other: U): ConcatenatedComponent<T | U> {
    let newSegments: ComponentSegment[]
    let newMetadata: ConcatenationMetadata

    if (other instanceof ConcatenatedComponent) {
      // Merging with another concatenated component
      newSegments = [...this.segments, ...other.segments]
      newMetadata = this.mergeMetadata(this.metadata, other.metadata, newSegments.length)
    } else {
      // Adding a single component
      newSegments = [...this.segments, other.toSegment()]
      newMetadata = this.mergeMetadata(
        this.metadata,
        {
          totalSegments: 1,
          accessibilityRole: this.determineComponentAccessibilityRole(other),
          semanticStructure: this.determineComponentSemanticStructure(other)
        },
        newSegments.length
      )
    }

    return new ConcatenatedComponent(newSegments, newMetadata)
  }

  /**
   * Convert this concatenated component to a segment (for further concatenation)
   */
  toSegment(): ComponentSegment {
    return {
      id: this.id,
      component: this as any, // Cast to satisfy interface requirements
      modifiers: [], // Concatenated components don't have their own modifiers
      render: () => this.render()[0]
    }
  }

  /**
   * Check if this component supports concatenation
   */
  isConcatenatable(): boolean {
    return true
  }

  /**
   * Determine the appropriate CSS class for the container
   */
  private determineContainerClass(): string {
    const componentTypes = this.segments.map(s => s.component.constructor.name)

    const hasImages = componentTypes.some(type => type === 'EnhancedImage')
    const hasText = componentTypes.some(type => type === 'EnhancedText')
    const hasButtons = componentTypes.some(type => type === 'EnhancedButton')
    const hasLinks = componentTypes.some(type => type === 'EnhancedLink')

    // Determine the most appropriate container class
    if (hasImages && hasText && (hasButtons || hasLinks)) {
      return 'mixed-content'
    } else if (hasImages && hasText) {
      return 'image-text-composition'
    } else if (hasImages && !hasText) {
      return 'image-composition'
    } else if (hasText && !hasImages) {
      return 'text-composition'
    } else {
      return 'generic-composition'
    }
  }

  /**
   * Build comprehensive accessibility label for screen readers (Enhanced - Phase 4.2)
   */
  private buildAccessibilityLabel(): string {
    const labels = this.segments.map(segment => this.extractAccessibilityText(segment))

    // Filter out empty labels and format appropriately
    const cleanLabels = labels.filter(Boolean)

    if (cleanLabels.length === 0) return ''

    // Apply intelligent joining based on content type
    return this.joinAccessibilityLabels(cleanLabels)
  }

  /**
   * Intelligently join accessibility labels based on content and structure
   */
  private joinAccessibilityLabels(labels: string[]): string {
    if (labels.length === 1) return labels[0]

    // Analyze the semantic structure to determine appropriate joining
    switch (this.metadata.semanticStructure) {
      case 'inline':
        // For inline content, join with spaces (natural reading flow)
        return labels.join(' ')

      case 'block':
        // For block content, use more explicit separators
        return labels.join('. ')

      case 'mixed':
        // For mixed content, use context-aware joining
        return this.smartJoinLabels(labels)

      default:
        return labels.join(' ')
    }
  }

  /**
   * Context-aware label joining for mixed content
   */
  private smartJoinLabels(labels: string[]): string {
    const result: string[] = []

    for (let i = 0; i < labels.length; i++) {
      const current = labels[i]
      const next = labels[i + 1]

      result.push(current)

      if (next) {
        // Add appropriate separator based on content
        if (this.needsExplicitSeparator(current, next)) {
          result.push('. ')
        } else {
          result.push(' ')
        }
      }
    }

    return result.join('')
  }

  /**
   * Determine if two accessibility labels need explicit separation
   */
  private needsExplicitSeparator(current: string, next: string): boolean {
    // Add separator if current doesn't end with punctuation and next is a new concept
    const currentEndsWithPunctuation = /[.!?:;]$/.test(current.trim())
    const nextStartsWithCapital = /^[A-Z]/.test(next.trim())

    return !currentEndsWithPunctuation && nextStartsWithCapital
  }

  /**
   * Extract accessibility text from a component segment
   */
  private extractAccessibilityText(segment: ComponentSegment): string {
    const component = segment.component
    const componentType = component.constructor.name

    // Handle different component types
    switch (componentType) {
      case 'EnhancedText':
        return (component as any).content || (component as any).title || ''

      case 'EnhancedImage':
        return (component as any).alt || (component as any).accessibilityLabel || 'Image'

      case 'EnhancedButton':
        return (component as any).title || (component as any).accessibilityLabel || 'Button'

      case 'EnhancedLink':
        return (component as any).title || (component as any).accessibilityLabel || 'Link'

      case 'ConcatenatedComponent':
        return (component as unknown as ConcatenatedComponent).buildAccessibilityLabel()

      default:
        return (component as any).accessibilityLabel || ''
    }
  }

  /**
   * Merge metadata from two concatenation operations
   */
  private mergeMetadata(
    metadata1: ConcatenationMetadata,
    metadata2: ConcatenationMetadata,
    totalSegments: number
  ): ConcatenationMetadata {
    return {
      totalSegments,
      accessibilityRole: this.mergeAccessibilityRoles(
        metadata1.accessibilityRole,
        metadata2.accessibilityRole
      ),
      semanticStructure: this.mergeSemanticStructures(
        metadata1.semanticStructure,
        metadata2.semanticStructure
      )
    }
  }

  /**
   * Merge accessibility roles from two components
   */
  private mergeAccessibilityRoles(
    role1: 'text' | 'group' | 'composite',
    role2: 'text' | 'group' | 'composite'
  ): 'text' | 'group' | 'composite' {
    // If both are text, keep text
    if (role1 === 'text' && role2 === 'text') return 'text'

    // If either is composite, result is composite
    if (role1 === 'composite' || role2 === 'composite') return 'composite'

    // Otherwise, it's a group
    return 'group'
  }

  /**
   * Merge semantic structures from two components
   */
  private mergeSemanticStructures(
    structure1: 'inline' | 'block' | 'mixed',
    structure2: 'inline' | 'block' | 'mixed'
  ): 'inline' | 'block' | 'mixed' {
    // If both are inline, keep inline
    if (structure1 === 'inline' && structure2 === 'inline') return 'inline'

    // If both are block, keep block
    if (structure1 === 'block' && structure2 === 'block') return 'block'

    // Otherwise, it's mixed
    return 'mixed'
  }

  /**
   * Determine accessibility role for a single component
   */
  private determineComponentAccessibilityRole(component: Concatenatable): 'text' | 'group' | 'composite' {
    const componentType = (component as any).constructor.name

    switch (componentType) {
      case 'EnhancedText':
        return 'text'
      case 'EnhancedImage':
        return 'group'
      case 'EnhancedButton':
      case 'EnhancedLink':
        return 'group'
      default:
        return 'composite'
    }
  }

  /**
   * Determine semantic structure for a single component
   */
  private determineComponentSemanticStructure(component: Concatenatable): 'inline' | 'block' | 'mixed' {
    const componentType = (component as any).constructor.name

    switch (componentType) {
      case 'EnhancedText':
      case 'EnhancedImage':
        return 'inline'
      case 'EnhancedButton':
      case 'EnhancedLink':
        return 'inline' // Buttons and links are typically inline in concatenation
      default:
        return 'mixed'
    }
  }

  /**
   * Special rendering method for segments with asHTML modifiers
   */
  private renderSegmentsWithAsHTML(): DOMNode[] {
    // Get asHTML modifiers from the concatenated component itself
    const asHTMLModifiers = this.modifiers?.filter(mod => mod.type === 'asHTML') || []

    const result: DOMNode[] = []

    for (const segment of this.segments) {
      const segmentNodes = segment.render()
      const nodes = Array.isArray(segmentNodes) ? segmentNodes : [segmentNodes]

      // Check if this segment is a Text component that should get asHTML modifiers
      const isTextComponent = this.isTextSegment(segment)

      if (isTextComponent && nodes.length > 0) {
        // Apply asHTML modifiers to the segment's DOM node with proper context
        const modifiedNode = this.applyAsHTMLToSegment(nodes[0], asHTMLModifiers, segment)
        result.push(modifiedNode)
      } else {
        // No asHTML modifiers needed, use normal rendering
        result.push(...nodes)
      }
    }

    return result
  }

  /**
   * Check if a segment represents a Text component
   */
  private isTextSegment(segment: ComponentSegment): boolean {
    const component = segment.component
    if (!component) return false

    // Check various ways to identify Text components
    return component.constructor?.name === 'TextComponent' ||
           component.constructor?.name === 'EnhancedText' ||
           (component as any).__tachui_component_type === 'Text' ||
           (component as any).componentMetadata?.originalType === 'Text'
  }

  /**
   * Apply asHTML modifiers to a segment with proper component context
   */
  private applyAsHTMLToSegment(
    node: DOMNode,
    asHTMLModifiers: any[],
    segment: ComponentSegment
  ): DOMNode {
    // Create proper context with the original component instance
    const context = {
      element: undefined, // Will be set when the node is rendered to DOM
      componentId: segment.id,
      phase: 'creation' as const,
      componentInstance: segment.component, // Pass the original component
    }

    // Apply only the asHTML modifiers to this segment
    return applyModifiersToNode(node, asHTMLModifiers, context, { batch: true })
  }

  /**
   * Generate comprehensive accessibility tree for this concatenated component
   */
  generateAccessibilityTree(): AccessibilityNode {
    return {
      role: this.metadata.accessibilityRole,
      label: this.buildAccessibilityLabel(),
      children: this.segments.map(segment => this.segmentToAccessibilityNode(segment))
    }
  }

  /**
   * Convert a component segment to an accessibility node
   */
  private segmentToAccessibilityNode(segment: ComponentSegment): AccessibilityNode {
    const component = segment.component

    return {
      role: this.determineComponentAccessibilityRole(component as unknown as Concatenatable),
      label: this.extractAccessibilityText(segment),
      children: component instanceof ConcatenatedComponent
        ? component.generateAccessibilityTree().children
        : undefined
    }
  }
}
