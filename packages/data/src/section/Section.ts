/**
 * Enhanced Section Component (Phase 6.4.2)
 *
 * @deprecated This component has been superseded by FormSection from @tachui/forms
 * for form contexts, which provides the same features with better semantic HTML.
 * For general layout grouping, use VStack or HStack with styling instead.
 *
 * Migration Guide:
 * - For forms: Replace with FormSection from @tachui/forms
 * - For general grouping: Use VStack with styling modifiers
 * - All props are compatible between Section and FormSection
 *
 * SwiftUI-inspired Section component for grouping form content
 * with headers, footers, and automatic styling.
 */

import type { ModifiableComponent, ModifierBuilder } from '@tachui/core'
import { isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h, text } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'

/**
 * Section component properties
 */
export interface SectionProps extends ComponentProps {
  children?: ComponentInstance[]

  // Content
  header?: string | (() => string) | Signal<string> | ComponentInstance
  footer?: string | (() => string) | Signal<string> | ComponentInstance

  // Styling
  style?: 'automatic' | 'grouped' | 'inset' | 'plain' | 'sidebar'
  spacing?: number

  // Behavior
  collapsible?: boolean
  collapsed?: boolean | Signal<boolean>
  onToggle?: (collapsed: boolean) => void

  // Accessibility
  accessibilityLabel?: string
  accessibilityRole?: string
}

/**
 * Enhanced Section component class
 */
