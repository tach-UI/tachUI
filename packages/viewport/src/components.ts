/**
 * SwiftUI-Style Viewport Components
 *
 * Provides Window and WindowGroup components that mirror SwiftUI's window management APIs.
 */

import type { ComponentInstance } from '@tachui/core'
import { withComponentContext } from '@tachui/core'
import { createRoot } from '@tachui/core'
import type { PlatformDetectionConfig } from './platform-detection'
import type {
  WindowGroup as IWindowGroup,
  StateSyncScope,
  WindowGroupingStrategy,
  WindowOptions,
  WindowPoolConfig,
  WindowTabConfig,
} from './types'
import { getViewportManager } from './viewport-manager'

/**
 * SwiftUI-style Window component
 * Creates a single, unique window that prevents duplicates
 */
export interface WindowProps extends WindowOptions {
  id: string
  title?: string
  children: () => ComponentInstance
}

export function Window(props: WindowProps): WindowSceneComponent {
  return {
    type: 'window-scene',
    sceneType: 'window',
    id: props.id,
    title: props.title || props.id,
    content: props.children,
    options: props,

    // Render method for scene management
    render(): ComponentInstance {
      return {
        type: 'component',
        id: `window-scene-${props.id}`,
        props: {},
        render: () => {
          // This component doesn't render directly - it's managed by the viewport system
          return {
            type: 'element' as const,
            tag: 'div',
            props: {},
            children: [],
            element: document.createElement('div'),
          }
        },
      }
    },

    // Open this window
    async open(): Promise<void> {
      const manager = getViewportManager()

      // First establish reactive root, then component context within it
      const wrappedComponent = createRoot(() => {
        return withComponentContext((_: any) => {
          // Execute children function within both reactive and component context
          const childComponent = props.children()
          return childComponent
        }, `Window-${props.id}`)({})
      })

      await manager.openWindow(props.id, wrappedComponent, props)
    },

    // Close this window
    async close(): Promise<void> {
      const manager = getViewportManager()
      await manager.dismissWindow(props.id)
    },
  }
}

/**
 * SwiftUI-style WindowGroup component
 * Creates a group of windows that can have multiple instances
 */
export interface WindowGroupProps<T = any> extends WindowOptions {
  id: string
  title?: string
  for?: new () => T // Type parameter for data-driven windows
  children: T extends undefined
    ? () => ComponentInstance
    : (data: T) => ComponentInstance

  // Phase 2: Enhanced configuration options
  groupingStrategy?: WindowGroupingStrategy
  tabConfig?: WindowTabConfig
  poolConfig?: WindowPoolConfig
  stateSyncScope?: StateSyncScope
  maxInstances?: number
}

