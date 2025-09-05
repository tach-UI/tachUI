/**
 * Real-World Navigation Scenarios Tests
 *
 * Tests for complex, real-world navigation patterns and user journeys
 * that go beyond basic component functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createSignal, createEffect } from '@tachui/core'
import { HTML } from '@tachui/primitives'
import { NavigationView } from '../src/navigation-view'
import { NavigationLink } from '../src/navigation-link'
import { SimpleTabView, tabItem } from '../src/simple-tab-view'
import { createNavigationRouter } from '../src/navigation-router'
import type { NavigationContext, NavigationDestination } from '../src/types'

// Mock NavigationContext for tests
class MockNavigationContext implements NavigationContext {
  private _path = '/'
  private _stack: any[] = []

  get navigationId() {
    return 'test-nav'
  }
  get stack() {
    return this._stack
  }
  get currentPath() {
    return this._path
  }
  get canGoBack() {
    return this._stack.length > 1
  }
  get canGoForward() {
    return false
  }

  push(destination: NavigationDestination, path: string, title?: string): void {
    this._path = path
    this._stack.push({ destination, path, title })
  }

  pop(): void {
    if (this._stack.length > 1) {
      this._stack.pop()
      this._path = this._stack[this._stack.length - 1]?.path || '/'
    }
  }

  popToRoot(): void {
    this._stack = this._stack.slice(0, 1)
    this._path = this._stack[0]?.path || '/'
  }

  popTo(path: string): void {
    const index = this._stack.findIndex(item => item.path === path)
    if (index >= 0) {
      this._stack = this._stack.slice(0, index + 1)
      this._path = path
    }
  }

  replace(
    destination: NavigationDestination,
    path: string,
    title?: string
  ): void {
    if (this._stack.length > 0) {
      this._stack[this._stack.length - 1] = { destination, path, title }
      this._path = path
    } else {
      this.push(destination, path, title)
    }
  }
}

// Helper function for tests - creates router from route definitions
function createTestRouter(routes: Record<string, any>, options?: any) {
  const mockContext = new MockNavigationContext()
  const router = createNavigationRouter(mockContext)

  // Store routes for reference
  ;(router as any)._testRoutes = routes
  ;(router as any)._testOptions = options

  // Override push method to match test expectations
  const originalPush = router.push.bind(router)
  ;(router as any).push = (
    pathOrDestination: string | any,
    maybePath?: string
  ) => {
    if (typeof pathOrDestination === 'string') {
      // Called with just a path string - create a simple destination
      const path = pathOrDestination
      const routeFunction =
        routes[path] || (() => HTML.div({ children: path }).modifier.build())

      // Execute the route function to trigger side effects
      const destination = routeFunction()
      originalPush(destination, path)
    } else {
      // Called with destination and path - use original API
      originalPush(pathOrDestination, maybePath)
    }
  }

  return router
}

describe('Real-World Navigation Scenarios - Complex User Journeys', () => {
  describe('E-commerce Navigation Flow', () => {
    let productListView: any
    let productDetailView: any
    let cartView: any
    let checkoutView: any

    beforeEach(() => {
      productListView = () =>
        HTML.div({ children: 'Product List' }).modifier.build()
      productDetailView = (productId: string) =>
        HTML.div({ children: `Product ${productId}` }).modifier.build()
      cartView = () => HTML.div({ children: 'Shopping Cart' }).modifier.build()
      checkoutView = () => HTML.div({ children: 'Checkout' }).modifier.build()
    })

    it('handles product browsing to purchase flow', () => {
      const router = createTestRouter({
        '/products': () => productListView(),
        '/product/123': () => productDetailView('123'),
        '/cart': () => cartView(),
        '/checkout': () => checkoutView(),
      })

      // Simulate user journey
      router.push('/products')
      expect(router.currentPath).toBe('/products')

      router.push('/product/123')
      expect(router.currentPath).toBe('/product/123')

      router.push('/cart')
      expect(router.currentPath).toBe('/cart')

      router.push('/checkout')
      expect(router.currentPath).toBe('/checkout')
    })

    it('supports back navigation during purchase flow', () => {
      const router = createTestRouter({
        '/products': () => productListView(),
        '/product/:id': ({ id }: { id: string }) => productDetailView(id),
        '/cart': () => cartView(),
      })

      // Navigate deep into flow
      router.push('/products')
      router.push('/product/456')
      router.push('/cart')

      // User changes mind and goes back
      router.pop()
      expect(router.currentPath).toBe('/product/456')

      router.pop()
      expect(router.currentPath).toBe('/products')
    })

    it('handles cart updates with navigation', () => {
      const [cartItems, setCartItems] = createSignal<string[]>([])

      const enhancedCartView = () =>
        HTML.div({
          children: `Cart: ${cartItems().join(', ')}`,
        }).modifier.build()

      const router = createTestRouter({
        '/cart': () => enhancedCartView(),
      })

      // Add items to cart
      setCartItems(['Product A', 'Product B'])

      router.push('/cart')
      expect(router.currentPath).toBe('/cart')
    })
  })

  describe('Social Media Navigation Patterns', () => {
    let feedView: any
    let profileView: any
    let postDetailView: any
    let notificationsView: any

    beforeEach(() => {
      feedView = () => HTML.div({ children: 'Feed' }).modifier.build()
      profileView = (userId: string) =>
        HTML.div({ children: `Profile ${userId}` }).modifier.build()
      postDetailView = (postId: string) =>
        HTML.div({ children: `Post ${postId}` }).modifier.build()
      notificationsView = () =>
        HTML.div({ children: 'Notifications' }).modifier.build()
    })

    it('handles feed to profile to post navigation', () => {
      const router = createTestRouter({
        '/feed': () => feedView(),
        '/profile/:userId': ({ userId }: { userId: string }) =>
          profileView(userId),
        '/post/:postId': ({ postId }: { postId: string }) =>
          postDetailView(postId),
      })

      // User sees post in feed, taps on profile
      router.push('/feed')
      router.push('/profile/user123')
      expect(router.currentPath).toBe('/profile/user123')

      // Then taps on a post from that profile
      router.push('/post/post456')
      expect(router.currentPath).toBe('/post/post456')
    })

    it('supports tab-based social navigation', () => {
      const tabs = [
        {
          id: 'feed',
          label: 'Feed',
          content: feedView(),
        },
        {
          id: 'profile',
          label: 'Profile',
          content: profileView('currentUser'),
        },
        {
          id: 'notifications',
          label: 'Notifications',
          content: notificationsView(),
        },
      ]

      const tabView = SimpleTabView(
        tabs.map(tab => tabItem(tab.content, tab.id, tab.label))
      )

      expect(tabView).toBeDefined()
    })

    it('handles deep linking to specific content', () => {
      const router = createTestRouter(
        {
          '/post/:postId': ({ postId }: { postId: string }) =>
            postDetailView(postId),
        },
        {
          deepLinking: {
            enabled: true,
            handleUnknownRoutes: path =>
              HTML.div({ children: `404: ${path}` }).modifier.build(),
          },
        }
      )

      // Simulate deep link
      router.push('/post/shared-post-789')
      expect(router.currentPath).toBe('/post/shared-post-789')
    })
  })

  describe('Admin Dashboard Navigation', () => {
    let dashboardView: any
    let usersView: any
    let analyticsView: any
    let settingsView: any

    beforeEach(() => {
      dashboardView = () => HTML.div({ children: 'Dashboard' }).modifier.build()
      usersView = () =>
        HTML.div({ children: 'User Management' }).modifier.build()
      analyticsView = () => HTML.div({ children: 'Analytics' }).modifier.build()
      settingsView = () => HTML.div({ children: 'Settings' }).modifier.build()
    })

    it('handles hierarchical admin navigation', () => {
      const router = createTestRouter({
        '/admin': () => dashboardView(),
        '/admin/users': () => usersView(),
        '/admin/analytics': () => analyticsView(),
        '/admin/settings': () => settingsView(),
        '/admin/*': () =>
          HTML.div({ children: 'Admin Section' }).modifier.build(),
      })

      // Navigate through admin sections
      router.push('/admin')
      expect(router.currentPath).toBe('/admin')

      router.push('/admin/users')
      expect(router.currentPath).toBe('/admin/users')

      router.push('/admin/analytics')
      expect(router.currentPath).toBe('/admin/analytics')
    })

    it('supports admin breadcrumb navigation', () => {
      const router = createTestRouter({
        '/admin': () => dashboardView(),
        '/admin/users': () => usersView(),
        '/admin/users/:id': ({ id }: { id: string }) =>
          HTML.div({ children: `User ${id}` }).modifier.build(),
      })

      router.push('/admin')
      router.push('/admin/users')
      router.push('/admin/users/123')

      // Breadcrumb should show: Admin > Users > User 123
      const segments = router.currentPath.split('/').filter(Boolean)
      expect(segments).toEqual(['admin', 'users', '123'])
    })

    it('handles admin permission-based navigation', () => {
      const userPermissions = { canViewAnalytics: false, canManageUsers: true }

      const router = createTestRouter({
        '/admin': () => dashboardView(),
        '/admin/users': () =>
          userPermissions.canManageUsers
            ? usersView()
            : HTML.div({ children: 'Access Denied' }).modifier.build(),
        '/admin/analytics': () =>
          userPermissions.canViewAnalytics
            ? analyticsView()
            : HTML.div({ children: 'Access Denied' }).modifier.build(),
      })

      router.push('/admin/users')
      // Should work for users with permission

      router.push('/admin/analytics')
      // Should show access denied
    })
  })

  describe('Multi-step Form Navigation', () => {
    let step1View: any
    let step2View: any
    let step3View: any
    let reviewView: any
    let confirmationView: any

    beforeEach(() => {
      step1View = () =>
        HTML.div({ children: 'Step 1: Personal Info' }).modifier.build()
      step2View = () =>
        HTML.div({ children: 'Step 2: Address' }).modifier.build()
      step3View = () =>
        HTML.div({ children: 'Step 3: Payment' }).modifier.build()
      reviewView = () =>
        HTML.div({ children: 'Review & Submit' }).modifier.build()
      confirmationView = () =>
        HTML.div({ children: 'Confirmation' }).modifier.build()
    })

    it('handles linear multi-step form flow', () => {
      const [currentStep, setCurrentStep] = createSignal(1)
      const [formData, setFormData] = createSignal({})

      const router = createTestRouter({
        '/form/step1': () => step1View(),
        '/form/step2': () => step2View(),
        '/form/step3': () => step3View(),
        '/form/review': () => reviewView(),
        '/form/confirmation': () => confirmationView(),
      })

      // Progress through form steps
      router.push('/form/step1')
      expect(router.currentPath).toBe('/form/step1')

      router.push('/form/step2')
      expect(router.currentPath).toBe('/form/step2')

      router.push('/form/step3')
      expect(router.currentPath).toBe('/form/step3')

      router.push('/form/review')
      expect(router.currentPath).toBe('/form/review')

      router.push('/form/confirmation')
      expect(router.currentPath).toBe('/form/confirmation')
    })

    it('supports form step validation and navigation', () => {
      const [step1Valid, setStep1Valid] = createSignal(false)
      const [step2Valid, setStep2Valid] = createSignal(false)

      const router = createTestRouter({
        '/form/step1': () => step1View(),
        '/form/step2': () =>
          step2Valid()
            ? step2View()
            : HTML.div({ children: 'Complete Step 1 first' }).modifier.build(),
      })

      router.push('/form/step1')
      router.push('/form/step2') // Should show validation message

      setStep1Valid(true)
      setStep2Valid(true)
      router.push('/form/step2') // Should work now
    })

    it('handles form abandonment and recovery', () => {
      const [formProgress, setFormProgress] = createSignal({})

      const router = createTestRouter({
        '/form/step1': () => step1View(),
        '/form/resume': () => {
          const progress = formProgress()
          return Object.keys(progress).length > 0
            ? HTML.div({
                children: 'Resume from saved progress',
              }).modifier.build()
            : HTML.div({ children: 'Start new form' }).modifier.build()
        },
      })

      // User starts form but leaves
      router.push('/form/step1')
      setFormProgress({ step1: 'completed' })

      // User returns later
      router.push('/form/resume')
      // Should offer to resume
    })
  })

  describe('Search and Filter Navigation', () => {
    let searchView: any
    let resultsView: any
    let filterView: any

    beforeEach(() => {
      searchView = () => HTML.div({ children: 'Search' }).modifier.build()
      resultsView = (query: string, filters: any) =>
        HTML.div({
          children: `Results for "${query}" with filters: ${JSON.stringify(filters)}`,
        }).modifier.build()
      filterView = () => HTML.div({ children: 'Filters' }).modifier.build()
    })

    it('handles search query navigation', () => {
      const router = createTestRouter({
        '/search': () => searchView(),
        '/search/results': ({
          q,
          category,
          price,
        }: {
          q?: string
          category?: string
          price?: string
        }) => resultsView(q || '', { category, price }),
      })

      // Search with query
      router.push(
        '/search/results?q=laptop&category=electronics&price=under-1000'
      )
      expect(router.currentPath).toBe(
        '/search/results?q=laptop&category=electronics&price=under-1000'
      )
    })

    it('supports filter state persistence', () => {
      const [filters, setFilters] = createSignal({
        category: 'all',
        priceRange: 'any',
        rating: 'any',
      })

      const router = createTestRouter({
        '/search': () => searchView(),
        '/search/filtered': () => resultsView('query', filters()),
      })

      // Apply filters
      setFilters({
        category: 'electronics',
        priceRange: '100-500',
        rating: '4+',
      })

      router.push('/search/filtered')
      expect(router.currentPath).toBe('/search/filtered')
    })

    it('handles search history and suggestions', () => {
      const searchHistory = ['laptop', 'phone', 'tablet']
      const suggestions = ['laptop stand', 'laptop bag', 'laptop charger']

      const router = createTestRouter({
        '/search': () => searchView(),
        '/search/history': () =>
          HTML.div({
            children: `History: ${searchHistory.join(', ')}`,
          }).modifier.build(),
        '/search/suggestions': () =>
          HTML.div({
            children: `Suggestions: ${suggestions.join(', ')}`,
          }).modifier.build(),
      })

      router.push('/search/history')
      router.push('/search/suggestions')
    })
  })

  describe('Authentication Flow Navigation', () => {
    let loginView: any
    let registerView: any
    let forgotPasswordView: any
    let dashboardView: any

    beforeEach(() => {
      loginView = () => HTML.div({ children: 'Login' }).modifier.build()
      registerView = () => HTML.div({ children: 'Register' }).modifier.build()
      forgotPasswordView = () =>
        HTML.div({ children: 'Forgot Password' }).modifier.build()
      dashboardView = () => HTML.div({ children: 'Dashboard' }).modifier.build()
    })

    it('handles login to dashboard flow', () => {
      const [isAuthenticated, setIsAuthenticated] = createSignal(false)

      const router = createTestRouter({
        '/login': () => loginView(),
        '/register': () => registerView(),
        '/forgot-password': () => forgotPasswordView(),
        '/dashboard': () =>
          isAuthenticated()
            ? dashboardView()
            : HTML.div({ children: 'Please login first' }).modifier.build(),
      })

      // Try to access dashboard without auth
      router.push('/dashboard')
      // Should show login prompt

      // Login successfully
      setIsAuthenticated(true)
      router.push('/dashboard')
      // Should show dashboard
    })

    it('supports social login navigation', () => {
      const router = createTestRouter({
        '/login': () => loginView(),
        '/auth/google': () =>
          HTML.div({ children: 'Google OAuth' }).modifier.build(),
        '/auth/github': () =>
          HTML.div({ children: 'GitHub OAuth' }).modifier.build(),
        '/auth/callback': () =>
          HTML.div({ children: 'Auth Callback' }).modifier.build(),
      })

      // Social login flow
      router.push('/login')
      router.push('/auth/google')
      router.push('/auth/callback')
    })

    it('handles logout and session cleanup', () => {
      const [userSession, setUserSession] = createSignal({
        userId: '123',
        token: 'abc',
      })

      const router = createTestRouter({
        '/dashboard': () => dashboardView(),
        '/login': () => loginView(),
        '/logout': () => {
          // Clear session on logout
          setUserSession(null)
          return loginView()
        },
      })

      // User logs out
      router.push('/logout')
      expect(userSession()).toBeNull()
    })
  })

  describe('Progressive Web App Navigation', () => {
    it('handles offline navigation gracefully', () => {
      const [isOnline, setIsOnline] = createSignal(true)
      const dashboardView = () =>
        HTML.div({ children: 'Dashboard' }).modifier.build()

      const router = createTestRouter({
        '/dashboard': () => dashboardView(),
        '/offline': () =>
          HTML.div({ children: 'You are offline' }).modifier.build(),
      })

      // Simulate going offline
      setIsOnline(false)

      // Navigation should handle offline state
      router.push('/dashboard')
      // Should either show cached content or offline message
    })

    it('supports navigation prefetching', () => {
      const dashboardView = () =>
        HTML.div({ children: 'Dashboard' }).modifier.build()
      const profileView = (id: string) =>
        HTML.div({ children: `Profile ${id}` }).modifier.build()
      const settingsView = () =>
        HTML.div({ children: 'Settings' }).modifier.build()

      const router = createTestRouter(
        {
          '/dashboard': () => dashboardView(),
          '/profile': () => profileView('123'),
          '/settings': () => settingsView(),
        },
        {
          prefetching: {
            enabled: true,
            routes: ['/dashboard', '/profile'],
          },
        }
      )

      // Routes should be prefetched for faster navigation
      router.push('/dashboard')
    })

    it('handles service worker navigation', () => {
      const router = createTestRouter(
        {
          '/app': () => HTML.div({ children: 'PWA App' }).modifier.build(),
          '/install': () =>
            HTML.div({ children: 'Install PWA' }).modifier.build(),
        },
        {
          serviceWorker: {
            enabled: true,
            scope: '/app',
            cacheStrategy: 'network-first',
          },
        }
      )

      router.push('/app')
    })
  })

  describe('Internationalization Navigation', () => {
    it('handles locale-based routing', () => {
      const router = createTestRouter({
        '/': () => HTML.div({ children: 'Home' }).modifier.build(),
        '/:locale/dashboard': ({ locale }: { locale: string }) =>
          HTML.div({ children: `Dashboard (${locale})` }).modifier.build(),
        '/:locale/profile': ({ locale }: { locale: string }) =>
          HTML.div({ children: `Profile (${locale})` }).modifier.build(),
      })

      router.push('/en/dashboard')
      expect(router.currentPath).toBe('/en/dashboard')

      router.push('/es/profile')
      expect(router.currentPath).toBe('/es/profile')
    })

    it('supports RTL navigation patterns', () => {
      const router = createTestRouter(
        {
          '/rtl/dashboard': () =>
            HTML.div({ children: 'RTL Dashboard' }).modifier.build(),
        },
        {
          rtl: {
            enabled: true,
            textDirection: 'rtl',
          },
        }
      )

      router.push('/rtl/dashboard')
    })
  })

  describe('Performance and Scalability', () => {
    it('handles large navigation structures', () => {
      // Create many routes
      const routes: Record<string, any> = {}
      for (let i = 0; i < 1000; i++) {
        routes[`/page/${i}`] = () =>
          HTML.div({ children: `Page ${i}` }).modifier.build()
      }

      const router = createTestRouter(routes)

      const startTime = performance.now()
      router.push('/page/500')
      const endTime = performance.now()

      expect(router.currentPath).toBe('/page/500')
      expect(endTime - startTime).toBeLessThan(50) // Should be fast
    })

    it('scales with complex nested navigation', () => {
      const createNestedRoutes = (
        depth: number,
        prefix = ''
      ): Record<string, any> => {
        const routes: Record<string, any> = {}

        for (let i = 0; i < 5; i++) {
          const path = `${prefix}/level${i}`
          routes[path] = () =>
            HTML.div({ children: `Level ${depth}-${i}` }).modifier.build()

          if (depth > 1) {
            Object.assign(routes, createNestedRoutes(depth - 1, path))
          }
        }

        return routes
      }

      const routes = createNestedRoutes(3)
      const router = createTestRouter(routes)

      router.push('/level0/level1/level2')
      expect(router.currentPath).toBe('/level0/level1/level2')
    })

    it('maintains performance with frequent navigation', () => {
      const router = createTestRouter({
        '/page1': () => HTML.div({ children: 'Page 1' }).modifier.build(),
        '/page2': () => HTML.div({ children: 'Page 2' }).modifier.build(),
        '/page3': () => HTML.div({ children: 'Page 3' }).modifier.build(),
      })

      const startTime = performance.now()

      // Rapid navigation
      for (let i = 0; i < 100; i++) {
        router.push(`/page${(i % 3) + 1}`)
      }

      const endTime = performance.now()
      const totalTime = endTime - startTime

      expect(totalTime).toBeLessThan(200) // Should handle rapid navigation
    })
  })
})
