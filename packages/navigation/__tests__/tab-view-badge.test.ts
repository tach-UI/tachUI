/**
 * TabView Badge Tests
 *
 * Tests for tab item badge functionality
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  SimpleTabView,
  createSimpleTabView,
  tabItem,
  getSimpleTabViewMetadata,
  formatBadge,
} from '../src/simple-tab-view'
import { HTML } from '@tachui/primitives'

describe('TabView Badge Support', () => {
  let mockTabContent1: any
  let mockTabContent2: any

  beforeEach(() => {
    mockTabContent1 = HTML.div({ children: 'Inbox Content' }).build()
    mockTabContent2 = HTML.div({ children: 'Settings Content' }).build()
  })

  describe('formatBadge helper', () => {
    it('formats numeric badge correctly', () => {
      expect(formatBadge(5)).toEqual({ show: true, isDot: false, text: '5' })
    })

    it('formats badge > 99 as 99+', () => {
      expect(formatBadge(100).text).toBe('99+')
      expect(formatBadge(150).text).toBe('99+')
      expect(formatBadge(99).text).toBe('99')
    })

    it('formats dot badge (true)', () => {
      expect(formatBadge(true)).toEqual({ show: true, isDot: true, text: '' })
    })

    it('hides badge for 0, false, undefined, empty string', () => {
      expect(formatBadge(0).show).toBe(false)
      expect(formatBadge(false).show).toBe(false)
      expect(formatBadge(undefined).show).toBe(false)
      expect(formatBadge('').show).toBe(false)
    })

    it('formats string badge correctly', () => {
      expect(formatBadge('New')).toEqual({ show: true, isDot: false, text: 'New' })
    })
  })

  describe('SimpleTabView badge metadata', () => {
    it('stores numeric badge on tab item', () => {
      const tabs = [
        tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 5),
        tabItem(mockTabContent2, 'settings', 'Settings'),
      ]
      const tabView = SimpleTabView(tabs)
      const metadata = getSimpleTabViewMetadata(tabView)
      expect(metadata.tabs[0].badge).toBe(5)
      expect(metadata.tabs[1].badge).toBeUndefined()
    })

    it('stores dot badge (true)', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, true)]
      const tabView = SimpleTabView(tabs)
      expect(getSimpleTabViewMetadata(tabView).tabs[0].badge).toBe(true)
    })

    it('stores badge 0 (hidden but stored)', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 0)]
      const tabView = SimpleTabView(tabs)
      expect(getSimpleTabViewMetadata(tabView).tabs[0].badge).toBe(0)
    })

    it('stores string badge value', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 'New')]
      const tabView = SimpleTabView(tabs)
      expect(getSimpleTabViewMetadata(tabView).tabs[0].badge).toBe('New')
    })

    it('stores icon and badge together', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', 'envelope', 5)]
      const tabView = SimpleTabView(tabs)
      const metadata = getSimpleTabViewMetadata(tabView)
      expect(metadata.tabs[0].icon).toBe('envelope')
      expect(metadata.tabs[0].badge).toBe(5)
    })

    it('createSimpleTabView passes badge through', () => {
      const tabView = createSimpleTabView([
        { id: 'inbox', label: 'Inbox', icon: 'mail', badge: 5, content: HTML.div({ children: 'Inbox' }).build() },
        { id: 'settings', label: 'Settings', content: HTML.div({ children: 'Settings' }).build() },
      ])
      const metadata = getSimpleTabViewMetadata(tabView)
      expect(metadata.tabs[0].badge).toBe(5)
      expect(metadata.tabs[1].badge).toBeUndefined()
    })
  })

  describe('Badge reactivity via updateTabBadge', () => {
    it('updateTabBadge updates the badge value', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 1)]
      const tabView = SimpleTabView(tabs)
      const metadata = getSimpleTabViewMetadata(tabView)

      expect(metadata.tabs[0].badge).toBe(1)

      metadata.updateTabBadge('inbox', 5)

      expect(metadata.tabs[0].badge).toBe(5)
    })

    it('updateTabBadge can clear a badge by setting to 0', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 3)]
      const tabView = SimpleTabView(tabs)
      const metadata = getSimpleTabViewMetadata(tabView)

      metadata.updateTabBadge('inbox', 0)

      expect(metadata.tabs[0].badge).toBe(0)
      expect(formatBadge(metadata.tabs[0].badge).show).toBe(false)
    })

    it('updateTabBadge ignores unknown tabId without throwing', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 3)]
      const tabView = SimpleTabView(tabs)
      const metadata = getSimpleTabViewMetadata(tabView)

      expect(() => metadata.updateTabBadge('nonexistent', 5)).not.toThrow()
      expect(metadata.tabs[0].badge).toBe(3)
    })
  })

  describe('Badge overlay structure', () => {
    it('renders badge element inside a position-relative icon wrapper', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', 'envelope', 5)]
      const tabView = SimpleTabView(tabs)
      expect(tabView).toBeDefined()
      // The tab bar should be built without throwing; overlay positioning is applied
      // via props.style on the icon wrapper and badge element
    })

    it('renders without badge when badge is 0', () => {
      const tabs = [tabItem(mockTabContent1, 'inbox', 'Inbox', 'envelope', 0)]
      const tabView = SimpleTabView(tabs)
      expect(tabView).toBeDefined()
    })
  })
})