export function WindowGroup<T = undefined>(
  props: WindowGroupProps<T>
): WindowGroupComponent<T> {
  const manager = getViewportManager()
  const group = manager.createWindowGroup(props.id)

  // Phase 2: Configure enhanced features
  if (props.groupingStrategy) {
    group.setGroupingStrategy(props.groupingStrategy)
  }

  if (props.tabConfig) {
    group.configureTabbing(props.tabConfig)
  }

  if (props.poolConfig) {
    group.configurePool(props.poolConfig)
  }

  if (props.stateSyncScope) {
    group.enableStateSync(props.stateSyncScope)
  }

  if (props.maxInstances) {
    group.setMaxInstances(props.maxInstances)
  }

  // Set default window options
  const {
    groupingStrategy: _groupingStrategy,
    tabConfig: _tabConfig,
    poolConfig: _poolConfig,
    stateSyncScope: _stateSyncScope,
    maxInstances: _maxInstances,
    ...windowOptions
  } = props
  group.setDefaultOptions(windowOptions)

  return {
    type: 'window-group',
    sceneType: 'window-group',
    id: props.id,
    title: props.title || props.id,
    content: props.children,
    options: props,
    group,

    // Render method for scene management
    render(): ComponentInstance {
      return {
        type: 'component',
        id: `window-group-${props.id}`,
        props: {},
        render: () => {
          // This component doesn't render directly - it's managed by the viewport system
          return {
            type: 'element' as const,
            tag: 'div',
            props: {},
            children: [],
            element: document.createElement('div'),
          }
        },
      }
    },

    // Open a window (data-driven or simple)
    async open(data?: T): Promise<void> {
      if (data !== undefined && props.for) {
        // Data-driven window
        await group.openWindow(
          data,
          props.children as (data: T) => ComponentInstance
        )
      } else {
        // Simple window
        const component = (props.children as () => ComponentInstance)()
        await manager.openWindow(props.id, component, props)
      }
    },

    // Open window for specific data
    async openForData(data: T): Promise<void> {
      if (!props.for) {
        throw new Error(
          'WindowGroup must specify "for" parameter for data-driven windows'
        )
      }
      await group.openWindow(
        data,
        props.children as (data: T) => ComponentInstance
      )
    },

    // Close all windows in this group
    async closeAll(): Promise<void> {
      await group.closeAllWindows()
    },

    // Get all windows in this group
    getWindows() {
      return group.getAllWindows()
    },

    // Phase 2: Enhanced methods
    configureGrouping(strategy: WindowGroupingStrategy): void {
      group.setGroupingStrategy(strategy)
    },

    configureTabs(config: WindowTabConfig): void {
      group.configureTabbing(config)
    },

    configurePooling(config: WindowPoolConfig): void {
      group.configurePool(config)
    },

    enableStateSync(scope: StateSyncScope): void {
      group.enableStateSync(scope)
    },

    syncGroupState<S>(key: string, value: S): void {
      group.syncState(key, value)
    },

    getGroupState<S>(key: string): S | undefined {
      return group.getSharedState(key)
    },

    onGroupStateChange<S>(
      key: string,
      callback: (value: S) => void
    ): () => void {
      return group.onStateChange(key, callback)
    },
  }
}

/**
 * WindowScene component interface
 */
export interface WindowSceneComponent {
  type: 'window-scene'
  sceneType: 'window'
  id: string
  title: string
  content: () => ComponentInstance
  options: WindowOptions

  render(): ComponentInstance
  open(): Promise<void>
  close(): Promise<void>
}

/**
 * WindowGroup component interface
 */
export interface WindowGroupComponent<T = any> {
  type: 'window-group'
  sceneType: 'window-group'
  id: string
  title: string
  content: T extends undefined
    ? () => ComponentInstance
    : (data: T) => ComponentInstance
  options: WindowOptions
  group: IWindowGroup

  render(): ComponentInstance
  open(data?: T): Promise<void>
  openForData(data: T): Promise<void>
  closeAll(): Promise<void>
  getWindows(): import('./types').ViewportInstance[]

  // Phase 2: Enhanced methods
  configureGrouping(strategy: WindowGroupingStrategy): void
  configureTabs(config: WindowTabConfig): void
  configurePooling(config: WindowPoolConfig): void
  enableStateSync(scope: StateSyncScope): void
  syncGroupState<S>(key: string, value: S): void
  getGroupState<S>(key: string): S | undefined
  onGroupStateChange<S>(key: string, callback: (value: S) => void): () => void
}

/**
 * Scene type union
 */
export type WindowScene = WindowSceneComponent | WindowGroupComponent

/**
 * App-level scene container (SwiftUI App equivalent)
 */
export interface AppSceneProps {
  children: WindowScene[]
  /** Platform detection configuration to disable potentially intrusive capability tests */
  platformConfig?: PlatformDetectionConfig
}

