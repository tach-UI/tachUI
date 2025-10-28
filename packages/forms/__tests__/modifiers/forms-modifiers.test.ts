import { describe, expect, it } from 'vitest'
import {
  createIsolatedRegistry,
  type ModifierRegistry,
} from '@tachui/registry'
import {
  registerFormsModifiers,
  placeholder,
  required,
  validation,
} from '../../src/modifiers'

const applyModifier = (
  modifierFactory: (...args: any[]) => any,
  element: HTMLElement,
  ...args: any[]
) => {
  const modifier = modifierFactory(...args)
  modifier.apply(element, {
    componentId: 'test',
    phase: 'creation',
    element,
  })
}

describe('@tachui/forms modifiers', () => {
  it('registers metadata and plugin info', () => {
    const registry = createIsolatedRegistry() as ModifierRegistry
    registerFormsModifiers({ registry })

    const placeholderMeta = registry.getMetadata('placeholder')
    const requiredMeta = registry.getMetadata('required')
    const validationMeta = registry.getMetadata('validation')

    expect(placeholderMeta?.plugin).toBe('@tachui/forms')
    expect(requiredMeta?.priority).toBeGreaterThan(0)
    expect(validationMeta?.category).toBe('interaction')
  })

  it('applies placeholder text to inputs', () => {
    const input = document.createElement('input')
    applyModifier(placeholder, input, 'Enter name')

    expect(input.placeholder).toBe('Enter name')
    expect(input.getAttribute('data-placeholder')).toBe('Enter name')
  })

  it('marks elements as required', () => {
    const input = document.createElement('input')
    applyModifier(required, input)

    expect(input.required).toBe(true)
    expect(input.getAttribute('aria-required')).toBe('true')
    expect(input.classList.contains('tachui-required')).toBe(true)
  })

  it('validates values and toggles validity state', () => {
    const input = document.createElement('input')
    applyModifier(validation, input, 'required')

    input.value = ''
    input.dispatchEvent(new Event('blur'))
    expect(input.validationMessage).toBe('This field is required')
    expect(input.getAttribute('aria-invalid')).toBe('true')

    input.value = 'ready'
    input.dispatchEvent(new Event('input'))
    expect(input.validationMessage).toBe('')
    expect(input.hasAttribute('aria-invalid')).toBe(false)
  })
})
