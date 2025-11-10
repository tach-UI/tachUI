/**
 * NavigationLink Component Implementation
 *
 * Implements SwiftUI's NavigationLink component that provides declarative
 * navigation to other views with automatic navigation stack management.
 */

import type { Binding, ComponentInstance } from '@tachui/core'
import {
  createEffect,
  createSignal,
  getSignalImpl,
  isBinding,
  isSignal,
} from '@tachui/core'
import { HTML } from '@tachui/primitives'
import { useNavigation } from './navigation-view'
import { useNavigationEnvironmentContext } from './navigation-environment'
import { createNavigationRouter } from './navigation-router'
import type { NavigationDestination, NavigationLinkOptions } from './types'

/**
 * NavigationLink component factory
 *
 * Creates a navigation link that pushes a new view onto the navigation stack
 * when tapped. Provides SwiftUI-compatible navigation behavior.
 *
 * SwiftUI API Compatibility:
 * NavigationLink(label, destination: NavigationDestination)
 * NavigationLink(destination: NavigationDestination) { CustomLabel() }
 *
 * @param label - The label to display (SwiftUI pattern: label first)
 * @param destination - The view to navigate to (SwiftUI pattern: destination parameter)
 * @param options - Additional configuration options
 * @returns A NavigationLink component
 *
 * @example
 * ```typescript
 * // Basic navigation link with text label (SwiftUI style)
 * NavigationLink(
 *   Text("Go to Detail"),
 *   () => DetailView(),
 *   { tag: 'detail' }
 * )
 *
 * // Navigation link with custom label (SwiftUI style)
 * NavigationLink(
 *   Layout.HStack({
 *     children: [
 *       Image('icon.png'),
 *       Text('Settings')
 *     ]
 *   }),
 *   DetailView()
 * )
 *
 * // Programmatic navigation with binding
 * const isActive = State(false)
 * NavigationLink(
 *   Text("Settings"),
 *   SettingsView(),
 *   { isActive: isActive.projectedValue }
 * )
 * ```
 */
