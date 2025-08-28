import { bench, describe } from 'vitest'
import { createBinding } from '@tachui/core'
import {
  NavigationStack,
  NavigationLink,
  SimpleTabView,
  navigationDestination,
  navigateToDestination,
  navigationTitle,
  tabItem,
} from '../src/index'

describe('Navigation Performance Benchmarks', () => {
  // Component creation benchmarks
  describe('Component Creation', () => {
    bench('NavigationStack creation', () => {
      NavigationStack(
        NavigationLink('Home', () => 'Home View'),
        {
          navigationTitle: 'Test Navigation',
        },
      )
    })

    bench('NavigationLink creation', () => {
      NavigationLink('Test Link', () => 'Destination View', {
        isActive: false,
      })
    })

    bench('SimpleTabView creation', () => {
      SimpleTabView([
        tabItem('tab1', 'Tab 1', 'Home'),
        tabItem('tab2', 'Tab 2', 'Settings'),
        tabItem('tab3', 'Tab 3', 'Profile'),
      ])
    })
  })

  // Navigation operations benchmarks
  describe('Navigation Operations', () => {
    const mockDestination = () => 'Mock View'

    bench('navigationDestination registration', () => {
      navigationDestination('test-route', mockDestination)
    })

    bench('navigateToDestination call', () => {
      navigationDestination('bench-route', mockDestination)
      navigateToDestination('bench-route')
    })

    bench('navigationTitle modifier', () => {
      const component = NavigationStack('Content')
      navigationTitle('Test Title')(component)
    })
  })

  // Complex navigation stack benchmarks
  describe('Complex Navigation Scenarios', () => {
    bench('Deep navigation stack creation', () => {
      const createNestedView = (depth: number): any => {
        if (depth === 0) return 'Leaf View'
        return NavigationLink(
          `Level ${depth}`,
          () => createNestedView(depth - 1),
        )
      }

      NavigationStack(createNestedView(10), {
        navigationTitle: 'Deep Stack',
      })
    })

    bench('Multiple tab creation', () => {
      const tabs = Array.from({ length: 20 }, (_, i) =>
        tabItem(`tab-${i}`, `Tab ${i}`, `Content ${i}`),
      )
      SimpleTabView(tabs)
    })

    bench('Navigation with complex modifiers', () => {
      const component = NavigationStack(
        NavigationLink('Home', () => 'Home View'),
        {
          navigationTitle: 'Complex Navigation',
          navigationBarHidden: false,
          toolbarBackground: '#ffffff',
        },
      )
      
      // Apply additional modifiers
      navigationTitle('Updated Title')(component)
    })
  })

  // Memory pressure tests
  describe('Memory Performance', () => {
    bench('Rapid component creation/destruction', () => {
      for (let i = 0; i < 100; i++) {
        const nav = NavigationStack(
          NavigationLink(`Link ${i}`, () => `View ${i}`),
        )
        // Simulate cleanup
        nav.dispose?.()
      }
    })

    bench('Large navigation state management', () => {
      const selection = createBinding('tab-0')
      const tabs = Array.from({ length: 100 }, (_, i) =>
        tabItem(`tab-${i}`, `Tab ${i}`, `Content ${i}`),
      )
      
      SimpleTabView(tabs, { selection })
      
      // Simulate tab switching
      for (let i = 0; i < 10; i++) {
        selection.set(`tab-${i}`)
      }
    })
  })

  // Bundle size impact simulation
  describe('Bundle Size Impact', () => {
    bench('Core components only (minimal import)', () => {
      // Simulate importing only core components
      const components = [
        NavigationStack,
        NavigationLink,
        SimpleTabView,
      ]
      
      // Create basic navigation
      components[0](
        components[1]('Home', () => 'Home'),
        { navigationTitle: 'App' },
      )
    })

    bench('Full navigation API usage', () => {
      // Use comprehensive navigation features
      const stack = NavigationStack(
        NavigationLink('Home', () => 'Home View', {
          isActive: false,
          onTap: () => console.log('Tapped'),
        }),
        {
          navigationTitle: 'Full Featured App',
          navigationBarHidden: false,
          toolbarBackground: '#ffffff',
        },
      )

      const tabs = SimpleTabView([
        tabItem('home', 'Home', stack),
        tabItem('settings', 'Settings', 'Settings View'),
      ])

      // Apply modifiers
      navigationTitle('Dynamic Title')(stack)
      navigationDestination('detail', () => 'Detail View')
      
      return tabs
    })
  })
})