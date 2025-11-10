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
  if (
    Object.prototype.hasOwnProperty.call(component, 'modifiers') &&
    Object.prototype.hasOwnProperty.call(component, 'modifierBuilder')
  ) {
    return component as any
  }

  if (!(component as any)._modifiableComponent) {
    const modifiable = createModifiableComponent(component)
    if (!Object.prototype.hasOwnProperty.call(component, 'modifier')) {
      Object.defineProperty(component, 'modifier', {
        configurable: true,
        enumerable: false,
        get() {
          return modifiable.modifierBuilder
        },
        set(value: any) {
          Object.defineProperty(component, 'modifier', {
            configurable: true,
            enumerable: false,
            writable: true,
            value,
          })
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

      if (prop === 'render') {
        if (methodCache.has(prop)) {
          return methodCache.get(prop)
        }

        const modifiable = ensureModifiable(target)
        if (typeof modifiable.render === 'function') {
          const boundRender = modifiable.render.bind(modifiable)
          methodCache.set(prop, boundRender)
          return boundRender
        }
        return Reflect.get(target, prop, receiver)
      }

      if (prop === 'build') {
        const modifiable = ensureModifiable(target)
        const modifierApi =
          modifiable.modifierBuilder || (modifiable as any).modifier
        if (modifierApi && typeof modifierApi.build === 'function') {
          const buildFn = modifierApi.build.bind(modifierApi)
          return (...args: any[]) => {
            const builtComponent = buildFn(...args)
            if (
              builtComponent &&
              typeof builtComponent === 'object' &&
              !Array.isArray(builtComponent)
            ) {
              return createComponentProxy(
                builtComponent as ComponentInstance,
              )
            }
            return builtComponent
          }
        }
        return undefined
      }

      if (
        prop === 'modifiers' ||
        prop === 'modifier' ||
        prop === 'modifierBuilder'
      ) {
        if (prop === 'modifier') {
          const descriptor = Object.getOwnPropertyDescriptor(
            target,
            'modifier',
          )
          if (descriptor && 'value' in descriptor) {
            return descriptor.value
          }
        }

        const modifiable = ensureModifiable(target)
        if (prop === 'modifiers') {
          return modifiable.modifiers
        }
        return modifiable.modifierBuilder
      }

      if (typeof prop === 'string') {
        if (Reflect.has(target, prop)) {
          const directValue = Reflect.get(target, prop, target)
          if (typeof directValue !== 'function') {
            return directValue
          }
        }

        const modifiable = ensureModifiable(target)
        const modifierApi =
          modifiable.modifierBuilder || (modifiable as any).modifier

        if (modifierApi) {
          const builderMember = (modifierApi as any)[prop]

          if (typeof builderMember === 'function') {
            if (!modifierCache.has(prop)) {
              const applyBuilderModifier = (...args: any[]) => {
                const currentModifiable = ensureModifiable(target)
                const currentApi =
                  currentModifiable.modifierBuilder ||
                  (currentModifiable as any).modifier
                const modifierFn = currentApi?.[prop]
                if (typeof modifierFn !== 'function') {
                  throw new Error(
                    `Modifier '${String(prop)}' is not callable`,
                  )
                }
                const result = modifierFn.apply(currentApi, args)
                return result && result !== currentApi ? result : proxy
              }
              modifierCache.set(prop, applyBuilderModifier)
            }
            return modifierCache.get(prop)
          }

          if (builderMember !== undefined) {
            return builderMember
          }
        }

        if (globalModifierRegistry.has(prop)) {
          if (!modifierCache.has(prop)) {
            const applyModifier = (...args: any[]) => {
              const modifiableInstance = ensureModifiable(target)
              const modifierApi =
                modifiableInstance.modifierBuilder ||
                (modifiableInstance as any).modifier
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

      return undefined
    },
    has(target, prop) {
      if (
        prop === 'modifiers' ||
        prop === 'modifier' ||
        prop === 'modifierBuilder'
      ) {
        return true
      }

      if (typeof prop === 'string') {
        const modifiable =
          (target as any)._modifiableComponent ||
          ensureModifiable(target)
        const modifierApi =
          modifiable?.modifierBuilder || (modifiable as any)?.modifier
        if (
          modifierApi &&
          typeof (modifierApi as any)[prop] === 'function'
        ) {
          return true
        }
      }

      return (
        Reflect.has(target, prop) ||
        globalModifierRegistry.has(prop as any)
      )
    },
    set(target, prop, value, receiver) {
      if (prop === 'modifier') {
        Object.defineProperty(target, 'modifier', {
          configurable: true,
          enumerable: false,
          writable: true,
          value,
        })
        modifierCache.clear()
        return true
      }

      if (prop === 'modifiers' && Array.isArray(value)) {
        const modifiable = ensureModifiable(target)
        modifiable.modifiers = [...value]
        return true
      }

      return Reflect.set(target, prop, value, receiver)
    },
  }

  const proxy = new Proxy(component, handler)
  proxyCache.set(component, proxy)
  return proxy as T
}
