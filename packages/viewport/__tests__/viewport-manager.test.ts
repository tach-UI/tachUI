/**
 * Tests for TachUI Viewport Manager
 *
 * Tests the core viewport management functionality including window creation,
 * platform detection, and environment integration.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { detectViewportEnvironment } from '../src/platform-detection'
import type {
  ViewportAdapter,
  ViewportInstance,
  WindowConfig,
} from '../src/types'
import {
  getViewportManager,
  setViewportManager,
  TachUIViewportManager,
} from '../src/viewport-manager'

// Mock viewport adapter for testing
class MockViewportAdapter implements ViewportAdapter {
  environment = detectViewportEnvironment()
  private windows = new Map<string, MockViewportInstance>()

  canCreateWindow(_config: WindowConfig): boolean {
    return true
  }

  createWindow(config: WindowConfig): ViewportInstance {
    const instance = new MockViewportInstance(config)
    this.windows.set(config.id, instance)
    return instance
  }

  async destroyWindow(windowId: string): Promise<void> {
    this.windows.delete(windowId)
  }

  setupCrossWindowCommunication(): void {
    // Mock implementation
  }

  broadcastMessage(_message: any, _excludeWindow?: string): void {
    // Mock implementation
  }

  optimizeForPlatform(): void {
    // Mock implementation
  }
}

// Mock viewport instance for testing
class MockViewportInstance implements ViewportInstance {
  readonly id: string
  readonly type = 'window' as const
  readonly config: WindowConfig
  state: any

  private eventHandlers = new Map<string, Set<() => void>>()
  private messageHandlers = new Set<(message: any) => void>()
  private currentState: any

  constructor(config: WindowConfig) {
    this.id = config.id
    this.config = config
    this.currentState = {
      id: config.id,
      title: config.title || config.id,
      isVisible: false,
      isMinimized: false,
      isMaximized: false,
      isFullscreen: false,
      isFocused: false,
      bounds: {
        x: config.x || 0,
        y: config.y || 0,
        width: config.width || 800,
        height: config.height || 600,
      },
    }

    this.state = {
      getValue: () => this.currentState,
      peek: () => this.currentState,
      setter: vi.fn((updater: any) => {
        if (typeof updater === 'function') {
          this.currentState = updater(this.currentState)
        } else {
          this.currentState = updater
        }
        return this.currentState
      }),
    }
  }

  render(_component: any): void {}

  async show(): Promise<void> {
    this.state.setter((prev: any) => ({ ...prev, isVisible: true }))
  }

  async hide(): Promise<void> {
    this.state.setter((prev: any) => ({ ...prev, isVisible: false }))
  }

  async focus(): Promise<void> {
    this.state.setter((prev: any) => ({ ...prev, isFocused: true }))
  }

  async minimize(): Promise<void> {}
  async maximize(): Promise<void> {}
  async restore(): Promise<void> {}

  async close(): Promise<void> {
    this.emit('close')
    this.dispose()
  }

  dispose(): void {
    this.eventHandlers.clear()
    this.messageHandlers.clear()
  }

  postMessage(_message: any): void {}

  onMessage(handler: (message: any) => void): () => void {
    this.messageHandlers.add(handler)
    return () => this.messageHandlers.delete(handler)
  }

  onShow(handler: () => void): () => void {
    return this.addEventListener('show', handler)
  }

  onHide(handler: () => void): () => void {
    return this.addEventListener('hide', handler)
  }

  onFocus(handler: () => void): () => void {
    return this.addEventListener('focus', handler)
  }

  onBlur(handler: () => void): () => void {
    return this.addEventListener('blur', handler)
  }

  onResize(_handler: (bounds: any) => void): () => void {
    return () => {}
  }

  onClose(handler: () => void): () => void {
    return this.addEventListener('close', handler)
  }

  private addEventListener(event: string, handler: () => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }

    this.eventHandlers.get(event)!.add(handler)

    return () => {
      this.eventHandlers.get(event)?.delete(handler)
    }
  }

  private emit(event: string): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler())
    }
  }
}

describe('TachUIViewportManager', () => {
  let manager: TachUIViewportManager
  let mockAdapter: MockViewportAdapter

  beforeEach(() => {
    mockAdapter = new MockViewportAdapter()
    manager = new TachUIViewportManager(mockAdapter)
  })

  afterEach(() => {
    manager.dispose()
  })

  describe('Basic Window Management', () => {
    it('should create and open a window', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window = await manager.openWindow('test-window', mockComponent)

      expect(window).toBeDefined()
      expect(window.id).toBe('test-window')
      expect(window.type).toBe('window')
    })

    it('should return existing window when opening same ID', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window1 = await manager.openWindow('test-window', mockComponent)
      const window2 = await manager.openWindow('test-window', mockComponent)

      expect(window1).toBe(window2)
    })

    it('should dismiss a window', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window = await manager.openWindow('test-window', mockComponent)
      expect(manager.getWindow('test-window')).toBe(window)

      await manager.dismissWindow('test-window')
      expect(manager.getWindow('test-window')).toBeNull()
    })

    it('should throw error when dismissing non-existent window', async () => {
      await expect(manager.dismissWindow('non-existent')).rejects.toThrow(
        "Window with id 'non-existent' not found"
      )
    })
  })

  describe('Window Retrieval', () => {
    it('should get a window by ID', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window = await manager.openWindow('test-window', mockComponent)
      const retrieved = manager.getWindow('test-window')

      expect(retrieved).toBe(window)
    })

    it('should return null for non-existent window', () => {
      const retrieved = manager.getWindow('non-existent')
      expect(retrieved).toBeNull()
    })

    it('should get all open windows', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window1 = await manager.openWindow('window-1', mockComponent)
      const window2 = await manager.openWindow('window-2', mockComponent)

      const allWindows = manager.getAllWindows()
      expect(allWindows).toHaveLength(2)
      expect(allWindows).toContain(window1)
      expect(allWindows).toContain(window2)
    })
  })

  describe('Window Groups', () => {
    it('should create a window group', () => {
      const group = manager.createWindowGroup('documents')
      expect(group).toBeDefined()
      expect(group.id).toBe('documents')
    })

    it('should return same group for same ID', () => {
      const group1 = manager.createWindowGroup('documents')
      const group2 = manager.createWindowGroup('documents')
      expect(group1).toBe(group2)
    })

    it('should get window group by ID', () => {
      const group = manager.createWindowGroup('documents')
      const retrieved = manager.getWindowGroup('documents')
      expect(retrieved).toBe(group)
    })

    it('should return null for non-existent group', () => {
      const retrieved = manager.getWindowGroup('non-existent')
      expect(retrieved).toBeNull()
    })
  })

  describe('Capability Detection', () => {
    it('should detect window capabilities', () => {
      expect(manager.canOpenWindow()).toBe(true)
      expect(manager.canOpenWindow({ preferNativeWindow: true })).toBeDefined()
    })

    it('should determine optimal window type', () => {
      const windowType = manager.getOptimalWindowType()
      expect(['window', 'modal', 'portal', 'sheet']).toContain(windowType)
    })

    it('should prefer native windows when requested', () => {
      const windowType = manager.getOptimalWindowType({
        preferNativeWindow: true,
      })
      expect(windowType).toBeDefined()
    })
  })

  describe('Event Handling', () => {
    it('should emit window opened event', async () => {
      const onOpenedSpy = vi.fn()
      const unsubscribe = manager.onWindowOpened(onOpenedSpy)

      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window = await manager.openWindow('test-window', mockComponent)

      expect(onOpenedSpy).toHaveBeenCalledWith(window)
      unsubscribe()
    })

    it('should emit window closed event', async () => {
      const onClosedSpy = vi.fn()
      const unsubscribe = manager.onWindowClosed(onClosedSpy)

      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      await manager.openWindow('test-window', mockComponent)
      await manager.dismissWindow('test-window')

      expect(onClosedSpy).toHaveBeenCalledWith('test-window')
      unsubscribe()
    })
  })

  describe('Global Manager', () => {
    it('should get global manager', () => {
      const globalManager = getViewportManager()
      expect(globalManager).toBeInstanceOf(TachUIViewportManager)
    })

    it('should set custom global manager', () => {
      const customManager = new TachUIViewportManager(mockAdapter)
      setViewportManager(customManager)

      const retrieved = getViewportManager()
      expect(retrieved).toBe(customManager)

      customManager.dispose()
    })
  })

  describe('Window Options', () => {
    it('should handle window options', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const options = {
        title: 'Test Window',
        width: 600,
        height: 400,
        resizable: false,
        modal: true,
      }

      const window = await manager.openWindow(
        'test-window',
        mockComponent,
        options
      )

      expect(window.config.title).toBe('Test Window')
      expect(window.config.width).toBe(600)
      expect(window.config.height).toBe(400)
      expect(window.config.resizable).toBe(false)
      expect(window.config.modal).toBe(true)
    })

    it('should use default options when not provided', async () => {
      const mockComponent = {
        type: 'component' as const,
        id: 'test-component',
        render: () => ({
          element: document.createElement('div'),
          children: [],
        }),
      }

      const window = await manager.openWindow('test-window', mockComponent)

      expect(window.config.width).toBe(800) // Default width
      expect(window.config.height).toBe(600) // Default height
    })
  })

  describe('Environment Integration', () => {
    it('should provide environment information', () => {
      expect(manager.environment).toBeDefined()
      expect(manager.environment.platform).toBeDefined()
      expect(manager.environment.capabilities).toBeDefined()
    })

    it('should adapt to environment capabilities', () => {
      const canOpen = manager.canOpenWindow()
      expect(typeof canOpen).toBe('boolean')
    })
  })
})
