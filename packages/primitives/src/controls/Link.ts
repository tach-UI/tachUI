/**
 * Enhanced Link Component
 *
 * A control for navigating to a URL that matches the SwiftUI Link API exactly.
 * iOS 14.0+ equivalent for web applications.
 */

import { isSignal, createComputed } from '@tachui/core'
import type { Signal } from '@tachui/core'
import { h } from '@tachui/core'
import type { ComponentInstance, ComponentProps, DOMNode } from '@tachui/core'
import { withModifiers } from '@tachui/core'
import type {
  Concatenatable,
  ComponentSegment,
  ConcatenationMetadata,
} from '@tachui/core'
import { ConcatenatedComponent } from '@tachui/core'
import { Text } from '../display/Text'

/**
 * Link target types for different behaviors
 */
export type LinkTarget = '_self' | '_blank' | '_parent' | '_top'

/**
 * Link routing behavior for internal vs external links
 */
export type LinkRoutingMode = 'auto' | 'external' | 'internal' | 'spa'

/**
 * Enhanced Link Properties (combines SwiftUI API with web-specific features)
 */
export interface EnhancedLinkProps extends ComponentProps {
  /** The destination URL - matches SwiftUI's destination parameter */
  destination: string | URL | Signal<string | URL>

  /** Optional text content for simple links */
  text?: string | Signal<string>

  /** Label content (for closure-style links) */
  label?: () => ComponentInstance

  /** Complex children content (for backward compatibility) */
  children?: string | ComponentInstance | (string | ComponentInstance)[]

  /** Environment action override (matches SwiftUI's openURL environment) */
  openURLAction?: (url: string) => 'handled' | 'systemAction'

  // Navigation Control
  /** Target window for navigation */
  target?: LinkTarget | Signal<LinkTarget>

  /** Routing behavior mode */
  routingMode?: LinkRoutingMode | Signal<LinkRoutingMode>

  /** Download file functionality */
  download?: boolean | string | Signal<boolean | string>

  /** Custom rel attributes */
  rel?: string | Signal<string>

  // Event Handling
  /** Click event handler */
  onPress?: (event: Event) => void

  /** Pre-navigation hook with cancellation support */
  onBeforeNavigation?: (url: string) => boolean | Promise<boolean>

  /** Custom internal routing handler */
  onInternalNavigation?: (path: string) => boolean | Promise<boolean>

  // State Management
  /** Disabled state */
  disabled?: boolean | Signal<boolean>

  // Accessibility
  /** Custom ARIA label */
  accessibilityLabel?: string | Signal<string>

  /** ARIA description/hint */
  accessibilityHint?: string | Signal<string>

  /** Custom ARIA role */
  accessibilityRole?: string | Signal<string>
}

/**
 * Enhanced Link Component Implementation
 */