export function NavigationLink(
  label: ComponentInstance | string,
  destination: NavigationDestination,
  options: Partial<NavigationLinkOptions> = {}
): ComponentInstance {
  // Get navigation context (try new environment system first, fallback to old system)
  const envContext = useNavigationEnvironmentContext()
  const navigation = envContext
    ? createNavigationRouter(envContext)
    : useNavigation()

  // Internal state for interaction
  const [isPressed, setIsPressed] = createSignal(false)
  const linkId = `nav-link-${Date.now()}-${Math.random()}`

  // Convert label to component if string
  const labelComponent =
    typeof label === 'string'
      ? HTML.span({ children: label }).build()
      : label

  // Navigation handler
  const handleNavigation = () => {
    if (options.disabled) {
      return
    }

    // Call custom onTap handler if provided
    if (options.onTap) {
      options.onTap()
    }

    // Perform navigation
    const destinationPath = options.tag || `/destination-${Date.now()}`
    const destinationTitle =
      extractTitleFromComponent(labelComponent) || 'Details'

    navigation.push(destination, destinationPath, destinationTitle)
  }

  // Handle programmatic activation
  if (options.isActive && isBinding(options.isActive)) {
    createEffect(() => {
      const isActive = options.isActive!
      if (isBinding(isActive) && isActive.get()) {
        handleNavigation()
        // Reset the binding to false after navigation
        isActive.set(false)
      }
    })
  }
  // Support plain signal for isActive
  if (options.isActive && isSignal(options.isActive)) {
    // Intercept setter to synchronously reset when set to true
    const impl = getSignalImpl(options.isActive as any)
    if (impl) {
      const originalSet = impl.set.bind(impl)
      ;(impl as any).set = (value: any) => {
        const result = originalSet(value as any)
        const current =
          typeof options.isActive === 'function'
            ? (options.isActive as () => boolean)()
            : (options.isActive as any)?.get?.()
        if (current === true) {
          handleNavigation()
          originalSet(false as any)
        }
        return result
      }
    } else {
      createEffect(() => {
        const active =
          typeof options.isActive === 'function'
            ? (options.isActive as () => boolean)()
            : (options.isActive as any)?.get?.()
        if (active) {
          handleNavigation()
          const impl2 = getSignalImpl(options.isActive as any)
          impl2?.set(false)
        }
      })
    }
  }

  // Create navigation link as modifiable component with proper modifier support
  const navigationLink = HTML.div({
    children: [labelComponent],
  })

  // Apply basic styling and accessibility properties
  ;(navigationLink as any).props = {
    ...(navigationLink as any).props,
    style: {
      cursor: options.disabled ? 'default' : 'pointer',
      userSelect: 'none',
      transition: 'all 0.1s ease-in-out',
    },
    onClick: options.disabled ? undefined : handleNavigation,
    onKeyDown: options.disabled
      ? undefined
      : (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleNavigation()
          }
        },
    onFocus: () => {
      // Handle focus for accessibility
      console.log('NavigationLink focused')
    },
    onBlur: () => {
      // Handle blur for accessibility
      console.log('NavigationLink blurred')
    },
    role: 'button',
    tabIndex: options.disabled ? -1 : 0,
    ...(options.accessibilityLabel && {
      'aria-label': options.accessibilityLabel,
    }),
    ...(options.accessibilityHint && {
      'aria-describedby': `${linkId}-hint`,
    }),
  }

  // Add modifier support for tests
  const modifierMethods = {
    outline: (value: string) => {
      ;(navigationLink as any).props = {
        ...(navigationLink as any).props,
        style: {
          ...(navigationLink as any).props?.style,
          outline: value,
        },
      }
      return modifierMethods
    },
    outlineOffset: (value: string | number) => {
      ;(navigationLink as any).props = {
        ...(navigationLink as any).props,
        style: {
          ...(navigationLink as any).props?.style,
          outlineOffset: typeof value === 'number' ? `${value}px` : value,
        },
      }
      return modifierMethods
    },
    minHeight: (value: string | number) => {
      ;(navigationLink as any).props = {
        ...(navigationLink as any).props,
        style: {
          ...(navigationLink as any).props?.style,
          minHeight: typeof value === 'number' ? `${value}px` : value,
        },
      }
      return modifierMethods
    },
    minWidth: (value: string | number) => {
      ;(navigationLink as any).props = {
        ...(navigationLink as any).props,
        style: {
          ...(navigationLink as any).props?.style,
          minWidth: typeof value === 'number' ? `${value}px` : value,
        },
      }
      return modifierMethods
    },
    build: () => navigationLink,
  }

  ;(navigationLink as any).modifier = modifierMethods

  // Add build method for tests
  ;(navigationLink as any).build = () => navigationLink

  const finalLink = navigationLink

  // Add navigation link metadata and behavior
  ;(finalLink as any)._navigationLink = {
    destination,
    tag: options.tag,
    linkId,
    isActive: options.isActive,
    type: 'NavigationLink',
  }

  // Add gesture handling without Button dependency
  if (!options.disabled) {
    // Click handling
    ;(finalLink as any).onClick = handleNavigation

    // Press state handling for visual feedback
    ;(finalLink as any).onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      setIsPressed(true)
    }
    ;(finalLink as any).onMouseUp = () => {
      setIsPressed(false)
    }
    ;(finalLink as any).onMouseLeave = () => {
      setIsPressed(false)
    }
    ;(finalLink as any).onTouchStart = (e: TouchEvent) => {
      e.preventDefault()
      setIsPressed(true)
    }
    ;(finalLink as any).onTouchEnd = () => {
      setIsPressed(false)
    }
    ;(finalLink as any).onTouchCancel = () => {
      setIsPressed(false)
    }

    // Apply press state styles
    createEffect(() => {
      const linkElement = (finalLink as any).element
      if (linkElement && isPressed()) {
        linkElement.style.transform = 'scale(0.98)'
        linkElement.style.opacity = '0.8'
      } else if (linkElement) {
        linkElement.style.transform = 'scale(1)'
        linkElement.style.opacity = '1'
      }
    })
  } else {
    // Disabled state styling
    ;(navigationLink as any).props = {
      ...(navigationLink as any).props,
      style: {
        ...(navigationLink as any).props?.style,
        opacity: '0.6',
      },
    }
  }

  // Expose onTap on props for tests to trigger
  ;(finalLink as any).props = {
    ...(finalLink as any).props,
    onTap: () => {
      if (options.onTap) options.onTap()
      if (!options.disabled) handleNavigation()
    },
  }

  return finalLink
}

