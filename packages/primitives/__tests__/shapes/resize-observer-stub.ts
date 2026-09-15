/**
 * A ResizeObserver the tests can drive.
 *
 * jsdom does no layout and has no ResizeObserver, so a shape's frame never
 * arrives on its own. This stub records what is observed and lets a test
 * report a size, which is the one thing the engine needs from the browser.
 */

import { vi } from 'vitest'

export class ResizeObserverStub {
  static instances: ResizeObserverStub[] = []

  readonly targets = new Set<Element>()
  disconnected = false

  constructor(private readonly callback: ResizeObserverCallback) {
    ResizeObserverStub.instances.push(this)
  }

  observe(target: Element): void {
    this.targets.add(target)
  }

  unobserve(target: Element): void {
    this.targets.delete(target)
  }

  disconnect(): void {
    this.disconnected = true
    this.targets.clear()
  }

  /** Report `width` x `height` for every observed element. */
  resize(width: number, height: number): void {
    const entries = Array.from(this.targets, target => ({
      target,
      contentRect: {
        x: 0,
        y: 0,
        top: 0,
        left: 0,
        width,
        height,
        right: width,
        bottom: height,
        toJSON: () => ({}),
      },
      borderBoxSize: [],
      contentBoxSize: [],
      devicePixelContentBoxSize: [],
    })) as unknown as ResizeObserverEntry[]
    this.callback(entries, this as unknown as ResizeObserver)
  }
}

export function installResizeObserverStub(): void {
  ResizeObserverStub.instances = []
  vi.stubGlobal('ResizeObserver', ResizeObserverStub)
}

export function uninstallResizeObserverStub(): void {
  vi.unstubAllGlobals()
  ResizeObserverStub.instances = []
}

/** Report a size to every observer created so far. */
export function resizeAll(width: number, height: number): void {
  for (const observer of ResizeObserverStub.instances) {
    observer.resize(width, height)
  }
}
