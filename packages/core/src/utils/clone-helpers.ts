import type { ComponentInstance, CloneOptions } from '../runtime/types'
import type { Signal } from '../reactive/types'

function isSignal(value: unknown): value is Signal<any> {
  return typeof value === 'function' && value !== null && typeof (value as any).set === 'function'
}

function isAsset(value: unknown): boolean {
  return (
    value !== null &&
    typeof value === 'object' &&
    'resolve' in (value as Record<string, unknown>) &&
    typeof (value as Record<string, unknown>).resolve === 'function'
  )
}

function isComponent(value: unknown): value is ComponentInstance {
  return (
    value !== null &&
    typeof value === 'object' &&
    (value as ComponentInstance).type === 'component' &&
    typeof (value as ComponentInstance).render === 'function'
  )
}

export function clonePropsPreservingReactivity<T extends Record<string, unknown>>(
  props: T,
  options: CloneOptions = {},
): T {
  if (props == null) {
    return props
  }

  const cloned: Record<string, unknown> = {}

  Object.entries(props).forEach(([key, value]) => {
    if (isSignal(value) || isAsset(value)) {
      cloned[key] = value
      return
    }

    if (Array.isArray(value)) {
      if (options.deep) {
        cloned[key] = value.map(item => {
          if (isComponent(item) && typeof (item as any).clone === 'function') {
            return (item as any).clone(options)
          }
          return item
        })
      } else {
        cloned[key] = [...value]
      }
      return
    }

    if (value && typeof value === 'object') {
      if (value instanceof Element || value instanceof Node) {
        cloned[key] = undefined
        return
      }
      cloned[key] = { ...(value as Record<string, unknown>) }
      return
    }

    cloned[key] = value
  })

  return cloned as T
}

export function createResetLifecycleState() {
  return {
    mounted: false,
    cleanup: [] as (() => void)[],
    domElements: undefined as Map<string, Element> | undefined,
    primaryElement: undefined as Element | undefined,
    domReady: false,
  }
}

export function resetLifecycleState(target: ComponentInstance) {
  const lifecycle = createResetLifecycleState()
  target.mounted = lifecycle.mounted
  target.cleanup = lifecycle.cleanup
  target.domElements = lifecycle.domElements
  target.primaryElement = lifecycle.primaryElement
  target.domReady = lifecycle.domReady
}