/**
 * Create a navigation link with custom styling
 *
 * @param label - The label component or string
 * @param destination - The destination view
 * @param options - Navigation link options including styling
 * @returns A styled NavigationLink component
 */
export function StyledNavigationLink(
  label: ComponentInstance | string,
  destination: NavigationDestination,
  options: Partial<NavigationLinkOptions> & {
    style?: 'plain' | 'button' | 'card' | 'listItem'
    backgroundColor?: string
    foregroundColor?: string
    cornerRadius?: number
  } = {}
): ComponentInstance {
  const {
    style = 'plain',
    backgroundColor,
    foregroundColor,
    cornerRadius,
    ...linkOptions
  } = options

  let styledLabel = label

  // Apply built-in styles
  switch (style) {
    case 'button':
      styledLabel = HTML.div({
        children: [
          typeof label === 'string' ? HTML.span({ children: label }) : label,
        ],
      })
        .backgroundColor(backgroundColor || '#007AFF')
        .foregroundColor(foregroundColor || '#ffffff')
        .padding({ top: 12, bottom: 12, left: 24, right: 24 })
        .cornerRadius(cornerRadius || 8)
        .fontWeight('500')
        .build()
      break

    case 'card':
      styledLabel = HTML.div({
        children: [
          typeof label === 'string' ? HTML.span({ children: label }) : label,
        ],
      })
        .backgroundColor(backgroundColor || '#ffffff')
        .foregroundColor(foregroundColor || '#333333')
        .padding(16)
        .cornerRadius(cornerRadius || 12)
        .cssProperty('boxShadow', '0 2px 8px rgba(0,0,0,0.1)')
        .border(1, '#e0e0e0')
        .build()
      break

    case 'listItem':
      styledLabel = HTML.div({
        children: [
          typeof label === 'string' ? HTML.span({ children: label }) : label,
        ],
      })
        .backgroundColor(backgroundColor || 'transparent')
        .foregroundColor(foregroundColor || '#333333')
        .padding({ top: 16, bottom: 16, left: 20, right: 20 })
        .border(1, '#e0e0e0')
        .build()
      break

    default: // 'plain'
      // Keep original label styling
      break
  }

  return NavigationLink(styledLabel, destination, linkOptions)
}

/**
 * Create a navigation link that appears as a list row
 *
 * @param title - The row title
 * @param destination - The destination view
 * @param subtitle - Optional subtitle
 * @param accessories - Optional trailing accessories
 * @returns A list-style NavigationLink component
 */
export function NavigationListLink(
  title: string,
  destination: NavigationDestination,
  subtitle?: string,
  accessories?: ComponentInstance[]
): ComponentInstance {
  const label = HTML.div({
    children: [
      // Main content
      HTML.div({
        children: [
          HTML.div({
            children: title,
          })
            .fontSize(16)
            .fontWeight('500')
            .foregroundColor('#333333')
            .build(),

          ...(subtitle
            ? [
                HTML.div({
                  children: subtitle,
                })
                  .fontSize(14)
                  .foregroundColor('#666666')
                  .margin({ top: 4 })
                  .build(),
              ]
            : []),
        ],
      }).build(),

      // Accessories
      ...(accessories || []),

      // Chevron
      HTML.div({
        children: '›',
      })
        .fontSize(18)
        .foregroundColor('#c0c0c0')
        .fontWeight('300')
        .build(),
    ],
  })
    .padding({ top: 16, bottom: 16, left: 20, right: 20 })
    .backgroundColor('#ffffff')
    .border(1, '#e0e0e0')
    .build()

  return NavigationLink(label, destination, {
    tag: title.toLowerCase().replace(/\s+/g, '-'),
  })
}

