/**
 * SimpleTabView Tests
 * 
 * Tests for SwiftUI-compatible SimpleTabView implementation
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HTML, createSignal } from '../../core/src'
import { SimpleTabView, tabItem, createSimpleTabView, getSimpleTabViewMetadata, isSimpleTabView } from '../src/simple-tab-view'
import type { SimpleTabViewOptions } from '../src/simple-tab-view'

describe('SimpleTabView - SwiftUI Compatible Tab System', () => {
  let mockTabContent1: any
  let mockTabContent2: any
  let mockTabContent3: any
  
  beforeEach(() => {
    mockTabContent1 = HTML.div({ children: 'Home Content' }).modifier.build()
    mockTabContent2 = HTML.div({ children: 'Search Content' }).modifier.build()
    mockTabContent3 = HTML.div({ children: 'Profile Content' }).modifier.build()
  })

  describe('Basic Functionality', () => {
    it('creates simple tab view with tab items', () => {
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home', '🏠'),
        tabItem(mockTabContent2, 'search', 'Search', '🔍'),
        tabItem(mockTabContent3, 'profile', 'Profile', '👤')
      ]
      
      const tabView = SimpleTabView(tabs)
      
      expect(tabView).toBeDefined()
      expect(tabView.type).toBe('component')
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('creates tab view with minimal tab items', () => {
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home')
      ]
      
      const tabView = SimpleTabView(tabs)
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('accepts tab view options', () => {
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home')
      ]
      
      const options: SimpleTabViewOptions = {
        tabPlacement: 'bottom',
        backgroundColor: '#F8F9FA',
        accentColor: '#007AFF'
      }
      
      const tabView = SimpleTabView(tabs, options)
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })
  })

  describe('tabItem Modifier', () => {
    it('creates tab item with all parameters', () => {
      const tab = tabItem(mockTabContent1, 'home', 'Home', '🏠', 'New', false)
      
      expect(tab).toBeDefined()
      expect((tab as any)._tabItem).toBeDefined()
    })

    it('creates tab item with icon', () => {
      const tab = tabItem(mockTabContent1, 'home', 'Home', '🏠')
      const metadata = (tab as any)._tabItem
      
      expect(metadata.id).toBe('home')
      expect(metadata.label).toBe('Home')
      expect(metadata.icon).toBe('🏠')
    })

    it('creates tab item with badge', () => {
      const tab = tabItem(mockTabContent1, 'notifications', 'Notifications', '🔔', '5')
      const metadata = (tab as any)._tabItem
      
      expect(metadata.badge).toBe('5')
    })

    it('creates disabled tab item', () => {
      const tab = tabItem(mockTabContent1, 'disabled', 'Disabled', '', '', true)
      const metadata = (tab as any)._tabItem
      
      expect(metadata.disabled).toBe(true)
    })

    it('creates tab item with minimal parameters', () => {
      const tab = tabItem(mockTabContent1, 'simple', 'Simple')
      const metadata = (tab as any)._tabItem
      
      expect(metadata.id).toBe('simple')
      expect(metadata.label).toBe('Simple')
      expect(metadata.icon).toBeUndefined()
    })
  })

  describe('SwiftUI Compatibility', () => {
    it('matches SwiftUI TabView with selection binding pattern', () => {
      const [selection, setSelection] = createSignal('home')
      const binding = { get: selection, set: setSelection }
      
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home'),
        tabItem(mockTabContent2, 'search', 'Search')
      ]
      
      const tabView = SimpleTabView(tabs, { selection: binding })
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('supports SwiftUI-style tab placement', () => {
      const tabs = [tabItem(mockTabContent1, 'home', 'Home')]
      
      const bottomTabView = SimpleTabView(tabs, { tabPlacement: 'bottom' })
      const topTabView = SimpleTabView(tabs, { tabPlacement: 'top' })
      
      expect(bottomTabView).toBeDefined()
      expect(topTabView).toBeDefined()
      expect(isSimpleTabView(bottomTabView)).toBe(true)
      expect(isSimpleTabView(topTabView)).toBe(true)
    })

    it('supports SwiftUI-style appearance customization', () => {
      const tabs = [tabItem(mockTabContent1, 'home', 'Home')]
      
      const customTabView = SimpleTabView(tabs, {
        backgroundColor: '#F8F9FA',
        accentColor: '#007AFF'
      })
      
      expect(customTabView).toBeDefined()
      expect(isSimpleTabView(customTabView)).toBe(true)
    })
  })

  describe('Tab Selection', () => {
    it('handles selection changes', () => {
      let selectedTab = 'home'
      const setSelectedTab = (newTab: string) => { selectedTab = newTab }
      
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home'),
        tabItem(mockTabContent2, 'search', 'Search')
      ]
      
      const tabView = SimpleTabView(tabs, {
        onSelectionChange: setSelectedTab
      })
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('supports external selection control', () => {
      const [selection, setSelection] = createSignal('search')
      const binding = { get: selection, set: setSelection }
      
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home'),
        tabItem(mockTabContent2, 'search', 'Search')
      ]
      
      const tabView = SimpleTabView(tabs, { selection: binding })
      
      expect(tabView).toBeDefined()
      expect(selection()).toBe('search')
    })
  })

  describe('Utility Functions', () => {
    it('createSimpleTabView factory function works', () => {
      const tabConfigs = [
        { id: 'home', label: 'Home', content: mockTabContent1 }
      ]
      
      const tabView = createSimpleTabView(tabConfigs)
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('getSimpleTabViewMetadata extracts metadata', () => {
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home'),
        tabItem(mockTabContent2, 'search', 'Search')
      ]
      
      const tabView = SimpleTabView(tabs, {
        tabPlacement: 'bottom'
      })
      
      const metadata = getSimpleTabViewMetadata(tabView)
      
      expect(metadata).toBeDefined()
      expect(metadata.type).toBe('SimpleTabView')
      expect(metadata.tabs).toHaveLength(2)
    })

    it('isSimpleTabView correctly identifies SimpleTabView components', () => {
      const tabs = [tabItem(mockTabContent1, 'home', 'Home')]
      const tabView = SimpleTabView(tabs)
      const regularComponent = HTML.div({ children: 'Not a tab view' }).modifier.build()
      
      expect(isSimpleTabView(tabView)).toBe(true)
      expect(isSimpleTabView(regularComponent)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles empty tab array by creating fallback tabs', () => {
      const tabView = SimpleTabView([])
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('handles components without tabItem modifier', () => {
      const plainComponent = HTML.div({ children: 'Plain content' }).modifier.build()
      const tabView = SimpleTabView([plainComponent])
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('handles invalid options gracefully', () => {
      const tabs = [tabItem(mockTabContent1, 'home', 'Home')]
      const tabView = SimpleTabView(tabs, {} as any)
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })
  })

  describe('Performance', () => {
    it('creates tab views efficiently', () => {
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home'),
        tabItem(mockTabContent2, 'search', 'Search')
      ]
      
      const startTime = performance.now()
      
      for (let i = 0; i < 50; i++) {
        SimpleTabView(tabs)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // Should complete in under 200ms
    })

    it('handles many tabs efficiently', () => {
      const manyTabs = Array.from({ length: 10 }, (_, i) => 
        tabItem(
          HTML.div({ children: `Tab ${i} Content` }).modifier.build(),
          `tab-${i}`,
          `Tab ${i}`,
          `📄`
        )
      )
      
      const tabView = SimpleTabView(manyTabs)
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
      const metadata = getSimpleTabViewMetadata(tabView)
      expect(metadata.tabs).toHaveLength(10)
    })
  })

  describe('Integration with Navigation System', () => {
    it('works with NavigationStack integration', () => {
      const tabs = [
        tabItem(mockTabContent1, 'home', 'Home'),
        tabItem(mockTabContent2, 'search', 'Search')
      ]
      
      const tabView = SimpleTabView(tabs)
      
      // Integration test just verifies components can be created together
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })

    it('supports NavigationLink within tabs', () => {
      const contentWithLinks = HTML.div({
        children: [
          mockTabContent1,
          HTML.div({ children: 'Navigation content' }).modifier.build()
        ]
      }).modifier.build()
      
      const tabs = [
        tabItem(contentWithLinks, 'home', 'Home')
      ]
      
      const tabView = SimpleTabView(tabs)
      
      expect(tabView).toBeDefined()
      expect(isSimpleTabView(tabView)).toBe(true)
    })
  })
})