import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { createIsolatedRegistry, type ModifierRegistry } from '@tachui/registry'
import { registerViewportModifiers } from '../src/modifiers'
import { simulateIntersection } from '../../core/tools/testing/reactive-test-helpers'

type RegisteredFactory = (...args: unknown[]) => {
  apply: (node: unknown, context: { element?: Element }) => unknown
}

function getModifierFactory(
  registry: ModifierRegistry,
  name: string
): RegisteredFactory {
  const factory = registry.get(name) as RegisteredFactory | undefined
  if (!factory) {
    throw new Error(`Missing modifier factory in test registry: ${name}`)
  }
  return factory
}

function applyRegisteredModifier(
  registry: ModifierRegistry,
  name: string,
  element: HTMLElement,
  ...args: unknown[]
): void {
  const modifier = getModifierFactory(registry, name)(...args)
  modifier.apply({ element }, { element })
}

describe('@tachui/viewport reactive lifecycle', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    registry = createIsolatedRegistry() as ModifierRegistry
    registerViewportModifiers({ registry, force: true })
    document.body.innerHTML = ''
  })

  it('fires onAppear once when entering viewport repeatedly', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onAppear = vi.fn()

    applyRegisteredModifier(registry, 'onAppear', element, onAppear)

    simulateIntersection(element, true)
    simulateIntersection(element, true)
    simulateIntersection(element, true)

    expect(onAppear).toHaveBeenCalledTimes(1)
  })

  it('fires onDisappear once when leaving viewport repeatedly', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onDisappear = vi.fn()

    applyRegisteredModifier(registry, 'onDisappear', element, onDisappear)

    simulateIntersection(element, true)
    simulateIntersection(element, false)
    simulateIntersection(element, false)

    expect(onDisappear).toHaveBeenCalledTimes(1)
  })

  it('propagates signal updates from onAppear callback', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const [appeared, setAppeared] = createSignal(false)

    applyRegisteredModifier(registry, 'onAppear', element, () => {
      setAppeared(true)
    })

    expect(appeared()).toBe(false)
    simulateIntersection(element, true)
    flushSync()
    expect(appeared()).toBe(true)
  })

  it('does not fire onAppear after element is removed before first intersection', () => {
    const element = document.createElement('div')
    document.body.appendChild(element)
    const onAppear = vi.fn()

    applyRegisteredModifier(registry, 'onAppear', element, onAppear)
    element.remove()

    simulateIntersection(element, true)
    simulateIntersection(element, false)

    expect(onAppear).not.toHaveBeenCalled()
  })
})
