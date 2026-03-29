import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createRoot, createSignal, flushSync } from '@tachui/core/reactive'
import { createIsolatedRegistry, type ModifierRegistry } from '@tachui/registry'
import { registerBasicModifiers } from '@tachui/modifiers'
import { registerFormsModifiers } from '../../src/modifiers'
import type { ValidationRule } from '../../src/types'

type RegisteredFactory = (...args: unknown[]) => {
  apply: (node: unknown, context: { element?: Element }) => unknown
}
const disposers = new Set<() => void>()

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
  createRoot(dispose => {
    disposers.add(dispose)
    const modifier = getModifierFactory(registry, name)(...args)
    modifier.apply(
      { element },
      {
        componentId: `forms-reactive-${Math.random().toString(36).slice(2)}`,
        element,
        phase: 'creation',
      }
    )
  })
}

describe('@tachui/forms reactive modifiers', () => {
  let registry: ModifierRegistry

  beforeEach(() => {
    registry = createIsolatedRegistry() as ModifierRegistry
    registerBasicModifiers({ registry })
    registerFormsModifiers({ registry, force: true })
  })

  afterEach(() => {
    disposers.forEach(dispose => dispose())
    disposers.clear()
  })

  it('re-runs validation when reactive rules signal changes', () => {
    const input = document.createElement('input')
    const [rules, setRules] = createSignal<ValidationRule[]>(['required'])

    applyRegisteredModifier(registry, 'validation', input, rules)

    input.value = ''
    input.dispatchEvent(new Event('input'))
    expect(input.validationMessage).toBe('This field is required')

    setRules(['email'])
    flushSync()

    input.value = 'not-an-email'
    input.dispatchEvent(new Event('input'))
    expect(input.validationMessage).toBe('Please enter a valid email address')

    input.value = 'test@example.com'
    input.dispatchEvent(new Event('input'))
    expect(input.validationMessage).toBe('')
  })

  it('updates placeholder text when signal changes', () => {
    const input = document.createElement('input')
    const [placeholderText, setPlaceholderText] = createSignal('Email')

    applyRegisteredModifier(registry, 'placeholder', input, placeholderText)
    expect(input.placeholder).toBe('Email')
    expect(input.getAttribute('data-placeholder')).toBe('Email')

    setPlaceholderText('Work Email')
    flushSync()
    expect(input.placeholder).toBe('Work Email')
    expect(input.getAttribute('data-placeholder')).toBe('Work Email')
  })

  it('toggles required state from reactive enabled signal', () => {
    const input = document.createElement('input')
    const [isRequired, setIsRequired] = createSignal(true)

    applyRegisteredModifier(registry, 'required', input, {
      enabled: isRequired,
      message: 'Required field',
    })
    expect(input.required).toBe(true)
    expect(input.getAttribute('aria-required')).toBe('true')

    setIsRequired(false)
    flushSync()
    expect(input.required).toBe(false)
    expect(input.hasAttribute('aria-required')).toBe(false)
  })

  it('updates form field disabled state via signal', () => {
    const input = document.createElement('input')
    const [isDisabled, setIsDisabled] = createSignal(false)

    applyRegisteredModifier(registry, 'disabled', input, isDisabled)
    expect(input.disabled).toBe(false)

    setIsDisabled(true)
    flushSync()
    expect(input.disabled).toBe(true)
  })
})
