/**
 * Navigation Modifiers Tests
 *
 * Tests for SwiftUI-compatible navigation modifiers
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createBinding, createSignal, mountComponentTree } from '@tachui/core'
import { HTML, Text } from '@tachui/primitives'
import {
  navigationTitle,
  navigationBarTitleDisplayMode,
  navigationBarHidden,
  navigationBarBackButtonHidden,
  navigationBarBackButtonTitle,
  navigationBarItems,
  toolbar,
  toolbarItems,
  ToolbarItem,
  __resetToolbarItemIdCounterForTests,
  getToolbarItemsByPlacement,
  toolbarBackground,
  toolbarBackgroundVisibility,
  toolbarForegroundColor,
  presentationDetents,
  sheet,
  fullScreenCover,
  popover,
  extractNavigationModifiers,
  getCurrentNavigationModifiers,
  hasNavigationModifiers,
  clearNavigationModifiers,
  enhanceNavigationStackWithModifiers,
  onNavigationModifierChange,
  NavigationModifierUtils,
} from '../src/navigation-modifiers'

describe('Navigation Modifiers - SwiftUI Compatible Modifiers', () => {
  let mockComponent: any

  beforeEach(() => {
    mockComponent = HTML.div({ children: 'Base Component' }).build()
    __resetToolbarItemIdCounterForTests()
  })

  afterEach(() => {
    clearNavigationModifiers()
    document
      .querySelectorAll('[data-tachui-sheet-root="true"]')
      .forEach(node => node.remove())
    document
      .querySelectorAll('[data-tachui-popover-root="true"]')
      .forEach(node => node.remove())
    document
      .querySelectorAll('[data-tachui-fullscreen-cover-root="true"]')
      .forEach(node => node.remove())
  })

  const flushMicrotasks = async (): Promise<void> => {
    await Promise.resolve()
  }

  const flushAnimationFrame = async (): Promise<void> => {
    await new Promise<void>(resolve => {
      requestAnimationFrame(() => resolve())
    })
  }

  describe('Basic Navigation Modifiers', () => {
    it('applies navigationTitle modifier', () => {
      const titled = navigationTitle(mockComponent, 'My Title')

      expect(titled).toBeDefined()
      expect((titled as any)._navigationModifiers).toBeDefined()
      expect((titled as any)._navigationModifiers.title).toBe('My Title')
    })

    it('applies navigationBarTitleDisplayMode modifier', () => {
      const displayMode = navigationBarTitleDisplayMode(mockComponent, 'large')

      expect(displayMode).toBeDefined()
      expect((displayMode as any)._navigationModifiers.titleDisplayMode).toBe(
        'large'
      )
    })

    it('applies navigationBarHidden modifier', () => {
      const hidden = navigationBarHidden(mockComponent, true)

      expect(hidden).toBeDefined()
      expect((hidden as any)._navigationModifiers.barHidden).toBe(true)
    })

    it('applies navigationBarBackButtonHidden modifier', () => {
      const backHidden = navigationBarBackButtonHidden(mockComponent, true)

      expect(backHidden).toBeDefined()
      expect((backHidden as any)._navigationModifiers.backButtonHidden).toBe(
        true
      )
    })

    it('applies navigationBarBackButtonTitle modifier', () => {
      const backTitle = navigationBarBackButtonTitle(
        mockComponent,
        'Custom Back'
      )

      expect(backTitle).toBeDefined()
      expect((backTitle as any)._navigationModifiers.backButtonTitle).toBe(
        'Custom Back'
      )
    })
  })

  describe('Toolbar Modifiers', () => {
    it('applies toolbarBackground modifier', () => {
      const bgColor = toolbarBackground(mockComponent, '#007AFF')

      expect(bgColor).toBeDefined()
      expect((bgColor as any)._navigationModifiers.toolbarBackground).toBe(
        '#007AFF'
      )
    })

    it('applies toolbarForegroundColor modifier', () => {
      const fgColor = toolbarForegroundColor(mockComponent, '#FFFFFF')

      expect(fgColor).toBeDefined()
      expect((fgColor as any)._navigationModifiers.foregroundColor).toBe(
        '#FFFFFF'
      )
    })

    it('applies navigationBarItems modifier', () => {
      const leadingItem = HTML.button({ children: 'Edit' }).build()
      const trailingItem = HTML.button({ children: 'Save' }).build()

      const withItems = navigationBarItems(mockComponent, {
        leading: leadingItem,
        trailing: trailingItem,
      })

      expect(withItems).toBeDefined()
      expect((withItems as any)._navigationModifiers.leadingItems).toBeDefined()
      expect(
        (withItems as any)._navigationModifiers.trailingItems
      ).toBeDefined()
    })

    it('adds toolbar items via toolbar modifier', () => {
      const withToolbar = toolbar(mockComponent, [
        ToolbarItem({
          placement: 'navigation',
          content: () => HTML.button({ children: 'Back' }).build(),
        }),
      ])

      expect(withToolbar).toBeDefined()
    })
  })

  describe('ToolbarItem Placement', () => {
    const mountToolbarComponent = (component: any) => {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const cleanup = mountComponentTree(component, container)

      return () => {
        cleanup()
        container.remove()
      }
    }

    it('renders navigation placement in the top toolbar', () => {
      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'navigation',
          content: () => HTML.button({ children: 'Back' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(1)
      expect(toolbars[0]?.textContent).toContain('Back')

      cleanup()
    })

    it('renders primaryAction in the top toolbar trailing area', () => {
      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'primaryAction',
          content: () => HTML.button({ children: 'Save' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(1)
      expect(toolbars[0]?.textContent).toContain('Save')

      cleanup()
    })

    it('renders destructiveAction in the top toolbar', () => {
      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'destructiveAction',
          content: () => HTML.button({ children: 'Delete' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(modified)
      const deleteButton = Array.from(
        document.querySelectorAll<HTMLElement>('button')
      ).find(button => button.textContent?.includes('Delete'))

      expect(deleteButton).toBeTruthy()
      expect(document.body.textContent).toContain('Delete')

      cleanup()
    })

    it('renders bottomBar placement in a bottom toolbar after content', () => {
      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'bottomBar',
          content: () => HTML.button({ children: 'Bottom' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(modified)
      const contentText = document.body.textContent ?? ''

      expect(contentText.indexOf('Base Component')).toBeGreaterThanOrEqual(0)
      expect(contentText.indexOf('Bottom')).toBeGreaterThanOrEqual(0)
      expect(contentText.indexOf('Bottom')).toBeGreaterThan(
        contentText.indexOf('Base Component')
      )

      cleanup()
    })

    it('renders navigation, trailing, and bottom toolbar items together', () => {
      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'navigation',
          content: () => HTML.button({ children: 'Back' }).build(),
        }),
        ToolbarItem({
          placement: 'primaryAction',
          content: () => HTML.button({ children: 'Save' }).build(),
        }),
        ToolbarItem({
          placement: 'bottomBar',
          content: () => HTML.button({ children: 'Inspect' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(2)
      expect(toolbars[0]?.textContent).toContain('Back')
      expect(toolbars[0]?.textContent).toContain('Save')
      expect(toolbars[1]?.textContent).toContain('Inspect')

      cleanup()
    })

    it('appends toolbar items when toolbarItems is chained', () => {
      const firstPass = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'navigation',
          content: () => HTML.button({ children: 'Back' }).build(),
        }),
      ])
      const secondPass = toolbarItems(firstPass, [
        ToolbarItem({
          placement: 'primaryAction',
          content: () => HTML.button({ children: 'Save' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(secondPass)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(1)
      expect(toolbars[0]?.textContent).toContain('Back')
      expect(toolbars[0]?.textContent).toContain('Save')

      const placements = getToolbarItemsByPlacement(secondPass)
      expect(placements.navigation).toHaveLength(1)
      expect(placements.trailing).toHaveLength(1)

      cleanup()
    })

    it('does not evaluate toolbar content closures before mount', () => {
      const contentFactory = vi.fn(() =>
        HTML.button({ children: 'Lazy Toolbar' }).build()
      )

      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'navigation',
          content: contentFactory,
        }),
      ])

      expect(contentFactory).not.toHaveBeenCalled()

      const cleanup = mountToolbarComponent(modified)
      expect(contentFactory).toHaveBeenCalledTimes(1)

      cleanup()
    })

    it('assigns deterministic toolbar item ids', () => {
      const first = ToolbarItem({
        placement: 'navigation',
        content: () => HTML.button({ children: 'One' }).build(),
      })
      const second = ToolbarItem({
        placement: 'primaryAction',
        content: () => HTML.button({ children: 'Two' }).build(),
      })

      expect(first.id).toBe('toolbar-item-0')
      expect(second.id).toBe('toolbar-item-1')
    })

    it('does not render empty top-bar side groups', () => {
      const modified = toolbarItems(mockComponent, [
        ToolbarItem({
          placement: 'primaryAction',
          content: () => HTML.button({ children: 'Save' }).build(),
        }),
      ])

      const cleanup = mountToolbarComponent(modified)
      const topToolbar = document.querySelector('[role="toolbar"]')
      const groupContainerCount =
        topToolbar?.querySelectorAll(':scope > .tachui-hstack').length ?? 0

      expect(groupContainerCount).toBe(1)

      cleanup()
    })

    it('hides navigation bar background when scoped to navigationBar', () => {
      const modified = toolbarBackgroundVisibility(
        toolbarItems(mockComponent, [
          ToolbarItem({
            placement: 'navigation',
            content: () => HTML.button({ children: 'Back' }).build(),
          }),
        ]),
        'hidden',
        'navigationBar'
      )

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(1)
      expect(toolbars[0]?.style.backgroundColor).toBe('transparent')
      expect(toolbars[0]?.style.borderWidth).toBe('0px')

      cleanup()
    })

    it('restores navigation bar background when visibility is visible', () => {
      const modified = toolbarBackgroundVisibility(
        toolbarItems(mockComponent, [
          ToolbarItem({
            placement: 'navigation',
            content: () => HTML.button({ children: 'Back' }).build(),
          }),
        ]),
        'visible',
        'navigationBar'
      )

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(1)
      expect(toolbars[0]?.style.backgroundColor).toBe('rgb(249, 250, 251)')
      expect(toolbars[0]?.style.borderWidth).toBe('1px')

      cleanup()
    })

    it('applies hidden background to bottomBar only when scoped to bottomBar', () => {
      const modified = toolbarBackgroundVisibility(
        toolbarItems(mockComponent, [
          ToolbarItem({
            placement: 'navigation',
            content: () => HTML.button({ children: 'Back' }).build(),
          }),
          ToolbarItem({
            placement: 'bottomBar',
            content: () => HTML.button({ children: 'Inspect' }).build(),
          }),
        ]),
        'hidden',
        'bottomBar'
      )

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(2)
      expect(toolbars[0]?.style.backgroundColor).toBe('rgb(249, 250, 251)')
      expect(toolbars[1]?.style.backgroundColor).toBe('transparent')
      expect(toolbars[1]?.style.borderWidth).toBe('0px')

      cleanup()
    })

    it('applies hidden background to navigation bar only when scoped to navigationBar', () => {
      const modified = toolbarBackgroundVisibility(
        toolbarItems(mockComponent, [
          ToolbarItem({
            placement: 'navigation',
            content: () => HTML.button({ children: 'Back' }).build(),
          }),
          ToolbarItem({
            placement: 'bottomBar',
            content: () => HTML.button({ children: 'Inspect' }).build(),
          }),
        ]),
        'hidden',
        'navigationBar'
      )

      const cleanup = mountToolbarComponent(modified)
      const toolbars = Array.from(
        document.querySelectorAll<HTMLElement>('[role="toolbar"]')
      )

      expect(toolbars).toHaveLength(2)
      expect(toolbars[0]?.style.backgroundColor).toBe('transparent')
      expect(toolbars[0]?.style.borderWidth).toBe('0px')
      expect(toolbars[1]?.style.backgroundColor).toBe('rgb(249, 250, 251)')

      cleanup()
    })
  })

  describe('Sheet Modifier', () => {
    it('renders sheet when presentation signal becomes true', async () => {
      const [isPresented, setIsPresented] = createSignal(false)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build()
      )

      const cleanup = mountComponentTree(component, container)

      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeNull()

      setIsPresented(true)
      await flushMicrotasks()

      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeTruthy()

      cleanup()
      container.remove()
    })

    it('unmounts sheet when presentation signal becomes false', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeTruthy()

      setIsPresented(false)
      await flushMicrotasks()

      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
    })

    it('dismisses sheet on backdrop tap', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const backdrop = document.querySelector(
        '[data-tachui-sheet-backdrop="true"]'
      ) as HTMLDivElement | null

      expect(backdrop).toBeTruthy()
      backdrop?.click()
      await flushMicrotasks()

      expect(isPresented()).toBe(false)
      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('renders provided sheet content', async () => {
      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Rendered from sheet' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      expect(document.body.textContent).toContain('Rendered from sheet')

      cleanup()
      container.remove()
    })

    it('reacts to repeated open and close toggles', async () => {
      const [isPresented, setIsPresented] = createSignal(false)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build()
      )

      const cleanup = mountComponentTree(component, container)

      setIsPresented(true)
      await flushMicrotasks()
      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeTruthy()

      setIsPresented(false)
      await flushMicrotasks()
      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeNull()

      setIsPresented(true)
      await flushMicrotasks()
      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeTruthy()

      cleanup()
      container.remove()
    })

    it('does not dismiss from backdrop when dismissOnBackdropTap is false', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build(),
        { dismissOnBackdropTap: false }
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const backdrop = document.querySelector(
        '[data-tachui-sheet-backdrop="true"]'
      ) as HTMLDivElement | null
      backdrop?.click()
      await flushMicrotasks()

      expect(isPresented()).toBe(true)
      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeTruthy()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('supports Binding<boolean> dismiss and onDismiss callback', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const binding = createBinding<boolean>(() => isPresented(), value => {
        setIsPresented(
          typeof value === 'function' ? value(isPresented()) : value
        )
      })
      const onDismiss = vi.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        binding,
        () => HTML.div({ children: 'Sheet content' }).build(),
        { onDismiss }
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const backdrop = document.querySelector(
        '[data-tachui-sheet-backdrop="true"]'
      ) as HTMLDivElement | null
      backdrop?.click()
      await flushMicrotasks()

      expect(isPresented()).toBe(false)
      expect(onDismiss).toHaveBeenCalledTimes(1)

      cleanup()
      container.remove()
    })

    it('applies sheet presentation option styles', async () => {
      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build(),
        {
          backdropColor: 'rgba(255, 0, 0, 0.2)',
          zIndex: 4242,
          maxWidth: '420px',
          ariaLabel: 'Preferences sheet',
        }
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const portalRoot = document.querySelector(
        '[data-tachui-sheet-root="true"]'
      ) as HTMLDivElement | null
      const backdrop = document.querySelector(
        '[data-tachui-sheet-backdrop="true"]'
      ) as HTMLDivElement | null
      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null

      expect(portalRoot?.style.zIndex).toBe('4242')
      expect(backdrop?.style.background).toBe('rgba(255, 0, 0, 0.2)')
      expect(content?.style.maxWidth).toBe('420px')
      expect(content?.getAttribute('role')).toBe('dialog')
      expect(content?.getAttribute('aria-modal')).toBe('true')
      expect(content?.getAttribute('aria-label')).toBe('Preferences sheet')

      cleanup()
      container.remove()
    })

    it('dismisses on Escape key by default', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Sheet content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushMicrotasks()

      expect(isPresented()).toBe(false)
      expect(
        document.querySelector('[data-tachui-sheet-root="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('dismisses only the topmost sheet on Escape when stacked', async () => {
      const [isFirstPresented, setFirstPresented] = createSignal(true)
      const [isSecondPresented, setSecondPresented] = createSignal(true)
      const firstContainer = document.createElement('div')
      const secondContainer = document.createElement('div')
      document.body.append(firstContainer, secondContainer)

      const firstComponent = sheet(
        HTML.div({ children: 'First host' }).build(),
        isFirstPresented,
        () => HTML.div({ children: 'First sheet' }).build()
      )

      const secondComponent = sheet(
        HTML.div({ children: 'Second host' }).build(),
        isSecondPresented,
        () => HTML.div({ children: 'Second sheet' }).build()
      )

      const cleanupFirst = mountComponentTree(firstComponent, firstContainer)
      const cleanupSecond = mountComponentTree(secondComponent, secondContainer)
      await flushMicrotasks()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushMicrotasks()

      expect(isSecondPresented()).toBe(false)
      expect(isFirstPresented()).toBe(true)
      expect(
        document.querySelectorAll('[data-tachui-sheet-root="true"]')
      ).toHaveLength(1)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushMicrotasks()

      expect(isFirstPresented()).toBe(false)
      expect(
        document.querySelectorAll('[data-tachui-sheet-root="true"]')
      ).toHaveLength(0)

      cleanupSecond()
      cleanupFirst()
      firstContainer.remove()
      secondContainer.remove()
      setFirstPresented(false)
      setSecondPresented(false)
    })

    it('applies medium detent sizing to approximately 50vh', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            ['medium']
          )
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(500)
      expect(
        document.querySelector('[data-tachui-sheet-drag-handle="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })

    it('applies large detent sizing to approximately 90vh', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            ['large']
          )
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(900)

      cleanup()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })

    it('applies custom fraction and custom height detents', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const fractionComponent = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            [{ fraction: 0.4 }]
          )
      )

      const cleanupFraction = mountComponentTree(fractionComponent, container)
      await flushMicrotasks()

      let content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(400)
      cleanupFraction()

      const heightComponent = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            [{ height: 300 }]
          )
      )
      const cleanupHeight = mountComponentTree(heightComponent, container)
      await flushMicrotasks()

      content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(300)

      cleanupHeight()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })

    it('clamps fraction and height detent values to valid bounds', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const lowFractionComponent = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            [{ fraction: 0 }]
          )
      )
      const cleanupLowFraction = mountComponentTree(lowFractionComponent, container)
      await flushMicrotasks()

      let content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(100)
      cleanupLowFraction()

      const highFractionComponent = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            [{ fraction: 1.5 }]
          )
      )
      const cleanupHighFraction = mountComponentTree(highFractionComponent, container)
      await flushMicrotasks()

      content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(950)
      cleanupHighFraction()

      const zeroHeightComponent = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            [{ height: 0 }]
          )
      )
      const cleanupZeroHeight = mountComponentTree(zeroHeightComponent, container)
      await flushMicrotasks()

      content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(1)
      cleanupZeroHeight()

      const largeHeightComponent = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            [{ height: 4000 }]
          )
      )
      const cleanupLargeHeight = mountComponentTree(largeHeightComponent, container)
      await flushMicrotasks()

      content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(950)

      cleanupLargeHeight()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })

    it('animates sheet entrance when detents are configured', async () => {
      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            ['medium']
          )
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(content?.style.transform).toBe('translateY(100%)')

      await flushAnimationFrame()
      expect(content?.style.transform).toBe('translateY(0)')

      cleanup()
      container.remove()
    })

    it('renders drag indicator and snaps between detents when dragged', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            ['medium', 'large']
          )
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      const handle = document.querySelector(
        '[data-tachui-sheet-drag-handle="true"]'
      ) as HTMLDivElement | null

      expect(handle).toBeTruthy()
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(500)

      handle?.dispatchEvent(
        new MouseEvent('mousedown', { clientY: 600, bubbles: true })
      )
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientY: 120, bubbles: true })
      )
      window.dispatchEvent(
        new MouseEvent('mouseup', { clientY: 120, bubbles: true })
      )
      await flushMicrotasks()

      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(900)

      cleanup()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })

    it('supports touch drag snapping between detents', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            ['medium', 'large']
          )
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      const handle = document.querySelector(
        '[data-tachui-sheet-drag-handle="true"]'
      ) as HTMLDivElement | null
      expect(handle).toBeTruthy()

      const touchStart = new Event('touchstart', {
        bubbles: true,
        cancelable: true,
      }) as unknown as TouchEvent
      Object.defineProperty(touchStart, 'touches', {
        value: [{ identifier: 1, clientY: 600 }],
      })
      handle?.dispatchEvent(touchStart)

      const touchMove = new Event('touchmove', {
        bubbles: true,
        cancelable: true,
      }) as unknown as TouchEvent
      Object.defineProperty(touchMove, 'touches', {
        value: [{ identifier: 1, clientY: 120 }],
      })
      window.dispatchEvent(touchMove)

      const touchEnd = new Event('touchend', {
        bubbles: true,
        cancelable: true,
      }) as unknown as TouchEvent
      window.dispatchEvent(touchEnd)
      await flushMicrotasks()

      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(900)

      cleanup()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })

    it('recalculates detent height on resize and removes resize listener on cleanup', async () => {
      const originalInnerHeight = window.innerHeight
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1000,
      })
      const removeSpy = vi.spyOn(window, 'removeEventListener')

      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = sheet(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () =>
          presentationDetents(
            HTML.div({ children: 'Sheet content' }).build(),
            ['medium']
          )
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()

      const content = document.querySelector(
        '[data-tachui-sheet-content="true"]'
      ) as HTMLDivElement | null
      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(500)

      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: 1200,
      })
      window.dispatchEvent(new Event('resize'))
      await flushMicrotasks()

      expect(Number.parseFloat(content?.style.height ?? '0')).toBe(600)

      cleanup()
      expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function))

      removeSpy.mockRestore()
      container.remove()
      Object.defineProperty(window, 'innerHeight', {
        configurable: true,
        writable: true,
        value: originalInnerHeight,
      })
    })
  })

  describe('FullScreenCover Modifier', () => {
    it('renders full-screen cover when presentation signal is true', async () => {
      const [isPresented, setIsPresented] = createSignal(false)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = fullScreenCover(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Cover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)

      setIsPresented(true)
      await flushMicrotasks()
      await flushAnimationFrame()

      expect(
        document.querySelector('[data-tachui-fullscreen-cover-root="true"]')
      ).toBeTruthy()

      cleanup()
      container.remove()
    })

    it('unmounts full-screen cover when presentation signal is false', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = fullScreenCover(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Cover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()
      await flushAnimationFrame()
      expect(
        document.querySelector('[data-tachui-fullscreen-cover-root="true"]')
      ).toBeTruthy()

      setIsPresented(false)
      await flushMicrotasks()

      expect(
        document.querySelector('[data-tachui-fullscreen-cover-root="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('applies full viewport sizing styles', async () => {
      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = fullScreenCover(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Cover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()
      await flushAnimationFrame()

      const root = document.querySelector(
        '[data-tachui-fullscreen-cover-root="true"]'
      ) as HTMLDivElement | null

      expect(root?.style.position).toBe('fixed')
      expect(root?.style.width).toBe('100vw')
      expect(root?.style.height).toBe('100vh')
      expect(root?.style.inset).toBe('0')

      cleanup()
      container.remove()
    })

    it('traps focus within the cover while open', async () => {
      const [isPresented] = createSignal(true)
      const outsideButton = document.createElement('button')
      outsideButton.textContent = 'Outside'
      document.body.appendChild(outsideButton)
      outsideButton.focus()

      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = fullScreenCover(
        HTML.div({ children: 'Host' }).build(),
        isPresented,
        () => HTML.div({ children: 'Cover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      await flushMicrotasks()
      await flushAnimationFrame()

      const coverHost = document.querySelector(
        '[data-tachui-fullscreen-cover-content="true"]'
      ) as HTMLElement | null
      expect(coverHost).toBeTruthy()
      expect(document.activeElement).toBe(coverHost)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
      expect(document.activeElement).toBe(coverHost)

      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      )
      expect(document.activeElement).toBe(coverHost)

      cleanup()
      container.remove()
      outsideButton.remove()
    })
  })

  describe('Popover Modifier', () => {
    const mockAnchorRect = (
      element: Element,
      rect: {
        top: number
        left: number
        width: number
        height: number
      }
    ) => {
      Object.defineProperty(element, 'getBoundingClientRect', {
        value: () => ({
          x: rect.left,
          y: rect.top,
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          right: rect.left + rect.width,
          bottom: rect.top + rect.height,
          toJSON: () => ({}),
        }),
        configurable: true,
      })
    }

    it('positions popover relative to requested edge', async () => {
      const [isPresented, setIsPresented] = createSignal(false)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'top',
        () => HTML.div({ children: 'Popover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()

      mockAnchorRect(anchor!, { top: 80, left: 120, width: 100, height: 40 })
      setIsPresented(true)
      await flushMicrotasks()
      await flushAnimationFrame()

      const popoverNode = document.querySelector(
        '[data-tachui-popover-content="true"]'
      ) as HTMLDivElement | null
      expect(popoverNode).toBeTruthy()
      expect(popoverNode?.getAttribute('data-tachui-popover-edge')).toBe('top')

      cleanup()
      container.remove()
    })

    it('flips popover edge when preferred edge overflows viewport', async () => {
      const [isPresented, setIsPresented] = createSignal(false)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'bottom',
        () => HTML.div({ children: 'Popover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()

      mockAnchorRect(anchor!, { top: 5, left: 120, width: 100, height: 40 })
      setIsPresented(true)
      await flushMicrotasks()
      await flushAnimationFrame()

      const popoverNode = document.querySelector(
        '[data-tachui-popover-content="true"]'
      ) as HTMLDivElement | null
      expect(popoverNode).toBeTruthy()
      expect(popoverNode?.getAttribute('data-tachui-popover-edge')).toBe('top')

      cleanup()
      container.remove()
    })

    it('dismisses popover on outside click', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'top',
        () => HTML.div({ children: 'Popover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 100, left: 140, width: 60, height: 36 })
      await flushMicrotasks()
      await flushAnimationFrame()

      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      await flushMicrotasks()

      expect(isPresented()).toBe(false)
      expect(
        document.querySelector('[data-tachui-popover-root="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('dismisses popover on Escape key', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'leading',
        () => HTML.div({ children: 'Popover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 160, left: 180, width: 44, height: 32 })
      await flushMicrotasks()
      await flushAnimationFrame()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushMicrotasks()

      expect(isPresented()).toBe(false)
      expect(
        document.querySelector('[data-tachui-popover-root="true"]')
      ).toBeNull()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('renders provided popover content', async () => {
      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'trailing',
        () => HTML.div({ children: 'Popover body content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 180, left: 220, width: 72, height: 36 })
      await flushMicrotasks()
      await flushAnimationFrame()

      expect(document.body.textContent).toContain('Popover body content')

      cleanup()
      container.remove()
    })

    it('does not dismiss when dismissOnOutsideClick is false', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'top',
        () => HTML.div({ children: 'Popover content' }).build(),
        { dismissOnOutsideClick: false }
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 100, left: 140, width: 60, height: 36 })
      await flushMicrotasks()
      await flushAnimationFrame()

      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }))
      await flushMicrotasks()

      expect(isPresented()).toBe(true)
      expect(
        document.querySelector('[data-tachui-popover-root="true"]')
      ).toBeTruthy()

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('calls onDismiss when popover is dismissed', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const onDismiss = vi.fn()
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'top',
        () => HTML.div({ children: 'Popover content' }).build(),
        { onDismiss }
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 100, left: 140, width: 60, height: 36 })
      await flushMicrotasks()
      await flushAnimationFrame()

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await flushMicrotasks()

      expect(isPresented()).toBe(false)
      expect(onDismiss).toHaveBeenCalledTimes(1)

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('supports leading and trailing edge positioning', async () => {
      const [isLeadingPresented, setLeadingPresented] = createSignal(true)
      const [isTrailingPresented, setTrailingPresented] = createSignal(true)
      const leadingContainer = document.createElement('div')
      const trailingContainer = document.createElement('div')
      document.body.append(leadingContainer, trailingContainer)

      const leadingComponent = popover(
        HTML.button({ children: 'Leading' }).build(),
        isLeadingPresented,
        'leading',
        () => HTML.div({ children: 'Leading content' }).build()
      )
      const trailingComponent = popover(
        HTML.button({ children: 'Trailing' }).build(),
        isTrailingPresented,
        'trailing',
        () => HTML.div({ children: 'Trailing content' }).build()
      )

      const cleanupLeading = mountComponentTree(leadingComponent, leadingContainer)
      const leadingAnchor = leadingContainer.querySelector('button')
      expect(leadingAnchor).toBeTruthy()
      mockAnchorRect(leadingAnchor!, { top: 180, left: 180, width: 80, height: 40 })
      await flushMicrotasks()
      await flushAnimationFrame()

      const leadingPopover = document.querySelector(
        '[data-tachui-popover-content="true"]'
      ) as HTMLDivElement | null
      expect(leadingPopover?.getAttribute('data-tachui-popover-edge')).toBe(
        'leading'
      )

      const cleanupTrailing = mountComponentTree(
        trailingComponent,
        trailingContainer
      )
      const trailingAnchor = trailingContainer.querySelector('button')
      expect(trailingAnchor).toBeTruthy()
      mockAnchorRect(trailingAnchor!, { top: 220, left: 640, width: 80, height: 40 })
      await flushMicrotasks()
      await flushAnimationFrame()

      const popovers = document.querySelectorAll('[data-tachui-popover-content="true"]')
      const trailingPopover = popovers[popovers.length - 1] as HTMLDivElement | undefined
      expect(trailingPopover?.getAttribute('data-tachui-popover-edge')).toBe(
        'trailing'
      )

      cleanupTrailing()
      cleanupLeading()
      leadingContainer.remove()
      trailingContainer.remove()
      setLeadingPresented(false)
      setTrailingPresented(false)
    })

    it('flips from top to bottom when bottom viewport edge would overflow', async () => {
      const [isPresented, setIsPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'top',
        () => HTML.div({ children: 'Popover content' }).build()
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 740, left: 120, width: 80, height: 40 })
      await flushMicrotasks()
      await flushAnimationFrame()

      const popoverNode = document.querySelector(
        '[data-tachui-popover-content="true"]'
      ) as HTMLDivElement | null
      expect(popoverNode?.getAttribute('data-tachui-popover-edge')).toBe(
        'bottom'
      )

      cleanup()
      container.remove()
      setIsPresented(false)
    })

    it('applies popover style options to the DOM', async () => {
      const [isPresented] = createSignal(true)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const component = popover(
        HTML.button({ children: 'Info' }).build(),
        isPresented,
        'top',
        () => HTML.div({ children: 'Popover content' }).build(),
        {
          zIndex: 3456,
          maxWidth: '420px',
          ariaLabel: 'Help popover',
        }
      )

      const cleanup = mountComponentTree(component, container)
      const anchor = container.querySelector('button')
      expect(anchor).toBeTruthy()
      mockAnchorRect(anchor!, { top: 180, left: 220, width: 72, height: 36 })
      await flushMicrotasks()
      await flushAnimationFrame()

      const popoverRoot = document.querySelector(
        '[data-tachui-popover-root="true"]'
      ) as HTMLDivElement | null
      const popoverNode = document.querySelector(
        '[data-tachui-popover-content="true"]'
      ) as HTMLDivElement | null

      expect(popoverRoot?.style.zIndex).toBe('3456')
      expect(popoverNode?.style.maxWidth).toBe('420px')
      expect(popoverNode?.getAttribute('aria-label')).toBe('Help popover')
      expect(popoverNode?.hasAttribute('aria-modal')).toBe(false)

      cleanup()
      container.remove()
    })
  })

  describe('Modifier Chaining', () => {
    it('chains multiple navigation modifiers', () => {
      const chained = toolbarForegroundColor(
        toolbarBackground(
          navigationBarTitleDisplayMode(
            navigationTitle(mockComponent, 'Chained Title'),
            'large'
          ),
          '#007AFF'
        ),
        '#FFFFFF'
      )

      const modifiers = (chained as any)._navigationModifiers

      expect(modifiers.title).toBe('Chained Title')
      expect(modifiers.titleDisplayMode).toBe('large')
      expect(modifiers.toolbarBackground).toBe('#007AFF')
      expect(modifiers.foregroundColor).toBe('#FFFFFF')
    })

    it('preserves existing modifiers when adding new ones', () => {
      const step1 = navigationTitle(mockComponent, 'Initial Title')
      const step2 = navigationBarHidden(step1, true)
      const step3 = toolbarBackground(step2, '#FF0000')

      const modifiers = (step3 as any)._navigationModifiers

      expect(modifiers.title).toBe('Initial Title')
      expect(modifiers.barHidden).toBe(true)
      expect(modifiers.toolbarBackground).toBe('#FF0000')
    })

    it('overwrites same modifier type', () => {
      const step1 = navigationTitle(mockComponent, 'First Title')
      const step2 = navigationTitle(step1, 'Second Title')

      const modifiers = (step2 as any)._navigationModifiers

      expect(modifiers.title).toBe('Second Title')
    })
  })

  describe('SwiftUI Compatibility', () => {
    it('matches SwiftUI modifier chaining syntax', () => {
      // SwiftUI: view.navigationTitle("Title").navigationBarTitleDisplayMode(.large)
      const swiftUIStyled = navigationBarTitleDisplayMode(
        navigationTitle(mockComponent, 'SwiftUI Style'),
        'large'
      )

      expect(swiftUIStyled).toBeDefined()
    })

    it('supports SwiftUI display mode values', () => {
      const comp1 = HTML.div({ children: 'Test1' }).build()
      const comp2 = HTML.div({ children: 'Test2' }).build()
      const comp3 = HTML.div({ children: 'Test3' }).build()

      const automatic = navigationBarTitleDisplayMode(comp1, 'automatic')
      const inline = navigationBarTitleDisplayMode(comp2, 'inline')
      const large = navigationBarTitleDisplayMode(comp3, 'large')

      expect((automatic as any)._navigationModifiers.titleDisplayMode).toBe(
        'automatic'
      )
      expect((inline as any)._navigationModifiers.titleDisplayMode).toBe(
        'inline'
      )
      expect((large as any)._navigationModifiers.titleDisplayMode).toBe('large')
    })

    it('supports SwiftUI toolbar item placement', () => {
      const editButton = HTML.button({ children: 'Edit' }).build()
      const doneButton = HTML.button({ children: 'Done' }).build()
      const addButton = HTML.button({ children: '+' }).build()

      const withToolbarItems = navigationBarItems(mockComponent, {
        leading: editButton,
        trailing: [doneButton, addButton],
      })

      expect(withToolbarItems).toBeDefined()
      expect(
        (withToolbarItems as any)._navigationModifiers.leadingItems
      ).toHaveLength(1)
      expect(
        (withToolbarItems as any)._navigationModifiers.trailingItems
      ).toHaveLength(2)
    })
  })

  describe('Modifier Utilities', () => {
    it('extracts navigation modifiers from component', () => {
      const modified = navigationTitle(
        navigationBarHidden(mockComponent, true),
        'Extracted Title'
      )

      const extracted = extractNavigationModifiers(modified)

      expect(extracted).toBeDefined()
      expect(extracted.title).toBe('Extracted Title')
      expect(extracted.barHidden).toBe(true)
    })

    it('gets current navigation modifiers', () => {
      const current = getCurrentNavigationModifiers()

      expect(current).toBeDefined()
      expect(typeof current).toBe('object')
    })

    it('checks if component has navigation modifiers', () => {
      const unmodified = HTML.div({ children: 'Unmodified' }).build()
      const modified = navigationTitle(
        HTML.div({ children: 'Modified' }).build(),
        'Has Modifiers'
      )

      expect(hasNavigationModifiers(unmodified)).toBe(false)
      expect(hasNavigationModifiers(modified)).toBe(true)
    })
  })

  describe('NavigationStack Integration', () => {
    it('enhances NavigationStack with modifiers', () => {
      const mockNavStack = HTML.div({ children: 'Nav Stack' }).build()

      const enhanced = enhanceNavigationStackWithModifiers(mockNavStack)

      expect(enhanced).toBeDefined()
      expect((enhanced as any)._modifierCleanup).toBeDefined()
    })
  })

  describe('Modifier Change Events', () => {
    it('registers navigation modifier change listeners', () => {
      let changeCount = 0
      const listener = () => {
        changeCount++
      }

      const unregister = onNavigationModifierChange(listener)

      expect(typeof unregister).toBe('function')

      // Cleanup
      unregister()
    })

    it('unregisters navigation modifier change listeners', () => {
      let changeCount = 0
      const listener = () => {
        changeCount++
      }

      const unregister = onNavigationModifierChange(listener)
      unregister()

      expect(changeCount).toBe(0)
    })
  })

  describe('Navigation Modifier Utils', () => {
    it('provides navigation modifier utilities', () => {
      expect(NavigationModifierUtils).toBeDefined()
      expect(typeof NavigationModifierUtils.createScope).toBe('function')
      expect(typeof NavigationModifierUtils.mergeConfigs).toBe('function')
      expect(typeof NavigationModifierUtils.isEmpty).toBe('function')
    })

    it('creates modifier scopes', () => {
      const scope = NavigationModifierUtils.createScope()

      expect(scope.push).toBeDefined()
      expect(scope.pop).toBeDefined()
      expect(scope.current).toBeDefined()
    })

    it('merges modifier configurations', () => {
      const config1 = { title: 'Title 1', barHidden: true }
      const config2 = { titleDisplayMode: 'large' as const }

      const merged = NavigationModifierUtils.mergeConfigs(config1, config2)

      expect(merged.title).toBe('Title 1')
      expect(merged.barHidden).toBe(true)
      expect(merged.titleDisplayMode).toBe('large')
    })

    it('checks if configuration is empty', () => {
      const empty = {}
      const notEmpty = { title: 'Test' }

      expect(NavigationModifierUtils.isEmpty(empty)).toBe(true)
      expect(NavigationModifierUtils.isEmpty(notEmpty)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles null component gracefully', () => {
      expect(() => {
        navigationTitle(null as any, 'Null Component')
      }).toThrow() // The implementation should throw for null components
    })

    it('handles invalid modifier values gracefully', () => {
      const modified = navigationTitle(mockComponent, '' as any)

      expect(modified).toBeDefined()
      expect((modified as any)._navigationModifiers.title).toBe('')
    })
  })

  describe('Performance', () => {
    it('applies modifiers efficiently', () => {
      const startTime = performance.now()

      let current = mockComponent
      for (let i = 0; i < 100; i++) {
        current = navigationTitle(
          HTML.div({ children: `Test ${i}` }).build(),
          `Title ${i}`
        )
      }

      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // Relaxed threshold
    })

    it('handles complex modifier chains efficiently', () => {
      const startTime = performance.now()

      const complex = toolbarForegroundColor(
        toolbarBackground(
          navigationBarItems(mockComponent, {
            leading: HTML.button({ children: 'L1' }).build(),
            trailing: [
              HTML.button({ children: 'T1' }).build(),
              HTML.button({ children: 'T2' }).build(),
              HTML.button({ children: 'T3' }).build(),
            ],
          }),
          '#007AFF'
        ),
        '#FFFFFF'
      )

      const endTime = performance.now()

      expect(complex).toBeDefined()
      expect(endTime - startTime).toBeLessThan(50)
    })
  })

  describe('Integration with Components', () => {
    it('works with Text components', () => {
      const textComponent = Text('Navigation Text')
      const titledText = navigationTitle(textComponent, 'Text Title')

      expect(titledText).toBeDefined()
      expect((titledText as any)._navigationModifiers.title).toBe('Text Title')
    })

    it('works with complex nested components', () => {
      const nestedComponent = HTML.div({
        children: [
          Text('Header'),
          HTML.div({
            children: [
              Text('Nested content'),
              HTML.button({ children: 'Button' }).build(),
            ],
          }).build(),
        ],
      }).build()

      const modifiedNested = navigationTitle(nestedComponent, 'Nested Title')

      expect(modifiedNested).toBeDefined()
      expect((modifiedNested as any)._navigationModifiers.title).toBe(
        'Nested Title'
      )
    })
  })
})
