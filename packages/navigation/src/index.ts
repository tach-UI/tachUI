/**
 * TachUI Navigation - SwiftUI-Compatible Navigation System
 *
 * Core navigation components for building SwiftUI-style navigation interfaces:
 * - NavigationStack: Modern stack-based navigation
 * - NavigationLink: Declarative navigation links
 * - SimpleTabView: SwiftUI-compatible tab navigation
 * - Navigation Modifiers: SwiftUI-style navigation bar customization
 */

// Core Navigation Components
export {
  NavigationStack,
  navigationDestination,
  navigateToDestination,
  NavigationLinkForDestination,
} from './navigation-stack'

export {
  NavigationSplitView,
  useNavigationSplitView,
} from './navigation-split-view'
export type {
  NavigationSplitViewContext,
  NavigationSplitViewProps,
} from './navigation-split-view'

export {
  NavigationLink,
  NavigationIconLink,
  NavigationListLink,
  StyledNavigationLink,
  NavigationLinkBuilder,
  NavigationLinkWithClosure,
  createNavigationLinks,
  getNavigationLinkMetadata,
  isNavigationLink,
} from './navigation-link'

export {
  SimpleTabView,
  tabItem,
  createSimpleTabView,
  getSimpleTabViewMetadata,
  isSimpleTabView,
} from './simple-tab-view'
export type { SimpleTabItem, SimpleTabViewOptions } from './simple-tab-view'

// Register navigation modifiers on ModifierBuilder (side-effect import)
import './navigation-modifiers-registry'

// Swipe-back gesture
export { createSwipeBackGesture } from './swipe-back-gesture'
export type {
  SwipeBackGestureConfig,
  SwipeBackGestureCallbacks,
  SwipeBackGestureState,
} from './swipe-back-gesture'

// Navigation animations
export {
  animateTransition,
  getPushKeyframes,
  getPopKeyframes,
  getSpringPhysics,
  calculateSpringDuration,
  prefersReducedMotion,
} from './navigation-animations'
export type {
  TransitionType,
  TransitionConfig,
  SpringTransitionConfig,
  SpringPhysics,
  AnimationKeyframe,
} from './navigation-animations'

// Navigation Modifiers (SwiftUI-compatible)
export {
  navigationTitle,
  navigationBarTitleDisplayMode,
  navigationBarHidden,
  navigationBarBackButtonHidden,
  navigationBarBackButtonTitle,
  navigationBarItems,
  toolbar,
  toolbarItems,
  ToolbarItem,
  presentationDetents,
  getToolbarItemsByPlacement,
  toolbarBackground,
  toolbarBackgroundVisibility,
  toolbarForegroundColor,
  searchable,
  searchSuggestions,
  searchScopes,
  sheet,
  fullScreenCover,
  popover,
  confirmationDialog,
  inspector,
  inspectorColumnWidth,
  extractNavigationModifiers,
  getCurrentNavigationModifiers,
  hasNavigationModifiers,
  clearNavigationModifiers,
  enhanceNavigationStackWithModifiers,
  onNavigationModifierChange,
  NavigationModifierUtils,
} from './navigation-modifiers'
export type {
  SheetPresentationOptions,
  FullScreenCoverOptions,
  PopoverArrowEdge,
  PopoverPresentationOptions,
  SearchablePlacement,
  SearchScopeOption,
  SearchScopeState,
  SearchScopesConfig,
  SearchSuggestionsInput,
  SearchableTextState,
  ConfirmationDialogAction,
  ConfirmationDialogButtonRole,
  PresentationDetent,
  ToolbarItemPlacement,
  ToolbarBackgroundVisibility,
  ToolbarBackgroundVisibilityTarget,
  ToolbarItemConfig,
  ToolbarItemInput,
  InspectorPresentationOptions,
  InspectorColumnWidthConfig,
  InspectorPresentationState,
} from './navigation-modifiers'

// Navigation Environment System
export {
  useNavigationEnvironmentContext,
  useNavigationEnvironmentRouter,
  useNavigationEnvironmentState,
  useNavigationEnvironment,
  NavigationEnvironmentProvider,
  NavigationEnvironmentUtils,
  clearNavigationEnvironment,
  getNavigationEnvironment,
  hasNavigationEnvironment,
  withNavigationEnvironment,
} from './navigation-environment'

// Navigation Path Management
export {
  NavigationPath,
  createNavigationPath,
  createTypedNavigationPath,
} from './navigation-path'
export type {
  NavigationPathElement,
  TypedNavigationPath,
} from './navigation-path'

// Enhanced TabView - Using existing tab-view.ts with enhanced features
export {
  TabView as EnhancedTabView,
  createTabItem,
  isTabView as isEnhancedTabView,
  TabViewBuilder,
  useTabCoordination,
  getTabCoordinator,
} from './tab-view'

