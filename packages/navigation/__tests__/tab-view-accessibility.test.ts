import { describe, expect, it } from 'vitest'
import { Text } from '@tachui/primitives'
import { TabView, createTabItem } from '../src/tab-view'

function collectElements(node: any, acc: any[] = []): any[] {
  if (!node || typeof node !== 'object') {
    return acc
  }

  if (Array.isArray(node)) {
    node.forEach(child => collectElements(child, acc))
    return acc
  }

  if (node.type === 'element') {
    acc.push(node)
    const children = Array.isArray(node.children) ? node.children : []
    children.forEach(child => collectElements(child, acc))
  }

  return acc
}

describe('TabView accessibility semantics', () => {
  it('renders tablist/tab/tabpanel ARIA linkage', () => {
    const tabs = [
      createTabItem('home', 'Home', Text('Home content')),
      createTabItem('search', 'Search', Text('Search content')),
    ]

    const tabView = TabView(tabs)
    const rendered = tabView.render()
    const elements = collectElements(rendered)

    const tabList = elements.find(
      element => element.props?.role === 'tablist'
    )
    expect(tabList).toBeDefined()
    expect(tabList.props?.['aria-label']).toBe('Tab navigation')

    const tabButtons = elements.filter(element => element.props?.role === 'tab')
    expect(tabButtons).toHaveLength(2)
    expect(tabButtons[0].props?.id).toBeDefined()
    expect(tabButtons[1].props?.id).toBeDefined()
    expect(tabButtons[0].props?.['aria-controls']).toBeDefined()
    expect(tabButtons[1].props?.['aria-controls']).toBeDefined()

    const selectedTabs = tabButtons.filter(
      element => element.props?.['aria-selected'] === 'true'
    )
    expect(selectedTabs).toHaveLength(1)

    const panel = elements.find(element => element.props?.role === 'tabpanel')
    expect(panel).toBeDefined()
    expect(panel.props?.id).toBe(selectedTabs[0].props?.['aria-controls'])
    expect(panel.props?.['aria-labelledby']).toBe(selectedTabs[0].props?.id)
    expect(panel.props?.tabIndex).toBe(0)
  })

  it('updates aria-selected and roving tabIndex when active tab changes', () => {
    const tabs = [
      createTabItem('home', 'Home', Text('Home content')),
      createTabItem('search', 'Search', Text('Search content')),
    ]

    const tabView = TabView(tabs)
    const coordinator = (tabView as any).tabCoordinator

    coordinator.selectTab('search')

    const elements = collectElements(tabView.render())
    const tabButtons = elements.filter(element => element.props?.role === 'tab')

    const homeTab = tabButtons.find(
      element => element.props?.id && String(element.props.id).includes('home')
    )
    const searchTab = tabButtons.find(
      element =>
        element.props?.id && String(element.props.id).includes('search')
    )

    expect(homeTab?.props?.['aria-selected']).toBe('false')
    expect(homeTab?.props?.tabIndex).toBe(-1)
    expect(searchTab?.props?.['aria-selected']).toBe('true')
    expect(searchTab?.props?.tabIndex).toBe(0)
  })

  it('sets aria-disabled on disabled tabs and supports custom tablist label', () => {
    const tabs = [
      createTabItem('home', 'Home', Text('Home content')),
      createTabItem('disabled', 'Disabled', Text('Disabled content'), {
        disabled: true,
      }),
    ]

    const tabView = TabView(tabs, {
      accessibilityLabel: 'Primary navigation tabs',
    })

    const elements = collectElements(tabView.render())
    const tabList = elements.find(element => element.props?.role === 'tablist')
    expect(tabList?.props?.['aria-label']).toBe('Primary navigation tabs')

    const tabButtons = elements.filter(element => element.props?.role === 'tab')
    const disabledTab = tabButtons.find(
      element =>
        element.props?.id && String(element.props.id).includes('disabled')
    )
    expect(disabledTab?.props?.['aria-disabled']).toBe('true')
  })
})