/**
 * Create a navigation link with icon
 *
 * @param icon - Icon string or component
 * @param title - Link title
 * @param destination - The destination view
 * @param options - Additional options
 * @returns An icon-style NavigationLink component
 */
export function NavigationIconLink(
  icon: string | ComponentInstance,
  title: string,
  destination: NavigationDestination,
  options: Partial<NavigationLinkOptions> = {}
): ComponentInstance {
  const iconComponent =
    typeof icon === 'string'
      ? HTML.div({ children: icon })
          .fontSize(20)
          .frame({ width: 24, height: 24 })
          .build()
      : icon

  const label = HTML.div({
    children: [
      iconComponent,
      HTML.div({ children: title })
        .fontSize(16)
        .fontWeight('500')
        .margin({ left: 12 })
        .build(),
    ],
  })
    .padding({ top: 12, bottom: 12, left: 16, right: 16 })
    .build()

  return NavigationLink(label, destination, options)
}

/**
 * Navigation link builder for declarative API
 */
export const NavigationLinkBuilder = {
  /**
   * Create a navigation link to destination (SwiftUI style)
   */
  to(destination: NavigationDestination) {
    return {
      label: (label: ComponentInstance) => NavigationLink(label, destination),
      text: (text: string) => NavigationLink(text, destination),
      button: (text: string) =>
        StyledNavigationLink(text, destination, { style: 'button' }),
      card: (content: ComponentInstance) =>
        StyledNavigationLink(content, destination, { style: 'card' }),
      listItem: (title: string, subtitle?: string) =>
        NavigationListLink(title, destination, subtitle),
    }
  },

  /**
   * Create a programmatic navigation link
   */
  programmatic(destination: NavigationDestination, isActive: Binding<boolean>) {
    return NavigationLink('', destination, { isActive })
  },
}

/**
 * Extract title from component for navigation bar
 */
function extractTitleFromComponent(
  component?: ComponentInstance
): string | undefined {
  if (!component) return undefined

  // Try to extract text from component
  if (typeof component === 'object') {
    // Check if it's a text component
    if (
      (component as any).type === 'text' &&
      (component as any).props?.children
    ) {
      return String((component as any).props.children)
    }

    // Check children recursively
    if (
      (component as any).children &&
      Array.isArray((component as any).children)
    ) {
      for (const child of (component as any).children) {
        const title = extractTitleFromComponent(child)
        if (title) return title
      }
    }
  }

  return undefined
}

/**
 * Type guard for NavigationLink components
 */
export function isNavigationLink(component: any): boolean {
  return (
    component && typeof component === 'object' && '_navigationLink' in component
  )
}

/**
 * Get navigation link metadata
 */
export function getNavigationLinkMetadata(component: any): any {
  if (isNavigationLink(component)) {
    return component._navigationLink
  }
  return null
}

/**
 * SwiftUI-style NavigationLink with closure API
 * NavigationLink(destination: NavigationDestination) { CustomLabel() }
 *
 * @param destination - The view to navigate to
 * @param labelBuilder - Function that returns the label component
 * @param options - Additional configuration options
 * @returns A NavigationLink component
 *
 * @example
 * ```typescript
 * // SwiftUI closure-style API
 * NavigationLink(DetailView(), () =>
 *   HStack([
 *     Image('icon.png'),
 *     Text('Go to Detail')
 *   ])
 * )
 * ```
 */
export function NavigationLinkWithClosure(
  destination: NavigationDestination,
  labelBuilder: () => ComponentInstance,
  options: Partial<NavigationLinkOptions> = {}
): ComponentInstance {
  const label = labelBuilder()
  return NavigationLink(label, destination, options)
}

/**
 * Create a batch of navigation links
 *
 * @param links - Array of link configurations (SwiftUI style)
 * @returns Array of NavigationLink components
 */
export function createNavigationLinks(
  links: Array<{
    label: ComponentInstance | string
    destination: NavigationDestination
    tag?: string
    disabled?: boolean
  }>
): ComponentInstance[] {
  return links.map(link => {
    return NavigationLink(link.label, link.destination, {
      tag: link.tag,
      disabled: link.disabled,
    })
  })
}
