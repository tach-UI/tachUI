import { createEffect, getOwner, isComputed, onCleanup } from '../reactive'
import { releaseComputedSourcesIfUnobserved } from '../reactive/computed'

type ReactiveAccessor = () => any
type ReactiveStyleUpdater = (value: any) => void
type CleanupFn = () => void
export type ReactiveStyleUpdaterErrorContext = {
  updaterId: string
  value: any
}
export type ReactiveStyleUpdaterErrorHandler = (
  error: unknown,
  context: ReactiveStyleUpdaterErrorContext
) => void
type ReactiveStyleBinding = {
  effect: { dispose: () => void }
  updaters: Map<string, ReactiveStyleUpdater>
}

const reactiveStyleBindings = new WeakMap<
  Element,
  Map<ReactiveAccessor, ReactiveStyleBinding>
>()

type ReactiveStyleBindingOptions = {
  element: Element
  accessor: ReactiveAccessor
  updater: ReactiveStyleUpdater
  updaterId: string
}

let reactiveStyleUpdaterErrorHandler: ReactiveStyleUpdaterErrorHandler | null =
  null

export function setReactiveStyleUpdaterErrorHandler(
  handler: ReactiveStyleUpdaterErrorHandler | null
): CleanupFn {
  if (handler === null) {
    reactiveStyleUpdaterErrorHandler = null
    return () => {}
  }

  const previousHandler = reactiveStyleUpdaterErrorHandler
  reactiveStyleUpdaterErrorHandler = (error, context) => {
    previousHandler?.(error, context)
    handler(error, context)
  }

  return () => {
    reactiveStyleUpdaterErrorHandler = previousHandler
  }
}

function runUpdaterSafely(
  updater: ReactiveStyleUpdater,
  value: any,
  updaterId: string
): void {
  try {
    updater(value)
  } catch (error) {
    if (reactiveStyleUpdaterErrorHandler) {
      reactiveStyleUpdaterErrorHandler(error, { updaterId, value })
      return
    }

    console.error(`Reactive style updater failed (${updaterId}):`, error)
  }
}

const UNOWNED_NEVER_CONNECTED_GRACE_MS = 200

const unownedElementCleanupMap = new WeakMap<Element, Set<CleanupFn>>()
const unownedElementStateMap = new WeakMap<
  Element,
  { trackedAt: number; wasConnected: boolean }
>()
const unownedTrackedElements = new Set<WeakRef<Element>>()
let unownedCleanupObserverInstalled = false
let unownedCleanupSweepScheduled = false

function runCleanupForElement(element: Element): void {
  const cleanups = unownedElementCleanupMap.get(element)
  cleanups?.forEach(cleanup => cleanup())
  unownedElementCleanupMap.delete(element)
  unownedElementStateMap.delete(element)
}

function sweepUnownedTrackedElements(): void {
  const now = Date.now()
  for (const ref of Array.from(unownedTrackedElements)) {
    const element = ref.deref()
    if (!element) {
      unownedTrackedElements.delete(ref)
      continue
    }

    const state = unownedElementStateMap.get(element)
    const cleanups = unownedElementCleanupMap.get(element)
    if (!state || !cleanups || cleanups.size === 0) {
      unownedTrackedElements.delete(ref)
      continue
    }

    if (element.isConnected) {
      state.wasConnected = true
      continue
    }

    if (state.wasConnected || now - state.trackedAt >= UNOWNED_NEVER_CONNECTED_GRACE_MS) {
      runCleanupForElement(element)
      unownedTrackedElements.delete(ref)
    }
  }
}

function ensureUnownedCleanupSweep(): void {
  if (unownedCleanupSweepScheduled) return
  if (typeof setTimeout !== 'function') return

  unownedCleanupSweepScheduled = true
  const tick = () => {
    sweepUnownedTrackedElements()
    if (unownedTrackedElements.size === 0) {
      unownedCleanupSweepScheduled = false
      return
    }
    setTimeout(tick, UNOWNED_NEVER_CONNECTED_GRACE_MS)
  }
  setTimeout(tick, UNOWNED_NEVER_CONNECTED_GRACE_MS)
}

function ensureUnownedCleanupObserver(): void {
  if (unownedCleanupObserverInstalled) return
  if (
    typeof document === 'undefined' ||
    !document.documentElement ||
    typeof MutationObserver === 'undefined'
  ) {
    return
  }

  const observer = new MutationObserver(() => {
    sweepUnownedTrackedElements()
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
  unownedCleanupObserverInstalled = true
}

function registerUnownedCleanup(
  element: Element,
  cleanup: CleanupFn
): CleanupFn {
  ensureUnownedCleanupObserver()
  ensureUnownedCleanupSweep()

  const existing = unownedElementCleanupMap.get(element) ?? new Set<CleanupFn>()
  const hadExistingCleanups = existing.size > 0
  existing.add(cleanup)
  unownedElementCleanupMap.set(element, existing)

  if (!hadExistingCleanups) {
    unownedElementStateMap.set(element, {
      trackedAt: Date.now(),
      wasConnected: element.isConnected,
    })
    unownedTrackedElements.add(new WeakRef(element))
  }

  return () => {
    const current = unownedElementCleanupMap.get(element)
    if (!current) return
    current.delete(cleanup)
    if (current.size === 0) {
      unownedElementCleanupMap.delete(element)
      unownedElementStateMap.delete(element)
    }
  }
}

/**
 * Register an element-scoped reactive style updater with cross-module deduplication.
 * The same element+accessor pair shares one effect regardless of modifier package.
 */
export function bindReactiveStyle({
  element,
  accessor,
  updater,
  updaterId,
}: ReactiveStyleBindingOptions): void {
  const perElementBindings = reactiveStyleBindings.get(element) ?? new Map()
  if (!reactiveStyleBindings.has(element)) {
    reactiveStyleBindings.set(element, perElementBindings)
  }

  let binding = perElementBindings.get(accessor)
  if (!binding) {
    const updaters = new Map<string, ReactiveStyleUpdater>()
    const effect = createEffect(() => {
      const currentValue = accessor()
      updaters.forEach((currentUpdater, currentUpdaterId) =>
        runUpdaterSafely(currentUpdater, currentValue, currentUpdaterId)
      )
    })
    binding = { effect, updaters }
    perElementBindings.set(accessor, binding)
  }

  binding.updaters.set(updaterId, updater)
  runUpdaterSafely(updater, accessor(), updaterId)

  let unregisterUnownedCleanup: CleanupFn | null = null
  const removeUpdater = () => {
    if (unregisterUnownedCleanup) {
      unregisterUnownedCleanup()
      unregisterUnownedCleanup = null
    }

    const currentElementBindings = reactiveStyleBindings.get(element)
    const currentBinding = currentElementBindings?.get(accessor)
    if (!currentBinding) return

    currentBinding.updaters.delete(updaterId)
    if (currentBinding.updaters.size === 0) {
      currentBinding.effect.dispose()
      currentElementBindings?.delete(accessor)
      if (isComputed(accessor)) {
        releaseComputedSourcesIfUnobserved(accessor)
      }
    }

    if (currentElementBindings && currentElementBindings.size === 0) {
      reactiveStyleBindings.delete(element)
    }
  }

  if (getOwner()) {
    onCleanup(removeUpdater)
  } else {
    unregisterUnownedCleanup = registerUnownedCleanup(element, removeUpdater)
  }
}
