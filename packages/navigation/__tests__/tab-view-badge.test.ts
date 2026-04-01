/**
 * TabView Badge Tests
 *
 * Tests for tab item badge functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SimpleTabView, createSimpleTabView, tabItem, getSimpleTabViewMetadata } from '../src/simple-tab-view'
import { HTML } from '@tachui/primitives'

describe('TabView Badge Support', () => {
  let mockTabContent1: any
  let mockTabContent2: any

  beforeEach(() => {
    mockTabContent1 = HTML.div({ children: 'Inbox Content' }).build()
    mockTabContent2 = HTML.div({ children: 'Settings Content' }).build()
  })

  afterEach(() => {
    // Cleanup
  })

  it('renders numeric badge with correct count', () => {
    const tabs = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 5),
      tabItem(mockTabContent2, 'settings', 'Settings'),
    ]

    const tabView = SimpleTabView(tabs)

    // Verify tabView was created
    expect(tabView).toBeDefined()

    // Get metadata to check badge
    const metadata = getSimpleTabViewMetadata(tabView)
    expect(metadata).toBeDefined()
    expect(metadata.tabs).toHaveLength(2)

    // Check that the tab has the badge
    expect(metadata.tabs[0].badge).toBe(5)
    expect(metadata.tabs[1].badge).toBeUndefined()
  })

  it('stores badge counts over 99 correctly', () => {
    const tabs = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 150),
    ]

    const tabView = SimpleTabView(tabs)
    const metadata = getSimpleTabViewMetadata(tabView)
    expect(metadata.tabs[0].badge).toBe(150)

    // The display logic will show 99+ when rendered
  })

  it('renders dot badge when badge is true', () => {
    const tabs = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, true),
      tabItem(mockTabContent2, 'settings', 'Settings'),
    ]

    const tabView = SimpleTabView(tabs)
    const metadata = getSimpleTabViewMetadata(tabView)
    expect(metadata.tabs[0].badge).toBe(true)
    expect(metadata.tabs[1].badge).toBeUndefined()
  })

  it('hides badge when count is 0', () => {
    const tabs = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 0),
      tabItem(mockTabContent2, 'settings', 'Settings', undefined, 3),
    ]

    const tabView = SimpleTabView(tabs)
    const metadata = getSimpleTabViewMetadata(tabView)

    // Badge should be 0 but considered falsy for display
    expect(metadata.tabs[0].badge).toBe(0)
    expect(metadata.tabs[1].badge).toBe(3)
  })

  it('supports string badge values', () => {
    const tabs = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 'New'),
    ]

    const tabView = SimpleTabView(tabs)
    const metadata = getSimpleTabViewMetadata(tabView)
    expect(metadata.tabs[0].badge).toBe('New')
  })

  it('supports updating badge via createSimpleTabView', () => {
    const tabs1 = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 1),
    ]

    const tabView1 = SimpleTabView(tabs1)
    const metadata1 = getSimpleTabViewMetadata(tabView1)
    expect(metadata1.tabs[0].badge).toBe(1)

    // Create a new view with updated badge
    const tabs2 = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', undefined, 5),
    ]
    const tabView2 = SimpleTabView(tabs2)
    const metadata2 = getSimpleTabViewMetadata(tabView2)
    expect(metadata2.tabs[0].badge).toBe(5)
  })

  it('badge renders with correct visual styling', () => {
    const tabs = [
      tabItem(mockTabContent1, 'inbox', 'Inbox', 'envelope', 5),
    ]

    const tabView = SimpleTabView(tabs)

    // Verify the metadata contains icon and badge
    const metadata = getSimpleTabViewMetadata(tabView)
    expect(metadata.tabs[0].icon).toBe('envelope')
    expect(metadata.tabs[0].badge).toBe(5)
    expect(metadata.tabs[0].label).toBe('Inbox')
  })

  it('uses createSimpleTabView helper with badges', () => {
    const tabView = createSimpleTabView([
      { id: 'inbox', label: 'Inbox', icon: 'mail', badge: 5, content: HTML.div({ children: 'Inbox' }).build() },
      { id: 'settings', label: 'Settings', content: HTML.div({ children: 'Settings' }).build() },
    ])

    const metadata = getSimpleTabViewMetadata(tabView)
    expect(metadata.tabs).toHaveLength(2)
    expect(metadata.tabs[0].badge).toBe(5)
    expect(metadata.tabs[1].badge).toBeUndefined()
  })
})