export function App(props: AppSceneProps): AppComponent {
  return {
    type: 'app',
    scenes: props.children,

    render(): ComponentInstance {
      return {
        type: 'component',
        id: 'tachui-app',
        props: {},
        render: () => {
          // App component manages scenes but doesn't render them directly
          return {
            type: 'element' as const,
            tag: 'div',
            props: {},
            children: [],
            element: document.createElement('div'),
          }
        },
      }
    },

    // Initialize all scenes
    async initialize(): Promise<void> {
      // Set up viewport environment for the app
      const manager = getViewportManager(props.platformConfig)
      // Initialize the viewport system if not already done
      if (!manager) {
        const { initializeViewportSystem } = await import('./index')
        initializeViewportSystem()
      }
    },

    // Get scene by ID
    getScene(id: string): WindowScene | undefined {
      return props.children.find(scene => scene.id === id)
    },

    // Open a specific scene
    async openScene(id: string, data?: any): Promise<void> {
      const scene = this.getScene(id)
      if (!scene) {
        throw new Error(`Scene with id '${id}' not found`)
      }

      if (scene.type === 'window-scene') {
        await scene.open()
      } else if (scene.type === 'window-group') {
        await scene.open(data)
      }
    },
  }
}

/**
 * App component interface
 */
export interface AppComponent {
  type: 'app'
  scenes: WindowScene[]

  render(): ComponentInstance
  initialize(): Promise<void>
  getScene(id: string): WindowScene | undefined
  openScene(id: string, data?: any): Promise<void>
}

/**
 * Utility functions for window management
 */
export const WindowUtils = {
  /**
   * Create a document window group
   */
  documentGroup<T>(
    id: string,
    title: string,
    documentType: new () => T,
    content: (document: T) => ComponentInstance
  ): WindowGroupComponent<T> {
    return WindowGroup({
      id,
      title,
      for: documentType,
      children: content as any,
      width: 800,
      height: 600,
      resizable: true,
    })
  },

  /**
   * Create a settings window
   */
  settingsWindow(content: () => ComponentInstance): WindowSceneComponent {
    return Window({
      id: 'settings',
      title: 'Settings',
      width: 600,
      height: 400,
      resizable: false,
      children: content,
    })
  },

  /**
   * Create an inspector window
   */
  inspectorWindow(content: () => ComponentInstance): WindowSceneComponent {
    return Window({
      id: 'inspector',
      title: 'Inspector',
      width: 300,
      height: 500,
      resizable: true,
      alwaysOnTop: true,
      children: content,
    })
  },

  /**
   * Create a palette window
   */
  paletteWindow(
    id: string,
    title: string,
    content: () => ComponentInstance
  ): WindowSceneComponent {
    return Window({
      id,
      title,
      width: 250,
      height: 400,
      resizable: false,
      alwaysOnTop: true,
      children: content,
    })
  },
}

/**
 * Example usage patterns
 */
export const ExampleScenes = {
  /**
   * Basic app with main window and settings
   */
  basicApp: () =>
    App({
      children: [
        Window({
          id: 'main',
          title: 'My App',
          children: () => ({
            type: 'component',
            id: 'main-content',
            props: {},
            render: () => ({
              type: 'element' as const,
              tag: 'div',
              props: {},
              children: [],
              element: document.createElement('div'),
            }),
          }),
        }),

        WindowUtils.settingsWindow(() => ({
          type: 'component',
          id: 'settings-content',
          props: {},
          render: () => ({
            type: 'element' as const,
            tag: 'div',
            props: {},
            children: [],
            element: document.createElement('div'),
          }),
        })),
      ],
    }),

  /**
   * Document-based app
   */
  documentApp: () =>
    App({
      children: [
        WindowGroup({
          id: 'document',
          title: 'Document',
          for: class Document {
            id!: string
            title!: string
          },
          children: doc => ({
            type: 'component',
            id: `document-${doc.id}`,
            props: {},
            render: () => ({
              type: 'element' as const,
              tag: 'div',
              props: {},
              children: [],
              element: document.createElement('div'),
            }),
          }),
        }),

        WindowUtils.settingsWindow(() => ({
          type: 'component',
          id: 'settings',
          props: {},
          render: () => ({
            type: 'element' as const,
            tag: 'div',
            props: {},
            children: [],
            element: document.createElement('div'),
          }),
        })),
      ],
    }),
}