// Legacy Components (Backwards Compatibility)
import { NavigationView } from './navigation-view'
import { TabView } from './tab-view'

export {
  NavigationView,
  useNavigation,
  useNavigationContext,
  useNavigationRouter,
  useNavigationBar,
  createNavigationView,
  isNavigationComponent,
  NavigationViewBuilder,
} from './navigation-view'

export { DocumentHead, withDocumentHead, useDocumentMeta } from './document-head'

// TabView exports are already included above - no duplicates needed

// Router and Navigation Management
export {
  createNavigationRouter,
  NavigationRouterBuilder,
  RouterUtils,
  buildURL,
  parseURL,
  extractRouteParams,
  createRouteMatcher,
} from './navigation-router'

export {
  NavigationManager,
  GlobalNavigation,
  createNavigationCoordinator,
  createNavigationEventEmitter,
  NavigationEventEmitter,
} from './navigation-manager'

// Enhanced Navigation Hooks
export {
  useNavigation as useEnhancedNavigation,
  useNavigationContext as useEnhancedNavigationContext,
  useNavigationRouter as useEnhancedNavigationRouter,
  useNavigationBar as useEnhancedNavigationBar,
  useNavigationState,
  useNavigationPath,
  useNavigationAnimation,
  useNavigationCleanup,
  NavigationHookUtils,
} from './enhanced-navigation-hooks'

// Programmatic Navigation
export {
  createProgrammaticNavigationPath,
  ProgrammaticNavigationPath,
  ProgrammaticNavigationUtils,
  NavigationAnimationManager,
  NavigationPersistenceManager,
  DeepLinkManager,
  deepLinkManager,
  navigationAnimationManager,
  navigationPersistenceManager,
} from './programmatic-navigation'

// Core Types
export type {
  NavigationComponent,
  NavigationContext,
  NavigationDestination,
  NavigationLinkOptions,
  NavigationStackEntry,
  NavigationViewOptions,
  NavigationRouter,
  NavigationManager as INavigationManager,
  NavigationPath as INavigationPath,
  NavigationEvent,
  NavigationEventListener,
  NavigationHistory,
  NavigationHistoryEntry,
  NavigationTransition,
  NavigationAnimation,
  NavigationBarConfig,
  NavigationBarButton,
  TabItem,
  TabViewOptions,
  TabCoordinator,
  URLComponents,
  NavigationCoordinator,
  DocumentHeadConfig,
  DocumentHeadValue,
  DeepLinkConfig,
  NavigationPersistenceConfig,
  NavigationGestureConfig,
  NavigationAccessibilityConfig,
} from './types'

// Re-export commonly used state management
export { createBinding, State } from '@tachui/core'

// Export component validation for plugin registration
export * from './validation'

/**
 * Navigation utilities for common patterns
 */
export const NavigationUtils = {
  /**
   * Create a simple navigation stack
   */
  createStack(rootView: any, options: any = {}) {
    return NavigationView(rootView, options)
  },

  /**
   * Create tab-based navigation
   */
  createTabs(tabs: any[], options: any = {}) {
    return TabView(tabs, options)
  },

  /**
   * Check if component is navigation-related
   */
  isNavigationComponent(component: any): boolean {
    return (
      component &&
      typeof component === 'object' &&
      ('navigationContext' in component ||
        'tabCoordinator' in component ||
        '_navigationLink' in component)
    )
  },

  /**
   * Extract navigation metadata from component
   */
  getNavigationMetadata(component: any): any {
    if (!component || typeof component !== 'object') {
      return null
    }

    return {
      type: component.navigationContext
        ? 'NavigationView'
        : component.tabCoordinator
          ? 'TabView'
          : component._navigationLink
            ? 'NavigationLink'
            : 'unknown',
      navigationContext: component.navigationContext,
      tabCoordinator: component.tabCoordinator,
      navigationLink: component._navigationLink,
    }
  },
}

/**
 * Pre-configured navigation components
 */
export const NavigationPresets = {
  /**
   * Simple navigation stack
   */
  SimpleStack: (rootView: any) =>
    NavigationView(rootView, {
      navigationBarTitleDisplayMode: 'inline',
    }),

  /**
   * Large title navigation
   */
  LargeTitleStack: (rootView: any) =>
    NavigationView(rootView, {
      navigationBarTitleDisplayMode: 'large',
    }),

  /**
   * Hidden navigation bar stack
   */
  HiddenBarStack: (rootView: any) =>
    NavigationView(rootView, {
      navigationBarHidden: true,
    }),

  /**
   * Bottom tab navigation
   */
  BottomTabs: (tabs: any[]) =>
    TabView(tabs, {
      tabPlacement: 'bottom',
    }),

  /**
   * Top tab navigation
   */
  TopTabs: (tabs: any[]) =>
    TabView(tabs, {
      tabPlacement: 'top',
    }),
}
