/**
 * Navigation Modifier Builder Registration
 *
 * Extends ModifierBuilderImpl with navigation-specific modifier methods, making
 * them chainable on any component without augmenting the base ComponentInstance
 * interface. This eliminates the type infection that previously caused every
 * ComponentInstance implementor (ShowComponent, ForEachComponent, etc.) to be
 * required to carry navigation methods.
 *
 * The ModifierBuilder augmentation is non-infectious: it only affects the
 * builder/proxy layer, not raw ComponentInstance implementations.
 */

import type { Accessor, Binding, ComponentInstance } from '@tachui/core'
import { ModifierBuilderImpl } from '@tachui/core/modifiers'
import {
  navigationTitle,
  navigationBarTitleDisplayMode,
  navigationBarHidden,
  navigationBarItems,
  navigationBarBackButtonHidden,
  navigationBarBackButtonTitle,
  toolbarBackground,
  toolbarForegroundColor,
  toolbarBackgroundVisibility,
  presentationDetents,
  toolbar,
  toolbarItems,
  sheet,
  fullScreenCover,
  popover,
  searchable,
  searchSuggestions,
  searchScopes,
  confirmationDialog,
  inspector,
  inspectorColumnWidth,
} from './navigation-modifiers'
import type {
  SheetPresentationOptions,
  FullScreenCoverOptions,
  PopoverArrowEdge,
  PopoverPresentationOptions,
  SearchablePlacement,
  SearchScopeOption,
  SearchScopeState,
  SearchSuggestionsInput,
  ConfirmationDialogAction,
  PresentationDetent,
  ToolbarBackgroundVisibility,
  ToolbarBackgroundVisibilityTarget,
  ToolbarItemConfig,
  InspectorPresentationOptions,
  InspectorColumnWidthConfig,
} from './navigation-modifiers'
import { tabItem } from './simple-tab-view'

declare module '@tachui/types/modifiers' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance> {
    navigationTitle(title: string): this
    navigationBarTitleDisplayMode(mode: 'automatic' | 'inline' | 'large'): this
    navigationBarHidden(hidden?: boolean): this
    navigationBarItems(options: {
      leading?: ComponentInstance | ComponentInstance[]
      trailing?: ComponentInstance | ComponentInstance[]
    }): this
    navigationBarBackButtonHidden(hidden?: boolean): this
    navigationBarBackButtonTitle(title: string): this
    toolbarBackground(background: string): this
    toolbarForegroundColor(color: string): this
    toolbarBackgroundVisibility(
      visibility: ToolbarBackgroundVisibility,
      target?: ToolbarBackgroundVisibilityTarget
    ): this
    presentationDetents(detents: PresentationDetent[]): this
    toolbar(items: ToolbarItemConfig[]): this
    toolbarItems(items: ToolbarItemConfig[]): this
    sheet(
      isPresented: Accessor<boolean> | Binding<boolean>,
      content: () => ComponentInstance,
      options?: SheetPresentationOptions
    ): this
    fullScreenCover(
      isPresented: Accessor<boolean> | Binding<boolean>,
      content: () => ComponentInstance,
      options?: FullScreenCoverOptions
    ): this
    popover(
      isPresented: Accessor<boolean> | Binding<boolean>,
      arrowEdge: PopoverArrowEdge,
      content: () => ComponentInstance,
      options?: PopoverPresentationOptions
    ): this
    searchable(
      text: Accessor<string> | Binding<string>,
      placement?: SearchablePlacement
    ): this
    searchSuggestions(suggestions: SearchSuggestionsInput): this
    searchScopes(
      scope: SearchScopeState,
      scopes: SearchScopeOption[]
    ): this
    confirmationDialog(
      title: string,
      isPresented: Accessor<boolean> | Binding<boolean>,
      actions: ConfirmationDialogAction[]
    ): this
    inspector(
      isPresented: Accessor<boolean> | Binding<boolean>,
      content: () => ComponentInstance,
      options?: InspectorPresentationOptions
    ): this
    inspectorColumnWidth(config: InspectorColumnWidthConfig): this
    tabItem(
      id: string,
      label: string,
      icon?: string,
      badge?: string | number | boolean,
      disabled?: boolean
    ): this
  }
}

let installed = false

/**
 * Add the navigation methods to the modifier builder.
 *
 * Navigation modifiers apply eagerly (setting metadata on the component
 * object) rather than deferring to a Modifier.apply() call, which is why they
 * cannot use the standard modifier registry factory pattern: they extend
 * ModifierBuilderImpl's prototype, and the builder proxy routes calls there.
 *
 * This is a function to call, not a module's side effect, because a bundler
 * drops a side effect from any module its package does not list in
 * `sideEffects`, and the build places this code in a hashed chunk that is not
 * listed. The entry points that are listed call it, so the call survives.
 */
