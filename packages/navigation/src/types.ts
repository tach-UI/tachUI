/**
 * SwiftUI-Style Navigation System Types
 *
 * Type definitions for NavigationView, NavigationLink, TabView, and related
 * navigation components that provide SwiftUI-compatible navigation patterns.
 */

import type { Accessor, Binding, ComponentInstance } from '@tachui/core'

/**
 * Navigation destination type
 */
export type NavigationDestination =
  | ComponentInstance
  | (() => ComponentInstance)

/**
 * Navigation path for programmatic navigation
 */
export interface NavigationPath {
  readonly segments: readonly string[]
  readonly count: number
  readonly isEmpty: boolean
  append(segment: string): void
  appendAll(segments: string[]): void
  removeLast(count?: number): void
  clear(): void
  contains(segment: string): boolean
  at(index: number): string | undefined
  readonly last: string | undefined
  replaceAll(segments: string[]): void
  toString(): string
  onChange(listener: (path: NavigationPath) => void): () => void
  copy(): NavigationPath
  equals(other: NavigationPath): boolean
}

/**
 * Navigation stack entry
 */
export interface NavigationStackEntry {
  readonly id: string
  readonly path: string
  readonly component: ComponentInstance
  readonly title?: string
  readonly metadata?: Record<string, unknown>
  readonly timestamp: number
}

/**
 * Navigation context for managing navigation state
 */
export interface NavigationContext {
  readonly navigationId: string
  readonly stack: NavigationStackEntry[]
  readonly currentPath: string
  push(destination: NavigationDestination, path: string, title?: string): void
  pop(): void
  popToRoot(): void
  popTo(path: string): void
  replace(
    destination: NavigationDestination,
    path: string,
    title?: string
  ): void
  canGoBack: boolean
  canGoForward: boolean
}

/**
 * NavigationView configuration options
 */
export interface NavigationViewOptions {
  navigationBarHidden?: boolean
  navigationTitle?: string | Accessor<string>
  backButtonTitle?: string
  navigationBarTitleDisplayMode?: 'automatic' | 'inline' | 'large'
  toolbarBackground?: string
  onNavigationChange?: (context: NavigationContext) => void
}

/**
 * NavigationLink configuration options (SwiftUI compatible)
 */
export interface NavigationLinkOptions {
  isActive?: boolean | Binding<boolean>
  tag?: string
  onTap?: () => void
  disabled?: boolean
  accessibilityLabel?: string
  accessibilityHint?: string
}

/**
 * Tab item configuration for TabView
 */
export interface TabItem {
  readonly id: string
  readonly title: string
  readonly icon?: string
  readonly badge?: string | number
  readonly content: ComponentInstance
  readonly disabled?: boolean
}

/**
 * TabView configuration options
 */
export interface TabViewOptions {
  selection?: Binding<string>
  tabPlacement?: 'automatic' | 'top' | 'bottom'
  backgroundColor?: string
  accentColor?: string
  onSelectionChange?: (selectedId: string) => void
}

/**
 * Navigation bar button configuration
 */
export interface NavigationBarButton {
  readonly id: string
  readonly title?: string
  readonly icon?: string
  readonly placement: 'leading' | 'trailing'
  readonly action: () => void
  readonly disabled?: boolean
}

/**
 * Navigation bar configuration
 */
export interface NavigationBarConfig {
  title?: string | Accessor<string>
  titleDisplayMode?: 'automatic' | 'inline' | 'large'
  backgroundColor?: string
  foregroundColor?: string
  hidden?: boolean
  backButtonHidden?: boolean
  backButtonTitle?: string
  buttons?: NavigationBarButton[]
}

/**
 * Navigation gesture configuration
 */
export interface NavigationGestureConfig {
  swipeToGoBack?: boolean
  swipeThreshold?: number
  animationDuration?: number
}

/**
 * Navigation animation types
 */
export type NavigationAnimation =
  | 'slide'
  | 'fade'
  | 'scale'
  | 'push'
  | 'present'
  | 'none'

/**
 * Navigation transition configuration
 */
