import { createEffect, isComputed, onCleanup } from '../reactive'
import { releaseComputedSourcesIfUnobserved } from '../reactive/computed'

type ReactiveAccessor = () => any
type ReactiveStyleUpdater = (value: any) => void
type ReactiveStyleBinding = {
  effect: { dispose: () => void }
  updaters: Set<ReactiveStyleUpdater>
}

const reactiveStyleBindings = new WeakMap<
  Element,
  Map<ReactiveAccessor, ReactiveStyleBinding>
>()

type ReactiveStyleBindingOptions = {
  element: Element
  accessor: ReactiveAccessor
  updater: ReactiveStyleUpdater
}

/**
 * Register an element-scoped reactive style updater with cross-module deduplication.
 * The same element+accessor pair shares one effect regardless of modifier package.
 */
export function bindReactiveStyle({
  element,
  accessor,
  updater,
}: ReactiveStyleBindingOptions): void {
  const perElementBindings = reactiveStyleBindings.get(element) ?? new Map()
  if (!reactiveStyleBindings.has(element)) {
    reactiveStyleBindings.set(element, perElementBindings)
  }

  let binding = perElementBindings.get(accessor)
  if (!binding) {
    const updaters = new Set<ReactiveStyleUpdater>()
    const effect = createEffect(() => {
      const currentValue = accessor()
      updaters.forEach(currentUpdater => currentUpdater(currentValue))
    })
    binding = { effect, updaters }
    perElementBindings.set(accessor, binding)
  }

  binding.updaters.add(updater)
  updater(accessor())

  onCleanup(() => {
    const currentElementBindings = reactiveStyleBindings.get(element)
    const currentBinding = currentElementBindings?.get(accessor)
    if (!currentBinding) return

    currentBinding.updaters.delete(updater)
    if (currentBinding.updaters.size === 0) {
      currentElementBindings?.delete(accessor)
      if (isComputed(accessor)) {
        releaseComputedSourcesIfUnobserved(accessor)
      }
    }

    if (currentElementBindings && currentElementBindings.size === 0) {
      reactiveStyleBindings.delete(element)
    }
  })
}
