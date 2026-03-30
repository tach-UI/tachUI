/**
 * NavigationSplitView Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComponentTree } from '@tachui/core'
import { Button, HTML, VStack } from '@tachui/primitives'
import {
  NavigationSplitView,
  useNavigationSplitView,
} from '../src/navigation-split-view'

describe('NavigationSplitView', () => {
  let originalInnerWidth: number

  beforeEach(() => {
    originalInnerWidth = window.innerWidth
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value: originalInnerWidth,
    })
  })

  const setViewportWidth = (value: number): void => {
    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      writable: true,
      value,
    })
  }

  const flush = async (): Promise<void> => {
    await Promise.resolve()
  }

  const mountSplitView = (component: ReturnType<typeof NavigationSplitView>) => {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const cleanup = mountComponentTree(component, container)
    return {
      cleanup: () => {
        cleanup()
        container.remove()
      },
      container,
    }
  }

  const createSampleSplitView = () =>
    NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [
            Button('Open A', () => context.selectDetail('A')).build(),
            Button('Open B', () => context.selectDetail('B')).build(),
          ],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build(),
    })

  const createThreeColumnSplitView = (
    columnWidths?: {
      sidebar?: number | { min?: number; preferred?: number; max?: number }
      content?: number | { min?: number; preferred?: number; max?: number }
      detail?: number | { min?: number; preferred?: number; max?: number }
    }
  ) =>
    NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [Button('Choose A', () => context.selectDetail('A')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      content: context =>
        HTML.div({
          children: `Content: ${context.selectedValue() ?? 'none'}`,
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build(),
      columnWidths,
    })

  it('renders two columns at and above breakpoint', () => {
    setViewportWidth(1024)
    const split = createSampleSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView detail"]')
    ).toBeTruthy()

    cleanup()
  })

  it('renders three columns at and above 1024px when content is provided', () => {
    setViewportWidth(1200)
    const split = createThreeColumnSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView three-column"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView content"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView detail"]')
    ).toBeTruthy()

    cleanup()
  })

  it('degrades to two columns at 768-1023px with sidebar hidden behind toggle', async () => {
    setViewportWidth(900)
    const split = createThreeColumnSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView three-column"]')
    ).toBeNull()
    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeNull()
    expect(document.body.textContent).toContain('Show Sidebar')

    const showSidebarButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Show Sidebar')
    )
    showSidebarButton?.click()
    await flush()

    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()
    expect(document.body.textContent).toContain('Hide Sidebar')

    cleanup()
  })

  it('degrades to single-column stacked navigation below 768px', () => {
    setViewportWidth(700)
    const split = createThreeColumnSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView three-column"]')
    ).toBeNull()
    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeNull()
    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()

    cleanup()
  })

  it('respects custom column width constraints in three-column mode', () => {
    setViewportWidth(1200)
    const split = createThreeColumnSplitView({
      sidebar: { min: 180, preferred: 220, max: 260 },
      content: 320,
      detail: { min: 420, max: 900 },
    })
    const { cleanup } = mountSplitView(split)

    const shell = document.querySelector(
      '[aria-label="NavigationSplitView three-column"]'
    ) as HTMLElement | null
    expect(shell).toBeTruthy()
    const columns = shell ? Array.from(shell.children) as HTMLElement[] : []
    expect(columns.length).toBe(3)
    expect(columns[0]?.style.minWidth).toBe('180px')
    expect(columns[0]?.style.width).toBe('220px')
    expect(columns[0]?.style.maxWidth).toBe('260px')
    expect(columns[1]?.style.minWidth).toBe('320px')
    expect(columns[1]?.style.width).toBe('320px')
    expect(columns[1]?.style.maxWidth).toBe('320px')
    expect(columns[2]?.style.minWidth).toBe('420px')
    expect(columns[2]?.style.maxWidth).toBe('900px')

    cleanup()
  })

  it('supports column selection flow in medium mode via sidebar toggle', async () => {
    setViewportWidth(900)
    const split = createThreeColumnSplitView()
    const { cleanup } = mountSplitView(split)

    const showSidebarButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Show Sidebar')
    )
    showSidebarButton?.click()
    await flush()

    const chooseAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Choose A')
    )
    chooseAButton?.click()
    await flush()

    expect(document.body.textContent).toContain('Detail: A')
    expect(document.body.textContent).not.toContain('Hide Sidebar')
    expect(document.body.textContent).toContain('Show Sidebar')

    cleanup()
  })

  it('transitions from three-column to two-column layout on resize below 1024px', async () => {
    vi.useFakeTimers()
    setViewportWidth(1200)
    const split = createThreeColumnSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView three-column"]')
    ).toBeTruthy()

    setViewportWidth(900)
    window.dispatchEvent(new Event('resize'))
    vi.advanceTimersByTime(120)
    await flush()

    expect(
      document.querySelector('[aria-label="NavigationSplitView three-column"]')
    ).toBeNull()
    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeTruthy()

    cleanup()
  })

  it('does not remount sidebar or content when selecting detail in three-column mode', async () => {
    setViewportWidth(1200)
    let sidebarRenderCount = 0
    let contentRenderCount = 0
    let detailRenderCount = 0

    const split = NavigationSplitView<string>({
      sidebar: context => {
        sidebarRenderCount++
        return VStack({
          children: [Button('Choose A', () => context.selectDetail('A')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build()
      },
      content: context => {
        contentRenderCount++
        return HTML.div({
          children: `Content: ${context.selectedValue() ?? 'none'}`,
        }).build()
      },
      detail: context => {
        detailRenderCount++
        return HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build()
      },
    })
    const { cleanup } = mountSplitView(split)

    expect(sidebarRenderCount).toBe(1)
    expect(contentRenderCount).toBe(1)
    expect(detailRenderCount).toBe(1)

    const chooseAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Choose A')
    )
    chooseAButton?.click()
    await flush()

    expect(sidebarRenderCount).toBe(1)
    expect(contentRenderCount).toBe(1)
    expect(detailRenderCount).toBe(2)
    expect(document.body.textContent).toContain('Detail: A')

    cleanup()
  })

  it('renders sidebar-first layout below breakpoint', () => {
    setViewportWidth(600)
    const split = createSampleSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()
    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeNull()

    cleanup()
  })

  it('shows detail screen after sidebar selection on narrow layout', async () => {
    setViewportWidth(600)
    const split = createSampleSplitView()
    const { cleanup } = mountSplitView(split)

    const openAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open A')
    )
    openAButton?.click()
    await flush()

    expect(
      document.querySelector('[aria-label="NavigationSplitView detail"]')
    ).toBeTruthy()
    expect(document.body.textContent).toContain('Detail: A')
    expect(document.body.textContent).toContain('Back')

    cleanup()
  })

  it('returns to sidebar when back is tapped on narrow layout', async () => {
    setViewportWidth(600)
    const split = createSampleSplitView()
    const { cleanup } = mountSplitView(split)

    const openAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open A')
    )
    openAButton?.click()
    await flush()

    const backButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Back')
    )
    backButton?.click()
    await flush()

    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()
    expect(document.body.textContent).not.toContain('Detail: A')

    cleanup()
  })

  it('updates detail content when selection changes', async () => {
    setViewportWidth(1024)
    const split = createSampleSplitView()
    const { cleanup } = mountSplitView(split)

    const openAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open A')
    )

    openAButton?.click()
    await flush()
    expect(document.body.textContent).toContain('Detail: A')

    const openBButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open B')
    )
    openBButton?.click()
    await flush()
    expect(document.body.textContent).toContain('Detail: B')

    cleanup()
  })

  it('does not remount sidebar in two-column mode when selecting detail', async () => {
    setViewportWidth(1024)
    let sidebarRenderCount = 0
    let detailRenderCount = 0

    const split = NavigationSplitView<string>({
      sidebar: context => {
        sidebarRenderCount++
        return VStack({
          children: [Button('Open A', () => context.selectDetail('A')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build()
      },
      detail: context => {
        detailRenderCount++
        return HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build()
      },
    })
    const { cleanup } = mountSplitView(split)

    expect(sidebarRenderCount).toBe(1)
    expect(detailRenderCount).toBe(1)

    const openAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open A')
    )
    openAButton?.click()
    await flush()

    expect(sidebarRenderCount).toBe(1)
    expect(detailRenderCount).toBe(2)
    expect(document.body.textContent).toContain('Detail: A')

    cleanup()
  })

  it('responds to breakpoint transitions on window resize', async () => {
    vi.useFakeTimers()
    setViewportWidth(1024)
    const split = createSampleSplitView()
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeTruthy()

    setViewportWidth(600)
    window.dispatchEvent(new Event('resize'))
    vi.advanceTimersByTime(120)
    await flush()

    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeNull()
    expect(
      document.querySelector('[aria-label="NavigationSplitView sidebar"]')
    ).toBeTruthy()

    cleanup()
  })

  it('uses custom mobile labels when provided', async () => {
    setViewportWidth(600)
    const split = NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [Button('Open A', () => context.selectDetail('A')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build(),
      backLabel: 'Return',
      detailTitle: 'Selection',
    })
    const { cleanup } = mountSplitView(split)

    const openAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open A')
    )
    openAButton?.click()
    await flush()

    expect(document.body.textContent).toContain('Return')
    expect(document.body.textContent).toContain('Selection')

    cleanup()
  })

  it('respects custom breakpoint prop', () => {
    setViewportWidth(700)
    const split = NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [Button('Open', () => context.selectDetail('A')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build(),
      breakpoint: 600,
    })
    const { cleanup } = mountSplitView(split)

    expect(
      document.querySelector('[aria-label="NavigationSplitView two-column"]')
    ).toBeTruthy()

    cleanup()
  })

  it('supports showDetail without selectDetail', async () => {
    setViewportWidth(600)
    const split = NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [Button('Show detail', () => context.showDetail()).build()],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail: ${context.selectedValue() ?? 'none'}`,
        }).build(),
    })
    const { cleanup } = mountSplitView(split)

    const showDetailButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Show detail')
    )
    showDetailButton?.click()
    await flush()

    expect(document.body.textContent).toContain('Detail: none')
    expect(document.body.textContent).toContain('Back')

    cleanup()
  })

  it('exposes isCollapsed through context during render', () => {
    setViewportWidth(600)
    let observedCollapsed: boolean | null = null

    const split = NavigationSplitView<string>({
      sidebar: context => {
        observedCollapsed = context.isCollapsed()
        return HTML.div({ children: 'Sidebar' }).build()
      },
      detail: () => HTML.div({ children: 'Detail' }).build(),
    })
    const { cleanup } = mountSplitView(split)

    expect(observedCollapsed).toBe(true)

    cleanup()
  })

  it('returns split-view context in synchronous render and null outside it', () => {
    setViewportWidth(1024)
    let seenContextDuringRender = false

    const split = NavigationSplitView<string>({
      sidebar: () => {
        seenContextDuringRender = useNavigationSplitView<string>() !== null
        return HTML.div({ children: 'Sidebar' }).build()
      },
      detail: () => HTML.div({ children: 'Detail' }).build(),
    })
    const { cleanup } = mountSplitView(split)

    expect(seenContextDuringRender).toBe(true)
    expect(useNavigationSplitView<string>()).toBeNull()

    cleanup()
  })

  it('keeps contexts isolated when two split views are mounted', async () => {
    setViewportWidth(600)

    const splitA = NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [Button('Open A', () => context.selectDetail('A')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail A: ${context.selectedValue() ?? 'none'}`,
        }).build(),
    })
    const splitB = NavigationSplitView<string>({
      sidebar: context =>
        VStack({
          children: [Button('Open B', () => context.selectDetail('B')).build()],
          spacing: 8,
          alignment: 'leading',
        }).build(),
      detail: context =>
        HTML.div({
          children: `Detail B: ${context.selectedValue() ?? 'none'}`,
        }).build(),
    })

    const mountA = mountSplitView(splitA)
    const mountB = mountSplitView(splitB)

    const openAButton = Array.from(document.querySelectorAll('button')).find(
      button => button.textContent?.includes('Open A')
    )
    openAButton?.click()
    await flush()

    expect(document.body.textContent).toContain('Detail A: A')
    expect(document.body.textContent).not.toContain('Detail B: B')

    mountA.cleanup()
    mountB.cleanup()
  })
})