export interface NavigationTransition {
  animation: NavigationAnimation
  duration?: number
  easing?: string
  direction?: 'forward' | 'backward'
}

/**
 * Navigation router interface for programmatic navigation
 */
export interface NavigationRouter {
  readonly currentPath: string
  readonly canGoBack: boolean
  readonly canGoForward: boolean
  navigate(
    path: string,
    options?: { replace?: boolean; animate?: boolean }
  ): void
  goBack(): void
  goForward(): void
  push(destination: NavigationDestination, path?: string): void
  pop(): void
  popToRoot(): void
  replace(destination: NavigationDestination, path?: string): void
}

/**
 * Deep linking configuration
 */
export interface DeepLinkConfig {
  scheme?: string
  host?: string
  pathPattern: string
  component: NavigationDestination
  metadata?: Record<string, unknown>
}

/**
 * Navigation coordinator for managing complex navigation flows
 */
export interface NavigationCoordinator {
  readonly id: string
  readonly routes: Map<string, DeepLinkConfig>
  registerRoute(path: string, config: DeepLinkConfig): void
  unregisterRoute(path: string): void
  handleURL(url: string): boolean
  buildURL(path: string, params?: Record<string, string>): string
}

/**
 * Tab coordinator for managing tab-based navigation
 */
export interface TabCoordinator {
  readonly activeTabId: string
  readonly tabs: TabItem[]
  addTab(tab: TabItem): void
  removeTab(tabId: string): void
  selectTab(tabId: string): void
  updateTabBadge(tabId: string, badge?: string | number): void
}

/**
 * Navigation state persistence options
 */
export interface NavigationPersistenceConfig {
  enabled: boolean
  storageKey?: string
  restoreOnLoad?: boolean
  maxStackSize?: number
}

/**
 * Navigation accessibility configuration
 */
export interface NavigationAccessibilityConfig {
  announceRouteChanges?: boolean
  backButtonLabel?: string
  tabButtonLabels?: Record<string, string>
  landmarkRoles?: boolean
}

/**
 * Navigation component base interface
 */
export interface NavigationComponent extends ComponentInstance {
  readonly navigationContext?: NavigationContext
  readonly router?: NavigationRouter
}

/**
 * Navigation event types
 */
export type NavigationEvent =
  | 'willNavigate'
  | 'didNavigate'
  | 'willPop'
  | 'didPop'
  | 'tabDidChange'
  | 'routeNotFound'

/**
 * Navigation event listener
 */
export type NavigationEventListener = (
  event: NavigationEvent,
  data: unknown
) => void

/**
 * Navigation manager interface
 */
export interface NavigationManager {
  readonly routers: Map<string, NavigationRouter>
  readonly coordinators: Map<string, NavigationCoordinator>
  createRouter(id: string): NavigationRouter
  destroyRouter(id: string): void
  getRouter(id: string): NavigationRouter | undefined
  createCoordinator(id: string): NavigationCoordinator
  destroyCoordinator(id: string): void
  getCoordinator(id: string): NavigationCoordinator | undefined
  addEventListener(
    event: NavigationEvent,
    listener: NavigationEventListener
  ): void
  removeEventListener(
    event: NavigationEvent,
    listener: NavigationEventListener
  ): void
}

/**
 * URL parsing utilities
 */
export interface URLComponents {
  scheme?: string
  host?: string
  path: string
  query?: Record<string, string>
  fragment?: string
}

/**
 * Navigation history entry
 */
export interface NavigationHistoryEntry {
  readonly id: string
  readonly path: string
  readonly title?: string
  readonly state?: Record<string, unknown>
  readonly timestamp: number
}

/**
 * Navigation history manager
 */
export interface NavigationHistory {
  readonly entries: NavigationHistoryEntry[]
  readonly currentIndex: number
  readonly canGoBack: boolean
  readonly canGoForward: boolean
  pushState(path: string, title?: string, state?: Record<string, unknown>): void
  replaceState(
    path: string,
    title?: string,
    state?: Record<string, unknown>
  ): void
  go(delta: number): void
  back(): void
  forward(): void
  clear(): void
}
