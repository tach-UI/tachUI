/**
 * NavigationSplitView Tests
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mountComponentTree } from '@tachui/core'
import { Button, HTML, VStack } from '@tachui/primitives'
import { NavigationSplitView } from '../src/navigation-split-view'

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
})
