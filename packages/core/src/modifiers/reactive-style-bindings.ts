import { createEffect, getOwner, isComputed, onCleanup } from '../reactive'
import { releaseComputedSourcesIfUnobserved } from '../reactive/computed'

type ReactiveAccessor = () => any
type ReactiveStyleUpdater = (value: any) => void
type CleanupFn = () => void
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

const unownedElementCleanupMap = new Map<Element, Set<CleanupFn>>()
const unownedTrackedElements = new Set<Element>()
let unownedCleanupObserverInstalled = false

function ensureUnownedCleanupObserver(): void {
  if (unownedCleanupObserverInstalled) return
  if (typeof document === 'undefined' || !document.documentElement) return

  const observer = new MutationObserver(() => {
    const elements = Array.from(unownedTrackedElements)
    for (const element of elements) {
      if (element.isConnected) continue

      const cleanups = unownedElementCleanupMap.get(element)
      cleanups?.forEach(cleanup => cleanup())
      unownedElementCleanupMap.delete(element)
      unownedTrackedElements.delete(element)
    }
  })

  observer.observe(document.documentElement, { childList: true, subtree: true })
  unownedCleanupObserverInstalled = true
}

function registerUnownedCleanup(
  element: Element,
  cleanup: CleanupFn
): CleanupFn {
  ensureUnownedCleanupObserver()
  const existing = unownedElementCleanupMap.get(element) ?? new Set<CleanupFn>()
  existing.add(cleanup)
  unownedElementCleanupMap.set(element, existing)
  unownedTrackedElements.add(element)

  return () => {
    const current = unownedElementCleanupMap.get(element)
    if (!current) return
    current.delete(cleanup)
    if (current.size === 0) {
      unownedElementCleanupMap.delete(element)
      unownedTrackedElements.delete(element)
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
      updaters.forEach(currentUpdater => currentUpdater(currentValue))
    })
    binding = { effect, updaters }
    perElementBindings.set(accessor, binding)
  }

  binding.updaters.set(updaterId, updater)
  updater(accessor())

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