export function installNavigationModifierMethods(): void {
  if (installed) return
  installed = true

  const proto = ModifierBuilderImpl.prototype as any

  proto.navigationTitle = function(title: string) {
    navigationTitle((this as any).component, title)
    return this
  }

  proto.navigationBarTitleDisplayMode = function(mode: 'automatic' | 'inline' | 'large') {
    navigationBarTitleDisplayMode((this as any).component, mode)
    return this
  }

  proto.navigationBarHidden = function(hidden = true) {
    navigationBarHidden((this as any).component, hidden)
    return this
  }

  proto.navigationBarItems = function(options: {
    leading?: ComponentInstance | ComponentInstance[]
    trailing?: ComponentInstance | ComponentInstance[]
  }) {
    navigationBarItems((this as any).component, options)
    return this
  }

  proto.navigationBarBackButtonHidden = function(hidden = true) {
    navigationBarBackButtonHidden((this as any).component, hidden)
    return this
  }

  proto.navigationBarBackButtonTitle = function(title: string) {
    navigationBarBackButtonTitle((this as any).component, title)
    return this
  }

  proto.toolbarBackground = function(background: string) {
    toolbarBackground((this as any).component, background)
    return this
  }

  proto.toolbarForegroundColor = function(color: string) {
    toolbarForegroundColor((this as any).component, color)
    return this
  }

  proto.toolbarBackgroundVisibility = function(
    visibility: ToolbarBackgroundVisibility,
    target: ToolbarBackgroundVisibilityTarget = 'navigationBar'
  ) {
    toolbarBackgroundVisibility((this as any).component, visibility, target)
    return this
  }

  proto.presentationDetents = function(detents: PresentationDetent[]) {
    presentationDetents((this as any).component, detents)
    return this
  }

  proto.toolbar = function(items: ToolbarItemConfig[]) {
    toolbar((this as any).component, items)
    return this
  }

  proto.toolbarItems = function(items: ToolbarItemConfig[]) {
    toolbarItems((this as any).component, items)
    return this
  }

  proto.sheet = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    content: () => ComponentInstance,
    options?: SheetPresentationOptions
  ) {
    sheet((this as any).component, isPresented, content, options)
    return this
  }

  proto.fullScreenCover = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    content: () => ComponentInstance,
    options?: FullScreenCoverOptions
  ) {
    fullScreenCover((this as any).component, isPresented, content, options)
    return this
  }

  proto.popover = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    arrowEdge: PopoverArrowEdge,
    content: () => ComponentInstance,
    options?: PopoverPresentationOptions
  ) {
    popover((this as any).component, isPresented, arrowEdge, content, options)
    return this
  }

  proto.searchable = function(
    text: Accessor<string> | Binding<string>,
    placement: SearchablePlacement = 'navigationBar'
  ) {
    searchable((this as any).component, text, placement)
    return this
  }

  proto.searchSuggestions = function(suggestions: SearchSuggestionsInput) {
    searchSuggestions((this as any).component, suggestions)
    return this
  }

  proto.searchScopes = function(scope: SearchScopeState, scopes: SearchScopeOption[]) {
    searchScopes((this as any).component, scope, scopes)
    return this
  }

  proto.confirmationDialog = function(
    title: string,
    isPresented: Accessor<boolean> | Binding<boolean>,
    actions: ConfirmationDialogAction[]
  ) {
    confirmationDialog((this as any).component, title, isPresented, actions)
    return this
  }

  proto.inspector = function(
    isPresented: Accessor<boolean> | Binding<boolean>,
    content: () => ComponentInstance,
    options?: InspectorPresentationOptions
  ) {
    inspector((this as any).component, isPresented, content, options)
    return this
  }

  proto.inspectorColumnWidth = function(config: InspectorColumnWidthConfig) {
    inspectorColumnWidth((this as any).component, config)
    return this
  }

  proto.tabItem = function(
    id: string,
    label: string,
    icon?: string,
    badge?: string | number | boolean,
    disabled?: boolean
  ) {
    tabItem((this as any).component, id, label, icon, badge, disabled)
    return this
  }
}

// Also on import, for source consumers and anything importing this module
// directly. It is idempotent, and the entry points' explicit call is what
// survives a production build.
installNavigationModifierMethods()
