/**
 * Advanced TabView Tests
 *
 * Tests for SwiftUI-style advanced TabView features
 */

import { describe, it, expect, vi } from 'vitest'
import { HTML } from '@tachui/primitives'
import {
  AdvancedTabView,
  PageTabView,
  GroupedTabView,
  AdvancedTabViewUtils,
} from '../src/tab-view-compatibility'

// Types for backwards compatibility
type AdvancedTabItem = any
type TabViewStyle = 'automatic' | 'page' | 'grouped' | 'sidebar'
type TabBarAppearance = any
type TabReorderEvent = any
type TabCloseEvent = any

describe('Advanced TabView Features', () => {
  describe('AdvancedTabView', () => {
    const mockTabs: AdvancedTabItem[] = [
      {
        id: 'tab1',
        label: 'Tab 1',
        content: () => HTML.div({ children: 'Content 1' }).modifier.build(),
        badge: '3',
        isReorderable: true,
      },
      {
        id: 'tab2',
        label: 'Tab 2',
        content: () => HTML.div({ children: 'Content 2' }).modifier.build(),
        badge: 'New',
        badgeColor: '#FF0000',
      },
      {
        id: 'tab3',
        label: 'Tab 3',
        content: () => HTML.div({ children: 'Content 3' }).modifier.build(),
        isClosable: true,
      },
    ]

    it('creates advanced tab view with metadata', () => {
      const tabView = AdvancedTabView(mockTabs)

      expect(tabView).toBeDefined()
      expect((tabView as any)._advancedTabView).toBeDefined()
      expect((tabView as any)._advancedTabView.type).toBe('AdvancedTabView')
    })

    it('supports different tab view styles', () => {
      const styles: TabViewStyle[] = ['automatic', 'page', 'grouped', 'sidebar']

      styles.forEach(style => {
        const tabView = AdvancedTabView(mockTabs, { style })
        const metadata = (tabView as any)._advancedTabView

        expect(metadata.style).toBe(style)
      })
    })

    it('supports tab bar appearance customization', () => {
      const appearance: TabBarAppearance = {
        backgroundColor: '#FF0000',
        selectedColor: '#FFFFFF',
        unselectedColor: '#CCCCCC',
        indicatorColor: '#FFFF00',
        itemSpacing: 12,
        padding: { top: 8, bottom: 8, leading: 16, trailing: 16 },
      }

      const tabView = AdvancedTabView(mockTabs, { appearance })
      const metadata = (tabView as any)._advancedTabView

      expect(metadata.appearance).toEqual(appearance)
    })

    it('supports tab reordering', () => {
      const onTabReorder = vi.fn()
      const tabView = AdvancedTabView(mockTabs, {
        allowsReordering: true,
        onTabReorder,
      })

      const metadata = (tabView as any)._advancedTabView

      // Test reorder method
      metadata.reorderTabs(0, 2)

      // Would need to verify internal state change
      expect(metadata.reorderTabs).toBeDefined()
    })

    it('supports tab closing', () => {
      const onTabClose = vi.fn()
      const tabView = AdvancedTabView(mockTabs, {
        allowsClosing: true,
        onTabClose,
      })

      const metadata = (tabView as any)._advancedTabView

      // Test remove method
      metadata.removeTab('tab3')

      expect(metadata.removeTab).toBeDefined()
    })

    it('handles tab overflow with scrolling', () => {
      const manyTabs = Array.from({ length: 15 }, (_, i) => ({
        id: `tab${i}`,
        label: `Tab ${i}`,
        content: () => HTML.div({ children: `Content ${i}` }).modifier.build(),
      }))

      const tabView = AdvancedTabView(manyTabs, {
        maxVisibleTabs: 8,
        overflowBehavior: 'scroll',
      })

      expect(tabView).toBeDefined()
    })

    it('handles tab overflow with dropdown', () => {
      const manyTabs = Array.from({ length: 12 }, (_, i) => ({
        id: `tab${i}`,
        label: `Tab ${i}`,
        content: () => HTML.div({ children: `Content ${i}` }).modifier.build(),
      }))

      const tabView = AdvancedTabView(manyTabs, {
        maxVisibleTabs: 6,
        overflowBehavior: 'dropdown',
      })

      expect((tabView as any)._overflowButton).toBeDefined()
    })

    it('supports different tab placements', () => {
      const placements = ['top', 'bottom', 'leading', 'trailing'] as const

      placements.forEach(placement => {
        const tabView = AdvancedTabView(mockTabs, { tabPlacement: placement })
        expect(tabView).toBeDefined()
      })
    })

    it('supports animation configuration', () => {
      const tabView = AdvancedTabView(mockTabs, {
        animationDuration: 500,
      })

      expect(tabView).toBeDefined()
    })

    it('provides tab management methods', () => {
      const tabView = AdvancedTabView(mockTabs)
      const metadata = (tabView as any)._advancedTabView

      expect(metadata.addTab).toBeTypeOf('function')
      expect(metadata.removeTab).toBeTypeOf('function')
      expect(metadata.reorderTabs).toBeTypeOf('function')
      expect(metadata.updateAppearance).toBeTypeOf('function')
    })
  })

  describe('PageTabView', () => {
    const mockPages = [
      HTML.div({ children: 'Page 1' }).modifier.build(),
      HTML.div({ children: 'Page 2' }).modifier.build(),
      HTML.div({ children: 'Page 3' }).modifier.build(),
    ]

    it('creates page tab view with metadata', () => {
      const pageView = PageTabView(mockPages)

      expect(pageView).toBeDefined()
      expect((pageView as any)._pageTabView).toBeDefined()
      expect((pageView as any)._pageTabView.type).toBe('PageTabView')
      expect((pageView as any)._pageTabView.pageCount).toBe(3)
    })

    it('supports selection binding', () => {
      const selection = vi.fn(() => 1)
      const onSelectionChange = vi.fn()

      const pageView = PageTabView(mockPages, {
        selection,
        onSelectionChange,
      })

      expect(pageView).toBeDefined()
    })

    it('supports different index display modes', () => {
      const modes = ['automatic', 'always', 'never'] as const

      modes.forEach(mode => {
        const pageView = PageTabView(mockPages, { indexDisplayMode: mode })
        const metadata = (pageView as any)._pageTabView

        expect(metadata.indexDisplayMode).toBe(mode)
      })
    })

    it('supports different background styles', () => {
      const styles = ['automatic', 'prominent', 'regular'] as const

      styles.forEach(style => {
        const pageView = PageTabView(mockPages, { backgroundStyle: style })
        const metadata = (pageView as any)._pageTabView

        expect(metadata.backgroundStyle).toBe(style)
      })
    })

    it('provides navigation methods', () => {
      const pageView = PageTabView(mockPages)
      const metadata = (pageView as any)._pageTabView

      expect(metadata.goToPage).toBeTypeOf('function')
      expect(metadata.nextPage).toBeTypeOf('function')
      expect(metadata.previousPage).toBeTypeOf('function')
    })
  })

  describe('GroupedTabView', () => {
    const mockSections = [
      {
        title: 'Main Tabs',
        tabs: [
          {
            id: 'main1',
            label: 'Main 1',
            content: () =>
              HTML.div({ children: 'Main Content 1' }).modifier.build(),
          },
          {
            id: 'main2',
            label: 'Main 2',
            content: () =>
              HTML.div({ children: 'Main Content 2' }).modifier.build(),
          },
        ],
      },
      {
        title: 'Secondary Tabs',
        tabs: [
          {
            id: 'sec1',
            label: 'Secondary 1',
            content: () =>
              HTML.div({ children: 'Secondary Content 1' }).modifier.build(),
          },
        ],
      },
    ]

    it('creates grouped tab view with sections', () => {
      const groupedView = GroupedTabView(mockSections)

      expect(groupedView).toBeDefined()
      expect((groupedView as any)._groupedTabView).toBeDefined()
      expect((groupedView as any)._groupedTabView.type).toBe('GroupedTabView')
      expect((groupedView as any)._groupedTabView.sections).toEqual(
        mockSections
      )
    })

    it('supports grouped tab view options', () => {
      const options = {
        style: 'grouped' as TabViewStyle,
        allowsReordering: true,
      }

      const groupedView = GroupedTabView(mockSections, options)
      const metadata = (groupedView as any)._groupedTabView

      expect(metadata.options).toEqual(options)
    })
  })

  describe('AdvancedTabViewUtils', () => {
    const mockTabs: AdvancedTabItem[] = [
      {
        id: 'tab1',
        label: 'Tab 1',
        content: () => HTML.div({ children: 'Content 1' }).modifier.build(),
      },
    ]

    it('identifies advanced tab views', () => {
      const advancedTabView = AdvancedTabView(mockTabs)
      const regularDiv = HTML.div({
        children: 'Not a tab view',
      }).modifier.build()

      expect(AdvancedTabViewUtils.isAdvancedTabView(advancedTabView)).toBe(true)
      expect(AdvancedTabViewUtils.isAdvancedTabView(regularDiv)).toBe(false)
    })

    it('extracts advanced tab view metadata', () => {
      const advancedTabView = AdvancedTabView(mockTabs)
      const metadata =
        AdvancedTabViewUtils.getAdvancedTabViewMetadata(advancedTabView)

      expect(metadata).toBeDefined()
      expect(metadata.type).toBe('AdvancedTabView')
    })

    it('creates appearance presets', () => {
      const presets = ['default', 'prominent', 'minimal'] as const

      presets.forEach(preset => {
        const appearance = AdvancedTabViewUtils.createAppearancePreset(preset)

        expect(appearance).toBeDefined()
        expect(appearance.backgroundColor).toBeDefined()
        expect(appearance.selectedColor).toBeDefined()
        expect(appearance.unselectedColor).toBeDefined()
        expect(appearance.indicatorColor).toBeDefined()
        expect(appearance.padding).toBeDefined()
      })
    })

    it('creates prominent appearance preset', () => {
      const appearance =
        AdvancedTabViewUtils.createAppearancePreset('prominent')

      expect(appearance.backgroundColor).toBe('#007AFF')
      expect(appearance.selectedColor).toBe('#FFFFFF')
      expect(appearance.unselectedColor).toBe('rgba(255, 255, 255, 0.7)')
    })

    it('creates minimal appearance preset', () => {
      const appearance = AdvancedTabViewUtils.createAppearancePreset('minimal')

      expect(appearance.backgroundColor).toBe('transparent')
      expect(appearance.selectedColor).toBe('#007AFF')
      expect(appearance.unselectedColor).toBe('#8E8E93')
    })

    it('creates default appearance preset', () => {
      const appearance = AdvancedTabViewUtils.createAppearancePreset('default')

      expect(appearance.backgroundColor).toBe('#F8F9FA')
      expect(appearance.selectedColor).toBe('#007AFF')
      expect(appearance.unselectedColor).toBe('#8E8E93')
    })
  })

  describe('Tab Events', () => {
    it('handles tab reorder events', () => {
      const onTabReorder = vi.fn()
      const mockTabs: AdvancedTabItem[] = [
        {
          id: 'tab1',
          label: 'Tab 1',
          content: () => HTML.div({ children: 'Content 1' }).modifier.build(),
          isReorderable: true,
        },
        {
          id: 'tab2',
          label: 'Tab 2',
          content: () => HTML.div({ children: 'Content 2' }).modifier.build(),
          isReorderable: true,
        },
      ]

      const tabView = AdvancedTabView(mockTabs, {
        allowsReordering: true,
        onTabReorder,
      })

      expect(tabView).toBeDefined()
    })

    it('handles tab close events', () => {
      const onTabClose = vi.fn()
      const mockTabs: AdvancedTabItem[] = [
        {
          id: 'tab1',
          label: 'Tab 1',
          content: () => HTML.div({ children: 'Content 1' }).modifier.build(),
          isClosable: true,
        },
      ]

      const tabView = AdvancedTabView(mockTabs, {
        allowsClosing: true,
        onTabClose,
      })

      expect(tabView).toBeDefined()
    })
  })

  describe('Advanced Tab Features', () => {
    it('supports tab badges', () => {
      const tabWithBadge: AdvancedTabItem = {
        id: 'badged-tab',
        label: 'Badged Tab',
        content: () => HTML.div({ children: 'Content' }).modifier.build(),
        badge: '99+',
        badgeColor: '#FF0000',
      }

      const tabView = AdvancedTabView([tabWithBadge])
      expect(tabView).toBeDefined()
    })

    it('supports accessibility labels', () => {
      const accessibleTab: AdvancedTabItem = {
        id: 'accessible-tab',
        label: 'Accessible Tab',
        content: () => HTML.div({ children: 'Content' }).modifier.build(),
        accessibilityLabel: 'Main navigation tab',
        accessibilityHint: 'Double tap to open main content',
      }

      const tabView = AdvancedTabView([accessibleTab])
      expect(tabView).toBeDefined()
    })

    it('supports context menus', () => {
      const contextMenu = [
        HTML.button({ children: 'Duplicate Tab' }).modifier.build(),
        HTML.button({ children: 'Close Tab' }).modifier.build(),
      ]

      const tabWithContext: AdvancedTabItem = {
        id: 'context-tab',
        label: 'Context Tab',
        content: () => HTML.div({ children: 'Content' }).modifier.build(),
        contextMenu,
      }

      const tabView = AdvancedTabView([tabWithContext])
      expect(tabView).toBeDefined()
    })
  })
})
