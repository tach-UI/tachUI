import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createComputed } from '@tachui/core'
import { size } from '@tachui/modifiers'
import { useViewport } from '../src/viewport-reactivity'

async function flushReactiveUpdates(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

function setViewportSize(width: number, height: number): void {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
    writable: true,
  })
}

describe('@tachui/viewport useViewport reactivity', () => {
  let cleanups: Array<() => void> = []

  beforeEach(() => {
    cleanups = []
    setViewportSize(1024, 768)
  })

  afterEach(() => {
    while (cleanups.length > 0) {
      const cleanup = cleanups.pop()
      cleanup?.()
    }
  })

  it('updates width and height signals after resize event', async () => {
    const viewport = useViewport()
    cleanups.push(viewport.dispose)

    expect(viewport.width()).toBe(1024)
    expect(viewport.height()).toBe(768)

    setViewportSize(1280, 720)
    window.dispatchEvent(new Event('resize'))
    await flushReactiveUpdates()

    expect(viewport.width()).toBe(1280)
    expect(viewport.height()).toBe(720)
  })

  it('re-computes derived values when viewport changes', async () => {
    const viewport = useViewport()
    cleanups.push(viewport.dispose)

    const aspectRatio = createComputed(() => viewport.width() / viewport.height())
    expect(aspectRatio()).toBeCloseTo(1024 / 768)

    setViewportSize(1600, 800)
    window.dispatchEvent(new Event('resize'))
    await flushReactiveUpdates()

    expect(aspectRatio()).toBeCloseTo(2)
  })

  it('notifies multiple viewport subscribers on resize', async () => {
    const first = useViewport()
    const second = useViewport()
    cleanups.push(first.dispose, second.dispose)

    setViewportSize(900, 600)
    window.dispatchEvent(new Event('resize'))
    await flushReactiveUpdates()

    expect(first.width()).toBe(900)
    expect(first.height()).toBe(600)
    expect(second.width()).toBe(900)
    expect(second.height()).toBe(600)
  })

  it('updates modifier-driven DOM styles when viewport width changes', async () => {
    const viewport = useViewport()
    cleanups.push(viewport.dispose)

    const element = document.createElement('div')
    document.body.appendChild(element)
    cleanups.push(() => element.remove())

    const modifier = size({ width: viewport.width })
    modifier.apply({} as any, {
      componentId: 'viewport-reactivity-test',
      element,
      phase: 'creation',
    })
    await flushReactiveUpdates()

    expect(element.style.width).toBe('1024px')

    setViewportSize(640, 768)
    window.dispatchEvent(new Event('resize'))
    await flushReactiveUpdates()

    expect(element.style.width).toBe('640px')
  })

  it('stops receiving updates after dispose is called', async () => {
    const viewport = useViewport()

    expect(viewport.width()).toBe(1024)
    viewport.dispose()

    setViewportSize(1111, 777)
    window.dispatchEvent(new Event('resize'))
    await flushReactiveUpdates()

    expect(viewport.width()).toBe(1024)
    expect(viewport.height()).toBe(768)
  })
})