export class EnhancedLinkComponent
  implements
    ComponentInstance<EnhancedLinkProps>,
    Concatenatable<EnhancedLinkProps>
{
  public readonly type = 'component' as const
  public readonly id: string
  public readonly props: EnhancedLinkProps

  constructor(props: EnhancedLinkProps) {
    this.props = props
    this.id = `enhanced-link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private resolveValue<T>(value: T | Signal<T>): T {
    return isSignal(value) ? value() : value
  }

  private getDestination(): string {
    const dest = this.resolveValue(this.props.destination)
    return dest instanceof URL ? dest.toString() : dest
  }

  private getTarget(): LinkTarget {
    const explicitTarget = this.resolveValue(this.props.target)
    if (explicitTarget) {
      return explicitTarget
    }

    // Auto-target: external links default to _blank for security
    const dest = this.resolveValue(this.props.destination)
    const destination = dest instanceof URL ? dest.toString() : dest
    if (this.isExternalURL(destination)) {
      return '_blank'
    }

    return '_self'
  }

  private getRoutingMode(): LinkRoutingMode {
    return this.resolveValue(this.props.routingMode) || 'auto'
  }

  private getRel(): string {
    const customRel = this.resolveValue(this.props.rel)
    const target = this.getTarget()
    const destination = this.getDestination()

    // Auto-generate security attributes for external links
    const isExternal = this.isExternalURL(destination)
    const autoRel =
      isExternal && target === '_blank' ? 'noopener noreferrer' : ''

    if (customRel && autoRel) {
      return `${customRel} ${autoRel}`.trim()
    }
    return customRel || autoRel
  }

  private getDownload(): boolean | string | undefined {
    return this.resolveValue(this.props.download)
  }

  private isDisabled(): boolean {
    return this.resolveValue(this.props.disabled) || false
  }

  private getAccessibilityLabel(): string | undefined {
    return this.resolveValue(this.props.accessibilityLabel)
  }

  private getAccessibilityHint(): string | undefined {
    return this.resolveValue(this.props.accessibilityHint)
  }

  private getAccessibilityRole(): string | undefined {
    return this.resolveValue(this.props.accessibilityRole)
  }

  private shouldUseInternalRouting(url: string): boolean {
    const mode = this.getRoutingMode()

    if (mode === 'internal') return true
    if (mode === 'external') return false
    if (mode === 'spa') return true

    // Auto mode logic
    if (this.isSpecialScheme(url)) return false
    if (this.isExternalURL(url)) return false

    return true // Internal path
  }

  private isSpecialScheme(url: string): boolean {
    return /^(mailto|tel|sms|ftp|file):/.test(url)
  }

  private async handleClick(event: Event): Promise<void> {
    // Check if disabled
    if (this.isDisabled()) {
      event.preventDefault()
      return
    }

    // Call onPress if provided
    if (this.props.onPress) {
      try {
        this.props.onPress(event)
      } catch (error) {
        console.error('Link onPress error:', error)
      }
    }

    // Don't prevent default for special schemes (let browser handle them)
    const destination = this.getDestination()
    if (this.isSpecialScheme(destination)) {
      return // Let browser handle mailto:, tel:, etc.
    }

    event.preventDefault()

    // Check for custom openURL environment action (SwiftUI pattern)
    if (this.props.openURLAction) {
      const result = this.props.openURLAction(destination)
      if (result === 'handled') {
        return // Custom handler took care of it
      }
    }

    // Call onBeforeNavigation hook
    if (this.props.onBeforeNavigation) {
      try {
        const shouldContinue = await this.props.onBeforeNavigation(destination)
        if (!shouldContinue) {
          return // Navigation cancelled
        }
      } catch (error) {
        console.error('Link onBeforeNavigation error:', error)
        throw error // Re-throw to prevent navigation
      }
    }

    // Determine navigation method
    const target = this.getTarget()
    const routingMode = this.getRoutingMode()

    if (this.shouldUseInternalRouting(destination)) {
      // Internal routing
      if (this.props.onInternalNavigation) {
        try {
          const handled = await this.props.onInternalNavigation(destination)
          if (handled) {
            return // Custom internal navigation handled it
          }
        } catch (error) {
          console.error('Link onInternalNavigation error:', error)
          // Continue with default handling
        }
      }

      // Default internal navigation handling
      if (routingMode === 'spa') {
        this.handleSPANavigation(destination)
      } else if (target === '_blank') {
        window.open(destination, target)
      } else {
        window.location.href = destination
      }
    } else {
      // External navigation
      if (target === '_blank' || target === '_top' || target === '_parent') {
        window.open(destination, target)
      } else {
        window.location.href = destination
      }
    }
  }

  private handleSPANavigation(path: string): void {
    // Use History API for single-page app navigation
    if (
      typeof window !== 'undefined' &&
      window.history &&
      window.history.pushState
    ) {
      window.history.pushState(null, '', path)
      // Dispatch popstate event to notify app of navigation
      window.dispatchEvent(new PopStateEvent('popstate'))
    } else {
      // Fallback to regular navigation
      window.location.href = path
    }
  }

  private isExternalURL(url: string): boolean {
    try {
      const urlObj = new URL(url, window.location.href)
      return urlObj.hostname !== window.location.hostname
    } catch {
      return false
    }
  }

  private renderContent(): DOMNode[] {
    // If we have a label closure, use it (SwiftUI pattern)
    if (this.props.label) {
      const labelComponent = this.props.label()
      const rendered = labelComponent.render()
      return Array.isArray(rendered) ? rendered : [rendered]
    }

    // If we have children (backward compatibility)
    if (this.props.children) {
      return this.renderChildren()
    }

    // Use Text component for reactive text content
    // Convert URL to string and handle reactive signals properly
    let textContent: string | Signal<string>
    if (this.props.text) {
      textContent = this.props.text
    } else {
      // Fallback to destination, but convert URL to string
      if (isSignal(this.props.destination)) {
        // Create a computed that derives string from the reactive destination
        textContent = createComputed(() => this.getDestination())
      } else {
        textContent = this.getDestination() // Convert static URL to string
      }
    }

    const textComponent = Text(textContent)
    const rendered = textComponent.render()
    return Array.isArray(rendered) ? rendered : [rendered]
  }

  private renderChildren(): DOMNode[] {
    const { children } = this.props
    if (!children) return []

    // Handle array of children
    if (Array.isArray(children)) {
      return children.map(child => this.renderChild(child)).flat()
    }

    // Handle single child
    return this.renderChild(children)
  }

  private renderChild(child: string | ComponentInstance): DOMNode[] {
    if (typeof child === 'string') {
      const textComponent = Text(child)
      const rendered = textComponent.render()
      return Array.isArray(rendered) ? rendered : [rendered]
    } else {
      const rendered = child.render()
      return Array.isArray(rendered) ? rendered : [rendered]
    }
  }

  render(): DOMNode {
    const content = this.renderContent()
    const disabled = this.isDisabled()

    // Build props object
    const props: Record<string, any> = {
      id: this.id,
      'data-component': 'enhanced-link',
    }

    // Add href (reactive if needed)
    if (isSignal(this.props.destination)) {
      props.href = () => this.getDestination()
    } else {
      props.href = this.getDestination()
    }

    // Add target (reactive if needed)
    if (this.props.target) {
      if (isSignal(this.props.target)) {
        props.target = () => this.getTarget()
      } else {
        props.target = this.getTarget()
      }
    }

    // Add rel (reactive if needed)
    const rel = this.getRel()
    if (rel) {
      if (isSignal(this.props.rel) || isSignal(this.props.target)) {
        props.rel = () => this.getRel()
      } else {
        props.rel = rel
      }
    }

    // Add download (reactive if needed)
    const download = this.getDownload()
    if (download !== undefined) {
      if (isSignal(this.props.download)) {
        props.download = () => this.getDownload()
      } else if (download === true) {
        props.download = true
      } else if (typeof download === 'string') {
        props.download = download
      }
    }

    // Add accessibility attributes
    const accessibilityLabel = this.getAccessibilityLabel()
    if (accessibilityLabel) {
      if (isSignal(this.props.accessibilityLabel)) {
        props['aria-label'] = () => this.getAccessibilityLabel()
      } else {
        props['aria-label'] = accessibilityLabel
      }
    }

    const accessibilityHint = this.getAccessibilityHint()
    if (accessibilityHint) {
      if (isSignal(this.props.accessibilityHint)) {
        props['aria-describedby'] = () => this.getAccessibilityHint()
      } else {
        props['aria-describedby'] = accessibilityHint
      }
    }

    const accessibilityRole = this.getAccessibilityRole()
    if (accessibilityRole) {
      if (isSignal(this.props.accessibilityRole)) {
        props.role = () => this.getAccessibilityRole()
      } else {
        props.role = accessibilityRole
      }
    }

    // Add disabled state
    if (disabled) {
      props['aria-disabled'] = 'true'
      props.tabindex = '-1'
    }

    // Add event handlers
    props.onclick = (e: Event) => this.handleClick(e)

    // Add base styles (can be overridden by modifiers)
    props.style = {
      textDecoration: 'none',
      color: 'inherit',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.6 : 1,
    }

    const link = h('a', props, ...content)

    return link
  }

  // Concatenation support
  concat<U extends Concatenatable<any>>(
    other: U
  ): ConcatenatedComponent<EnhancedLinkProps | U> {
    const thisSegment = this.toSegment()
    const otherSegment = other.toSegment()

    const metadata: ConcatenationMetadata = {
      totalSegments: 2,
      accessibilityRole: 'composite',
      semanticStructure: 'inline',
    }

    return new ConcatenatedComponent([thisSegment, otherSegment], metadata)
  }

  toSegment(): ComponentSegment {
    return {
      id: this.id,
      component: this,
      modifiers: [],
      render: () => this.render(),
    }
  }

  isConcatenatable(): boolean {
    return true
  }
}

/**
 * Create enhanced Link component with modifier support
 *
 * Supports both SwiftUI-compatible API and object-based API for backward compatibility:
 * - SwiftUI API: Link("text", "destination")
 * - Object API: Link({ destination: "url", children: "text", ... })
 */
export function Link(
  textOrProps: string | Signal<string> | EnhancedLinkProps,
  destination?: string | URL | Signal<string | URL>
): any {
  // SwiftUI API: Link(text, destination)
  if (destination !== undefined) {
    const linkProps: EnhancedLinkProps = {
      text: textOrProps as string | Signal<string>,
      destination,
    }
    const component = new EnhancedLinkComponent(linkProps)
    return withModifiers(component)
  }

  // Object API: Link({ destination, children, ... })
  const props = textOrProps as EnhancedLinkProps
  const component = new EnhancedLinkComponent(props)
  return withModifiers(component)
}

/**
 * Environment-style OpenURL Action (matches SwiftUI pattern)
 */
export type OpenURLAction = (url: string) => 'handled' | 'systemAction'

/**
 * Enhanced Link Utilities (comprehensive web link patterns)
 */
export const LinkUtils = {
  /**
   * Create an external link that opens in a new tab
   */
  external(
    url: string,
    label: string,
    options: Partial<EnhancedLinkProps> = {}
  ) {
    return {
      destination: url,
      children: label,
      target: '_blank' as LinkTarget,
      routingMode: 'external' as LinkRoutingMode,
      rel: 'noopener noreferrer external',
      accessibilityHint: 'Opens in a new tab',
      ...options,
    }
  },

  /**
   * Create an internal link for same-domain navigation
   */
  internal(
    path: string,
    label: string,
    options: Partial<EnhancedLinkProps> = {}
  ) {
    return {
      destination: path,
      children: label,
      routingMode: 'internal' as LinkRoutingMode,
      target: '_self' as LinkTarget,
      ...options,
    }
  },

  /**
   * Create a SPA link using History API
   */
  spa(path: string, label: string, options: Partial<EnhancedLinkProps> = {}) {
    return {
      destination: path,
      children: label,
      routingMode: 'spa' as LinkRoutingMode,
      target: '_self' as LinkTarget,
      accessibilityHint: 'Navigates within the app',
      ...options,
    }
  },

  /**
   * Create an email link with optional subject and body
   */
  email(address: string, subject?: string, body?: string, label?: string) {
    let mailto = `mailto:${address}`
    const params = new URLSearchParams()

    if (subject) params.append('subject', subject)
    if (body) params.append('body', body)

    if (params.toString()) {
      mailto += `?${params.toString()}`
    }

    return {
      destination: mailto,
      children: label || address,
      accessibilityLabel: `Send email to ${address}`,
      accessibilityHint: 'Opens your email app',
    }
  },

  /**
   * Create a phone link with formatted display
   */
  phone(phoneNumber: string, label?: string) {
    // Clean phone number for tel: link
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '')

    return {
      destination: `tel:${cleanNumber}`,
      children: label || phoneNumber,
      accessibilityLabel: `Call ${phoneNumber}`,
      accessibilityHint: 'Opens your phone app',
    }
  },

  /**
   * Create a download link
   */
  download(url: string, filename?: string, label?: string) {
    return {
      destination: url,
      children: label || `Download ${filename || 'file'}`,
      download: filename || true,
      accessibilityLabel: `Download ${filename || 'file'}`,
      accessibilityHint: 'Downloads file to your device',
    }
  },

  /**
   * Social media link utilities
   */
  social: {
    twitter(username: string, label?: string) {
      return LinkUtils.external(
        `https://twitter.com/${username}`,
        label || `@${username}`,
        { accessibilityLabel: `Visit ${username} on Twitter` }
      )
    },

    github(username: string, label?: string) {
      return LinkUtils.external(
        `https://github.com/${username}`,
        label || username,
        { accessibilityLabel: `Visit ${username} on GitHub` }
      )
    },

    linkedin(profile: string, label?: string) {
      return LinkUtils.external(
        `https://linkedin.com/in/${profile}`,
        label || profile,
        { accessibilityLabel: `Visit ${profile} on LinkedIn` }
      )
    },

    instagram(username: string, label?: string) {
      return LinkUtils.external(
        `https://instagram.com/${username}`,
        label || `@${username}`,
        { accessibilityLabel: `Visit ${username} on Instagram` }
      )
    },

    facebook(username: string, label?: string) {
      return LinkUtils.external(
        `https://facebook.com/${username}`,
        label || username,
        { accessibilityLabel: `Visit ${username} on Facebook` }
      )
    },
  },

  /**
   * App store link utilities
   */
  appStore: {
    ios(appId: string, label?: string) {
      return LinkUtils.external(
        `https://apps.apple.com/app/id${appId}`,
        label || 'Download from App Store',
        {
          accessibilityLabel: 'Download from the iOS App Store',
          accessibilityHint: 'Opens App Store app or website',
        }
      )
    },

    android(packageName: string, label?: string) {
      return LinkUtils.external(
        `https://play.google.com/store/apps/details?id=${packageName}`,
        label || 'Get it on Google Play',
        {
          accessibilityLabel: 'Download from Google Play Store',
          accessibilityHint: 'Opens Google Play Store app or website',
        }
      )
    },
  },

  /**
   * Create a custom OpenURL action
   */
  openURLAction(handler: (url: string) => boolean): OpenURLAction {
    return (url: string) => (handler(url) ? 'handled' : 'systemAction')
  },
}
