import { expect } from 'vitest'
import {
  createEffect,
  createSignal,
  getSignalImpl,
  type SignalSetter,
} from '../../src/reactive'
import { createIsolatedRegistry, type ModifierRegistry } from '@tachui/registry'

type SignalHandle<T> = {
  get: () => T
  set: SignalSetter<T>
}

type ReactiveTestComponentOptions<T> = {
  initialValue: T
  styleProperty?: string
  tagName?: keyof HTMLElementTagNameMap
  mapValueToStyle?: (value: T) => string
}

type ReactiveTestComponentHandle<T> = {
  component: {
    dispose: () => void
    element: HTMLElement
  }
  signal: SignalHandle<T>
  dom: HTMLElement
  getAppliedStyles: () => Record<string, string>
}

type ModifierApplySpy = {
  modifierName: string
  callCount: number
  lastArgs: any[]
  track: (...args: any[]) => void
  reset: () => void
}

const intersectionCallbacks = new WeakMap<Element, Set<IntersectionObserverCallback>>()
let intersectionObserverPatched = false

/**
 * Create a spy object that tracks modifier `apply` call counts and arguments.
 * Use `track()` inside modifier `apply` methods in tests to distinguish
 * initial application from subsequent reactive re-applications.
 */
export function createModifierApplySpy(modifierName: string): ModifierApplySpy {
  const spy: ModifierApplySpy = {
    modifierName,
    callCount: 0,
    lastArgs: [],
    track: (...args: any[]) => {
      spy.callCount += 1
      spy.lastArgs = args
    },
    reset: () => {
      spy.callCount = 0
      spy.lastArgs = []
    },
  }

  return spy
}

/**
 * Create a minimal reactive test component bound to a real DOM element.
 * The helper wires a signal to one style property via an effect and returns
 * handles for signal updates, DOM inspection, and cleanup.
 */
export function createReactiveTestComponent<T>(
  initialProps: ReactiveTestComponentOptions<T>
): ReactiveTestComponentHandle<T> {
  const [getValue, setValue] = createSignal(initialProps.initialValue)
  const dom = document.createElement(initialProps.tagName ?? 'div')
  const styleProperty = initialProps.styleProperty ?? 'opacity'
  const mapValueToStyle = initialProps.mapValueToStyle ?? ((value: T) => String(value))

  const effect = createEffect(() => {
    dom.style.setProperty(styleProperty, mapValueToStyle(getValue()))
  })

  return {
    component: {
      dispose: () => effect.dispose(),
      element: dom,
    },
    signal: {
      get: getValue,
      set: setValue,
    },
    dom,
    getAppliedStyles: () => {
      const appliedStyles: Record<string, string> = {}
      for (let index = 0; index < dom.style.length; index += 1) {
        const name = dom.style.item(index)
        appliedStyles[name] = dom.style.getPropertyValue(name)
      }
      return appliedStyles
    },
  }
}

/**
 * Assert that a signal update produces exactly `expectedUpdateCount` DOM
 * mutations across the provided component elements.
 */
export async function expectUpdates<T>(
  signal: SignalHandle<T> | SignalSetter<T>,
  newValue: T,
  expectedUpdateCount: number,
  components: Array<HTMLElement | { dom: HTMLElement }>
): Promise<void> {
  let mutationCount = 0
  const observers = components.map(component => {
    const element = component instanceof HTMLElement ? component : component.dom
    const observer = new MutationObserver(records => {
      mutationCount += records.length
    })
    observer.observe(element, {
      attributes: true,
      attributeFilter: ['style', 'class'],
      childList: true,
      subtree: true,
      characterData: true,
    })
    return observer
  })

  const setSignal = typeof signal === 'function' ? signal : signal.set
  setSignal(newValue)

  await Promise.resolve()
  await Promise.resolve()

  observers.forEach(observer => observer.disconnect())
  expect(mutationCount).toBe(expectedUpdateCount)
}

/**
 * Create a registry instance isolated from the global singleton so tests can
 * register modifiers without cross-test pollution.
 */
export function createTestRegistry(): ModifierRegistry {
  return createIsolatedRegistry()
}

/**
 * Read the number of active subscribers currently attached to a signal.
 * Useful for memory leak assertions in mount/unmount lifecycle tests.
 */
export function getSubscriberCount<T>(
  signal: (() => T) | SignalHandle<T>
): number {
  const getter = typeof signal === 'function' ? signal : signal.get
  const signalImpl = getSignalImpl(getter)
  return signalImpl?.observers.size ?? 0
}

function ensureIntersectionObserverMock(): void {
  if (intersectionObserverPatched) return
  if (typeof globalThis.IntersectionObserver !== 'undefined') {
    intersectionObserverPatched = true
    return
  }

  class TestIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = '0px'
    readonly thresholds = [0]
    private readonly callback: IntersectionObserverCallback
    private readonly observed = new Set<Element>()

    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }

    observe(target: Element): void {
      this.observed.add(target)
      const callbacks = intersectionCallbacks.get(target) ?? new Set()
      callbacks.add(this.callback)
      intersectionCallbacks.set(target, callbacks)
    }

    unobserve(target: Element): void {
      this.observed.delete(target)
      const callbacks = intersectionCallbacks.get(target)
      callbacks?.delete(this.callback)
      if (callbacks && callbacks.size === 0) {
        intersectionCallbacks.delete(target)
      }
    }

    disconnect(): void {
      this.observed.forEach(target => this.unobserve(target))
    }

    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }

  ;(globalThis as { IntersectionObserver: typeof IntersectionObserver }).IntersectionObserver =
    TestIntersectionObserver as unknown as typeof IntersectionObserver
  intersectionObserverPatched = true
}

ensureIntersectionObserverMock()

/**
 * Simulate an IntersectionObserver visibility event in jsdom tests.
 * This patches `globalThis.IntersectionObserver` the first time it is called.
 */
export function simulateIntersection(
  element: Element,
  isIntersecting: boolean
): void {
  ensureIntersectionObserverMock()

  const callbacks = intersectionCallbacks.get(element)
  if (!callbacks || callbacks.size === 0) return

  const entry = {
    target: element,
    isIntersecting,
    intersectionRatio: isIntersecting ? 1 : 0,
    boundingClientRect: element.getBoundingClientRect(),
    intersectionRect: element.getBoundingClientRect(),
    rootBounds: null,
    time: Date.now(),
  } as IntersectionObserverEntry

  callbacks.forEach(callback => {
    callback([entry], {} as IntersectionObserver)
  })
}
