import type { ComponentInstance } from '../runtime/types'
import { isProxyEnabled } from '../config'
import { globalModifierRegistry, createModifiableComponent } from './registry'

let proxyCache = new WeakMap<ComponentInstance, any>()
let modifierFnCache = new WeakMap<
  ComponentInstance,
  Map<PropertyKey, (...args: any[]) => any>
>()
let methodBindCache = new WeakMap<
  ComponentInstance,
  Map<PropertyKey, Function>
>()

function ensureModifiable(component: ComponentInstance) {
  if (!(component as any)._modifiableComponent) {
    const modifiable = createModifiableComponent(component)
    if (!Object.prototype.hasOwnProperty.call(component, 'modifier')) {
      Object.defineProperty(component, 'modifier', {
        configurable: true,
        enumerable: false,
        get() {
          return modifiable.modifierBuilder
        },
      })
    }
    ;(component as any)._modifiableComponent = modifiable
  }

  return (component as any)._modifiableComponent
}

export function resetProxyCache() {
  proxyCache = new WeakMap()
  modifierFnCache = new WeakMap()
  methodBindCache = new WeakMap()
}

export function createComponentProxy<T extends ComponentInstance>(
  component: T,
): T {
  if (!isProxyEnabled()) {
    return component
  }

  const existing = proxyCache.get(component)
  if (existing) {
    return existing
  }

  const modifierCache = new Map<PropertyKey, (...args: any[]) => any>()
  modifierFnCache.set(component, modifierCache)

  const methodCache = new Map<PropertyKey, Function>()
  methodBindCache.set(component, methodCache)

  const handler: ProxyHandler<ComponentInstance> = {
    get(target, prop, receiver) {
      if (prop === Symbol.toStringTag) {
        return Reflect.get(target, prop, receiver)
      }

      if (Reflect.has(target, prop)) {
        const value = Reflect.get(target, prop, target)
        if (typeof value === 'function') {
          if (prop === 'clone') {
            return (...args: any[]) => {
              const result = value.apply(target, args)
              return result && typeof result === 'object'
                ? createComponentProxy(result)
                : result
            }
          }

          if (!methodCache.has(prop)) {
            methodCache.set(prop, value.bind(target))
          }
          return methodCache.get(prop)
        }
        return value
      }

      if (
        (typeof prop === 'string' || typeof prop === 'symbol') &&
        globalModifierRegistry.has(prop as any)
      ) {
        if (!modifierCache.has(prop)) {
          const modifiable = ensureModifiable(target)
          const modifierApi =
            modifiable.modifierBuilder || (modifiable as any).modifier
          const applyModifier = (...args: any[]) => {
            const modifierFn = modifierApi?.[prop]
            if (typeof modifierFn !== 'function') {
              throw new Error(`Modifier '${String(prop)}' is not callable`)
            }
            modifierFn.apply(modifierApi, args)
            return proxy
          }
          modifierCache.set(prop, applyModifier)
        }
        return modifierCache.get(prop)
      }

      return undefined
    },
    has(target, prop) {
      return (
        Reflect.has(target, prop) ||
        globalModifierRegistry.has(prop as any)
      )
    },
  }

  const proxy = new Proxy(component, handler)
  proxyCache.set(component, proxy)
  return proxy as T
}