export class EnhancedSection implements ComponentInstance<SectionProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(public props: SectionProps) {
    this.id = `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Resolve dynamic content
   */
  private resolveContent(
    content:
      | string
      | (() => string)
      | Signal<string>
      | ComponentInstance
      | undefined
  ): string | ComponentInstance | null {
    if (!content) return null

    if (typeof content === 'string') {
      return content
    } else if (typeof content === 'function') {
      return content()
    } else if (isSignal(content)) {
      return (content as () => string)()
    } else {
      return content as ComponentInstance
    }
  }

  /**
   * Check if section is collapsed
   */
  private isCollapsed(): boolean {
    const { collapsed } = this.props
    if (typeof collapsed === 'boolean') return collapsed
    if (isSignal(collapsed)) return (collapsed as () => boolean)()
    return false
  }

  /**
   * Handle toggle action
   */
  private handleToggle = () => {
    if (this.props.onToggle) {
      this.props.onToggle(!this.isCollapsed())
    }
  }

  /**
   * Helper to render component content safely
   */
  private renderComponentContent(content: ComponentInstance): DOMNode[] {
    const rendered = content.render()
    return Array.isArray(rendered) ? rendered : [rendered]
  }

  /**
   * Get section styles based on style prop
   */
  private getSectionStyles() {
    const { style = 'automatic' } = this.props

    const baseStyles = {
      marginBottom: '20px',
    }

    switch (style) {
      case 'grouped':
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #e0e0e0',
          borderRadius: '12px',
          overflow: 'hidden' as const,
        }

      case 'inset':
        return {
          ...baseStyles,
          backgroundColor: '#f8f9fa',
          border: '1px solid #e9ecef',
          borderRadius: '8px',
          margin: '0 16px 20px 16px',
        }

      case 'sidebar':
        return {
          ...baseStyles,
          borderLeft: '3px solid #007AFF',
          paddingLeft: '16px',
          backgroundColor: '#f8f9fa',
          borderRadius: '0 8px 8px 0',
        }

      case 'plain':
        return baseStyles
      default:
        return {
          ...baseStyles,
          backgroundColor: '#ffffff',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
        }
    }
  }

  /**
   * Get header styles
   */
  private getHeaderStyles() {
    const { style = 'automatic' } = this.props

    const baseStyles = {
      fontSize: '16px',
      fontWeight: '600' as const,
      color: '#1a1a1a',
      margin: '0 0 12px 0',
    }

    switch (style) {
      case 'grouped':
      case 'inset':
        return {
          ...baseStyles,
          padding: '12px 16px 0 16px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #e9ecef',
        }

      case 'sidebar':
        return {
          ...baseStyles,
          fontSize: '14px',
          textTransform: 'uppercase' as const,
          letterSpacing: '0.5px',
          color: '#666',
          marginBottom: '8px',
        }

      default:
        return {
          ...baseStyles,
          padding: '0 0 8px 0',
        }
    }
  }

  /**
   * Get content styles
   */
  private getContentStyles() {
    const { style = 'automatic', spacing = 12 } = this.props

    const baseStyles = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: `${spacing}px`,
    }

    switch (style) {
      case 'grouped':
      case 'inset':
        return {
          ...baseStyles,
          padding: '16px',
        }

      case 'sidebar':
        return {
          ...baseStyles,
          padding: '8px 0',
        }

      default:
        return {
          ...baseStyles,
          padding: '12px',
        }
    }
  }

  /**
   * Get footer styles
   */
  private getFooterStyles() {
    const { style = 'automatic' } = this.props

    const baseStyles = {
      fontSize: '14px',
      color: '#666',
      margin: '8px 0 0 0',
    }

    switch (style) {
      case 'grouped':
      case 'inset':
        return {
          ...baseStyles,
          padding: '0 16px 12px 16px',
          backgroundColor: '#f8f9fa',
          borderTop: '1px solid #e9ecef',
        }

      default:
        return {
          ...baseStyles,
          padding: '0 0 4px 0',
        }
    }
  }

  /**
   * Render header content
   */
  private renderHeader() {
    const headerContent = this.resolveContent(this.props.header)
    if (!headerContent) return null

    const headerStyles = this.getHeaderStyles()

    // Add collapse toggle if collapsible
    if (this.props.collapsible) {
      const toggleIcon = this.isCollapsed() ? '▶' : '▼'

      return h(
        'div',
        {
          style: {
            ...headerStyles,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          },
          onClick: this.handleToggle,
        },
        h(
          'span',
          {
            style: {
              fontSize: '12px',
              color: '#666',
            },
          },
          text(toggleIcon)
        ),

        ...(typeof headerContent === 'string'
          ? [text(headerContent)]
          : this.renderComponentContent(headerContent as ComponentInstance))
      )
    }

    return h(
      'div',
      { style: headerStyles },
      ...(typeof headerContent === 'string'
        ? [text(headerContent)]
        : this.renderComponentContent(headerContent as ComponentInstance))
    )
  }

  /**
   * Render content
   */
  private renderContent() {
    const { children = [] } = this.props

    // Don't render content if collapsed
    if (this.props.collapsible && this.isCollapsed()) {
      return null
    }

    if (children.length === 0) return null

    return h(
      'div',
      {
        style: this.getContentStyles(),
      },
      ...children.flatMap(child => {
        const rendered = child.render()
        return Array.isArray(rendered) ? rendered : [rendered]
      })
    )
  }

  /**
   * Render footer content
   */
  private renderFooter() {
    const footerContent = this.resolveContent(this.props.footer)
    if (!footerContent) return null

    return h(
      'div',
      {
        style: this.getFooterStyles(),
      },
      ...(typeof footerContent === 'string'
        ? [text(footerContent)]
        : this.renderComponentContent(footerContent as ComponentInstance))
    )
  }

  render() {
    const { accessibilityLabel, accessibilityRole = 'group' } = this.props

    return h(
      'div',
      {
        style: this.getSectionStyles(),
        'aria-label': accessibilityLabel,
        role: accessibilityRole,
      },
      ...[
        this.renderHeader(),
        this.renderContent(),
        this.renderFooter(),
      ].filter((item): item is DOMNode => item !== null)
    )
  }
}

/**
 * Section component function
 * @deprecated Use FormSection from @tachui/forms for form contexts, or VStack for general grouping
 */
export function Section(
  children: ComponentInstance[],
  props: Omit<SectionProps, 'children'> = {}
): ModifiableComponent<SectionProps> & {
  modifier: ModifierBuilder<ModifiableComponent<SectionProps>>
} {
  console.warn(
    'Section from @tachui/core is deprecated. Use FormSection from @tachui/forms for form contexts, or VStack for general layout grouping.'
  )
  const sectionProps: SectionProps = { ...props, children }
  const component = new EnhancedSection(sectionProps)
  return withModifiers(component)
}

/**
 * Section with header
 * @deprecated Use FormSection from @tachui/forms
 */
export function SectionWithHeader(
  header: string | (() => string) | Signal<string> | ComponentInstance,
  children: ComponentInstance[],
  props: Omit<SectionProps, 'children' | 'header'> = {}
) {
  return Section(children, { ...props, header })
}

/**
 * Section with header and footer
 * @deprecated Use FormSection from @tachui/forms
 */
export function SectionWithHeaderFooter(
  header: string | (() => string) | Signal<string> | ComponentInstance,
  footer: string | (() => string) | Signal<string> | ComponentInstance,
  children: ComponentInstance[],
  props: Omit<SectionProps, 'children' | 'header' | 'footer'> = {}
) {
  return Section(children, { ...props, header, footer })
}

/**
 * Section style variants
 * @deprecated Use FormSection from @tachui/forms with style prop
 */
export const SectionStyles = {
  /**
   * Automatic section styling (default)
   */
  Automatic(
    children: ComponentInstance[],
    props: Omit<SectionProps, 'children' | 'style'> = {}
  ) {
    return Section(children, { ...props, style: 'automatic' })
  },

  /**
   * Grouped section with container styling
   */
  Grouped(
    children: ComponentInstance[],
    props: Omit<SectionProps, 'children' | 'style'> = {}
  ) {
    return Section(children, { ...props, style: 'grouped' })
  },

  /**
   * Inset section styling
   */
  Inset(
    children: ComponentInstance[],
    props: Omit<SectionProps, 'children' | 'style'> = {}
  ) {
    return Section(children, { ...props, style: 'inset' })
  },

  /**
   * Sidebar-style section
   */
  Sidebar(
    children: ComponentInstance[],
    props: Omit<SectionProps, 'children' | 'style'> = {}
  ) {
    return Section(children, { ...props, style: 'sidebar' })
  },

  /**
   * Plain section without styling
   */
  Plain(
    children: ComponentInstance[],
    props: Omit<SectionProps, 'children' | 'style'> = {}
  ) {
    return Section(children, { ...props, style: 'plain' })
  },

  /**
   * Collapsible section
   */
  Collapsible(
    header: string | (() => string) | Signal<string> | ComponentInstance,
    children: ComponentInstance[],
    collapsed: boolean | Signal<boolean> = false,
    props: Omit<
      SectionProps,
      'children' | 'header' | 'collapsible' | 'collapsed'
    > = {}
  ) {
    return Section(children, {
      ...props,
      header,
      collapsible: true,
      collapsed,
    })
  },
}
