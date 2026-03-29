import { beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '@tachui/core'
import { createIsolatedRegistry, type ModifierRegistry } from '@tachui/registry'
import { registerGridModifiers } from '../../src/modifiers/grid'

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

describe('@tachui/grid reactive modifiers', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    registry = createIsolatedRegistry() as ModifierRegistry
    registerGridModifiers({ registry, force: true })
  })

  it('updates gridColumn when span signal changes', () => {
    const element = document.createElement('div')
    const [span, setSpan] = createSignal(2)

    applyRegisteredModifier(registry, 'gridColumnSpan', element, span)
    expect(element.style.gridColumn).toBe('span 2')

    setSpan(4)
    flushSync()
    expect(element.style.gridColumn).toBe('span 4')
  })

  it('updates gridRow when row span signal changes', () => {
    const element = document.createElement('div')
    const [span, setSpan] = createSignal(1)

    applyRegisteredModifier(registry, 'gridRowSpan', element, span)
    expect(element.style.gridRow).toBe('span 1')

    setSpan(3)
    flushSync()
    expect(element.style.gridRow).toBe('span 3')
  })

  it('recalculates reactive child layout independently', () => {
    const parent = document.createElement('div')
    parent.style.display = 'grid'
    const firstChild = document.createElement('div')
    const secondChild = document.createElement('div')
    parent.append(firstChild, secondChild)

    const [firstSpan, setFirstSpan] = createSignal(1)
    const [secondSpan, setSecondSpan] = createSignal(2)

    applyRegisteredModifier(registry, 'gridColumnSpan', firstChild, firstSpan)
    applyRegisteredModifier(registry, 'gridColumnSpan', secondChild, secondSpan)

    expect(firstChild.style.gridColumn).toBe('span 1')
    expect(secondChild.style.gridColumn).toBe('span 2')

    setFirstSpan(3)
    flushSync()
    expect(firstChild.style.gridColumn).toBe('span 3')
    expect(secondChild.style.gridColumn).toBe('span 2')

    setSecondSpan(4)
    flushSync()
    expect(firstChild.style.gridColumn).toBe('span 3')
    expect(secondChild.style.gridColumn).toBe('span 4')
  })
})
