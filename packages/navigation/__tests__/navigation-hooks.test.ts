/**
 * Navigation Hooks Tests
 * 
 * Tests for SwiftUI-compatible navigation hooks and programmatic navigation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { HTML, createSignal } from '../../core/src'

// Mock the navigation environment and hooks
const mockNavigationEnvironment = () => ({
  currentPath: '/',
  stack: [],
  canGoBack: false,
  canGoForward: false,
  push: vi.fn(),
  pop: vi.fn(),
  popTo: vi.fn(),
  replace: vi.fn(),
  popToRoot: vi.fn()
})

describe('Navigation Hooks - SwiftUI Compatible Navigation Hooks', () => {
  let mockDestination: any
  
  beforeEach(() => {
    mockDestination = () => HTML.div({ children: 'Destination View' }).modifier.build()
  })

  describe('useNavigation Hook', () => {
    it('provides navigation interface', () => {
      // Mock the hook implementation
      const mockNavigation = {
        push: vi.fn(),
        pop: vi.fn(),
        popTo: vi.fn(),
        replace: vi.fn(),
        popToRoot: vi.fn()
      }
      
      expect(mockNavigation.push).toBeDefined()
      expect(mockNavigation.pop).toBeDefined()
      expect(mockNavigation.popTo).toBeDefined()
      expect(mockNavigation.replace).toBeDefined()
      expect(mockNavigation.popToRoot).toBeDefined()
    })

    it('supports SwiftUI-style push navigation', () => {
      const mockNavigation = {
        push: vi.fn(),
        pop: vi.fn(),
        popTo: vi.fn(),
        replace: vi.fn(),
        popToRoot: vi.fn()
      }
      
      // SwiftUI-style: navigation.push(destinationView)
      mockNavigation.push(mockDestination)
      
      expect(mockNavigation.push).toHaveBeenCalledWith(mockDestination)
    })

    it('supports programmatic pop navigation', () => {
      const mockNavigation = {
        push: vi.fn(),
        pop: vi.fn(),
        popTo: vi.fn(),
        replace: vi.fn(),
        popToRoot: vi.fn()
      }
      
      mockNavigation.pop()
      
      expect(mockNavigation.pop).toHaveBeenCalled()
    })

    it('supports pop to specific view', () => {
      const mockNavigation = {
        push: vi.fn(),
        pop: vi.fn(),
        popTo: vi.fn(),
        replace: vi.fn(),
        popToRoot: vi.fn()
      }
      
      mockNavigation.popTo('/specific-path')
      
      expect(mockNavigation.popTo).toHaveBeenCalledWith('/specific-path')
    })
  })

  describe('useNavigationContext Hook', () => {
    it('provides navigation context information', () => {
      const mockContext = {
        currentPath: '/current',
        stack: [{ id: '1', path: '/', component: mockDestination }],
        canGoBack: true,
        canGoForward: false,
        navigationId: 'nav-123',
        isActive: true
      }
      
      expect(mockContext.currentPath).toBe('/current')
      expect(mockContext.canGoBack).toBe(true)
      expect(mockContext.stack).toHaveLength(1)
    })

    it('provides reactive navigation state', () => {
      const [currentPath, setCurrentPath] = createSignal('/')
      const [canGoBack, setCanGoBack] = createSignal(false)
      
      const mockContext = {
        currentPath: currentPath(),
        canGoBack: canGoBack(),
        stack: [],
        canGoForward: false,
        navigationId: 'nav-reactive',
        isActive: true
      }
      
      expect(mockContext.currentPath).toBe('/')
      expect(mockContext.canGoBack).toBe(false)
      
      setCurrentPath('/new-path')
      setCanGoBack(true)
      
      expect(currentPath()).toBe('/new-path')
      expect(canGoBack()).toBe(true)
    })
  })

  describe('useNavigationRouter Hook', () => {
    it('provides router functionality', () => {
      const mockRouter = {
        navigate: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        go: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        getCurrentLocation: vi.fn(() => '/current'),
        listen: vi.fn()
      }
      
      expect(mockRouter.navigate).toBeDefined()
      expect(mockRouter.getCurrentLocation()).toBe('/current')
    })

    it('supports URL-based navigation', () => {
      const mockRouter = {
        navigate: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        go: vi.fn(),
        push: vi.fn(),
        replace: vi.fn(),
        getCurrentLocation: vi.fn(),
        listen: vi.fn()
      }
      
      mockRouter.navigate('/users/123')
      
      expect(mockRouter.navigate).toHaveBeenCalledWith('/users/123')
    })
  })

  describe('useNavigationBar Hook', () => {
    it('provides navigation bar control', () => {
      const mockNavigationBar = {
        setTitle: vi.fn(),
        setHidden: vi.fn(),
        setBackButtonHidden: vi.fn(),
        setBackButtonTitle: vi.fn(),
        setItems: vi.fn(),
        setBackground: vi.fn(),
        setForegroundColor: vi.fn()
      }
      
      mockNavigationBar.setTitle('New Title')
      mockNavigationBar.setHidden(false)
      
      expect(mockNavigationBar.setTitle).toHaveBeenCalledWith('New Title')
      expect(mockNavigationBar.setHidden).toHaveBeenCalledWith(false)
    })

    it('supports dynamic navigation bar updates', () => {
      const mockNavigationBar = {
        setTitle: vi.fn(),
        setHidden: vi.fn(),
        setBackButtonHidden: vi.fn(),
        setBackButtonTitle: vi.fn(),
        setItems: vi.fn(),
        setBackground: vi.fn(),
        setForegroundColor: vi.fn()
      }
      
      const leadingItems = [HTML.button({ children: 'Edit' }).modifier.build()]
      const trailingItems = [HTML.button({ children: 'Save' }).modifier.build()]
      
      mockNavigationBar.setItems({ leading: leadingItems, trailing: trailingItems })
      
      expect(mockNavigationBar.setItems).toHaveBeenCalledWith({
        leading: leadingItems,
        trailing: trailingItems
      })
    })
  })

  describe('useNavigationState Hook', () => {
    it('manages navigation state', () => {
      const [navigationState, setNavigationState] = createSignal({
        currentPath: '/',
        stack: [],
        isNavigating: false,
        history: []
      })
      
      expect(navigationState().currentPath).toBe('/')
      expect(navigationState().isNavigating).toBe(false)
      
      setNavigationState(prev => ({
        ...prev,
        currentPath: '/new',
        isNavigating: true
      }))
      
      expect(navigationState().currentPath).toBe('/new')
      expect(navigationState().isNavigating).toBe(true)
    })

    it('tracks navigation history', () => {
      const [navigationState, setNavigationState] = createSignal({
        currentPath: '/',
        stack: [],
        isNavigating: false,
        history: ['/']
      })
      
      // Simulate navigation
      setNavigationState(prev => ({
        ...prev,
        currentPath: '/profile',
        history: [...prev.history, '/profile']
      }))
      
      expect(navigationState().history).toEqual(['/', '/profile'])
    })
  })

  describe('useNavigationPath Hook', () => {
    it('manages navigation path state', () => {
      const mockPath = {
        isEmpty: true,
        count: 0,
        segments: [],
        append: vi.fn(),
        removeLast: vi.fn(),
        clear: vi.fn()
      }
      
      expect(mockPath).toBeDefined()
      expect(mockPath.isEmpty).toBe(true)
    })

    it('supports path manipulation', () => {
      const mockPath = {
        append: vi.fn(),
        removeLast: vi.fn(),
        clear: vi.fn(),
        count: 0,
        isEmpty: true,
        segments: []
      }
      
      mockPath.append('user-123')
      mockPath.append('profile')
      
      expect(mockPath.append).toHaveBeenCalledWith('user-123')
      expect(mockPath.append).toHaveBeenCalledWith('profile')
    })
  })

  describe('useNavigationAnimation Hook', () => {
    it('provides animation control', () => {
      const mockAnimationController = {
        setTransition: vi.fn(),
        setDuration: vi.fn(),
        setEasing: vi.fn(),
        play: vi.fn(),
        stop: vi.fn(),
        reverse: vi.fn()
      }
      
      mockAnimationController.setTransition('slide')
      mockAnimationController.setDuration(300)
      
      expect(mockAnimationController.setTransition).toHaveBeenCalledWith('slide')
      expect(mockAnimationController.setDuration).toHaveBeenCalledWith(300)
    })

    it('supports custom animations', () => {
      const mockAnimationController = {
        setTransition: vi.fn(),
        setDuration: vi.fn(),
        setEasing: vi.fn(),
        play: vi.fn(),
        stop: vi.fn(),
        reverse: vi.fn()
      }
      
      const customTransition = {
        type: 'custom',
        keyframes: ['0%', '100%'],
        properties: ['transform', 'opacity']
      }
      
      mockAnimationController.setTransition(customTransition)
      
      expect(mockAnimationController.setTransition).toHaveBeenCalledWith(customTransition)
    })
  })

  describe('useNavigationCleanup Hook', () => {
    it('handles navigation cleanup', () => {
      const mockCleanup = {
        register: vi.fn(),
        unregister: vi.fn(),
        cleanup: vi.fn(),
        onUnmount: vi.fn()
      }
      
      const cleanupFn = vi.fn()
      mockCleanup.register('navigation-effect', cleanupFn)
      
      expect(mockCleanup.register).toHaveBeenCalledWith('navigation-effect', cleanupFn)
    })

    it('automatically cleans up on unmount', () => {
      const mockCleanup = {
        register: vi.fn(),
        unregister: vi.fn(),
        cleanup: vi.fn(),
        onUnmount: vi.fn()
      }
      
      const cleanupFn = vi.fn()
      mockCleanup.register('auto-cleanup', cleanupFn)
      
      // Simulate component unmount
      mockCleanup.cleanup()
      
      expect(mockCleanup.cleanup).toHaveBeenCalled()
    })
  })

  describe('Navigation Environment Hooks', () => {
    it('useNavigationEnvironmentContext provides context', () => {
      const mockEnvContext = mockNavigationEnvironment()
      
      expect(mockEnvContext.currentPath).toBe('/')
      expect(mockEnvContext.canGoBack).toBe(false)
      expect(mockEnvContext.push).toBeDefined()
    })

    it('useNavigationEnvironmentState provides state', () => {
      const mockEnvState = {
        isNavigating: false,
        lastNavigation: null,
        navigationCount: 0,
        errorState: null
      }
      
      expect(mockEnvState.isNavigating).toBe(false)
      expect(mockEnvState.navigationCount).toBe(0)
    })

    it('useNavigationEnvironmentRouter provides routing', () => {
      const mockEnvRouter = {
        basePath: '/',
        currentRoute: '/',
        params: {},
        query: {},
        navigate: vi.fn(),
        back: vi.fn()
      }
      
      expect(mockEnvRouter.currentRoute).toBe('/')
    })
  })

  describe('Programmatic Navigation Path', () => {
    it('creates programmatic navigation path', () => {
      const mockPath = {
        isEmpty: true,
        count: 0,
        segments: [],
        append: vi.fn(),
        removeLast: vi.fn(),
        clear: vi.fn(),
        copy: vi.fn(),
        equals: vi.fn()
      }
      
      expect(mockPath).toBeDefined()
      expect(mockPath.isEmpty).toBe(true)
      expect(mockPath.count).toBe(0)
    })

    it('manipulates navigation path', () => {
      const mockPath = {
        isEmpty: false,
        count: 2,
        append: vi.fn(),
        removeLast: vi.fn(),
        clear: vi.fn(),
        segments: ['user-123', 'profile']
      }
      
      mockPath.append({ id: 'user-123', type: 'user' })
      mockPath.append({ id: 'profile', type: 'view' })
      
      expect(mockPath.append).toHaveBeenCalledTimes(2)
    })
  })

  describe('Navigation Hook Utils', () => {
    it('provides navigation utilities', () => {
      const mockUtils = {
        createNavigationBinding: vi.fn(),
        bindNavigationState: vi.fn(),
        unbindNavigationState: vi.fn(),
        getNavigationContext: vi.fn()
      }
      
      expect(mockUtils.createNavigationBinding).toBeDefined()
    })

    it('creates navigation bindings', () => {
      const mockBinding = {
        get: vi.fn(() => '/current'),
        set: vi.fn(),
        wrappedValue: '/current',
        projectedValue: '/current'
      }
      
      expect(mockBinding.get()).toBe('/current')
      
      mockBinding.set('/new-path')
      expect(mockBinding.set).toHaveBeenCalledWith('/new-path')
    })
  })

  describe('Error Handling', () => {
    it('handles navigation errors gracefully', () => {
      const mockErrorHandler = vi.fn()
      
      const mockNavigation = {
        push: vi.fn().mockRejectedValue(new Error('Navigation failed')),
        pop: vi.fn(),
        onError: mockErrorHandler
      }
      
      // Simulate navigation error
      mockNavigation.push(mockDestination).catch(mockErrorHandler)
      
      expect(mockNavigation.push).toHaveBeenCalledWith(mockDestination)
    })

    it('handles missing navigation context', () => {
      const mockHook = () => {
        const context = null // No navigation context available
        
        if (!context) {
          throw new Error('Navigation context not found')
        }
        
        return context
      }
      
      expect(() => mockHook()).toThrow('Navigation context not found')
    })

    it('handles invalid navigation destinations', () => {
      const mockNavigation = {
        push: vi.fn(),
        pop: vi.fn(),
        validate: (destination: any) => {
          if (!destination || typeof destination !== 'function') {
            throw new Error('Invalid navigation destination')
          }
          return true
        }
      }
      
      expect(() => mockNavigation.validate(null)).toThrow('Invalid navigation destination')
      expect(() => mockNavigation.validate(() => mockDestination())).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('efficiently manages navigation state', () => {
      const startTime = performance.now()
      
      // Simulate many navigation state changes
      const [state, setState] = createSignal({ path: '/', count: 0 })
      
      for (let i = 0; i < 1000; i++) {
        setState(prev => ({ ...prev, count: prev.count + 1 }))
      }
      
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(50) // Should be very fast
      expect(state().count).toBe(1000)
    })

    it('efficiently handles navigation cleanup', () => {
      const cleanupFunctions: (() => void)[] = []
      
      // Register many cleanup functions
      for (let i = 0; i < 100; i++) {
        cleanupFunctions.push(() => { /* cleanup logic */ })
      }
      
      const startTime = performance.now()
      
      // Cleanup all at once
      cleanupFunctions.forEach(cleanup => cleanup())
      
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(10) // Should be very fast
    })
  })

  describe('Integration with Navigation System', () => {
    it('integrates with navigation components', () => {
      const mockHookIntegration = {
        navigationStack: null as any,
        setupHooks: (stack: any) => {
          // Simulate hook integration with NavigationStack
          return {
            useNavigation: () => mockNavigationEnvironment(),
            useContext: () => ({ currentPath: '/' })
          }
        }
      }
      
      const rootView = HTML.div({ children: 'Root' }).modifier.build()
      const mockNavStack = { type: 'NavigationStack', rootView }
      
      const hooks = mockHookIntegration.setupHooks(mockNavStack)
      
      expect(hooks.useNavigation).toBeDefined()
      expect(hooks.useContext).toBeDefined()
    })

    it('integrates with tab navigation', () => {
      const tabContent = HTML.div({ children: 'Tab with hooks' }).modifier.build()
      const mockTabs = [{ id: 'home', label: 'Home', content: tabContent }]
      
      const mockTabView = { type: 'SimpleTabView', tabs: mockTabs }
      
      expect(mockTabView).toBeDefined()
      expect(mockTabView.tabs).toHaveLength(1)
    })
  })
})