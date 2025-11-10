import type { Modifier, ModifierContext } from '@tachui/core/modifiers/types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import { validateValue } from '../validation'
import type { ValidationResult, ValidationRule } from '../types'

const validationPriority = 74

type ValidationArgs =
  | ValidationRule[]
  | ValidationRule

interface ValidationProperties {
  rules: ValidationRule[]
}

const validationHandlers = new WeakMap<Element, (event?: Event) => void>()

function normalizeRules(input: ValidationArgs[]): ValidationRule[] {
  const flattened: ValidationRule[] = []
  input.forEach(entry => {
    if (Array.isArray(entry)) {
      flattened.push(...entry)
    } else {
      flattened.push(entry)
    }
  })
  return flattened
}

function applyValidationResult(
  element: Element,
  result: ValidationResult,
): void {
  if (!(element instanceof HTMLElement)) return

  if (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element instanceof HTMLSelectElement
  ) {
    element.setCustomValidity(result.valid ? '' : result.message ?? 'Invalid value')
  }

  if (result.valid) {
    element.removeAttribute('aria-invalid')
    element.classList.remove('tachui-invalid')
    element.removeAttribute('data-validation-message')
  } else {
    element.setAttribute('aria-invalid', 'true')
    element.classList.add('tachui-invalid')
    if (result.message) {
      element.setAttribute('data-validation-message', result.message)
    }
  }
}

function createValidationHandler(
  element: Element,
  rules: ValidationRule[],
): (event?: Event) => void {
  return () => {
    const currentValue =
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
        ? element.value
        : element.textContent ?? ''

    const result = validateValue(currentValue, rules)
    applyValidationResult(element, result)
  }
}

function createValidationModifier(
  rules: ValidationRule[],
): Modifier {
  const normalizedRules = rules.length
    ? rules
    : (['required'] as ValidationRule[])

  return {
    type: 'forms:validation',
    priority: validationPriority,
    properties: { rules: normalizedRules } satisfies ValidationProperties,
    apply(node: any, context: ModifierContext) {
      const element = (context.element ?? node) as Element | undefined
      if (!element) return node

      const handler = createValidationHandler(element, normalizedRules)

      const existing = validationHandlers.get(element)
      if (existing) {
        element.removeEventListener('blur', existing)
        element.removeEventListener('input', existing)
      }

      element.addEventListener('blur', handler)
      element.addEventListener('input', handler)
      validationHandlers.set(element, handler)

      handler()

      return node
    },
  }
}

const VALIDATION_METADATA = {
  category: 'interaction' as const,
  priority: validationPriority,
  signature: '(...rules: ValidationRule[]) => Modifier',
  description:
    'Attaches validation rules to form inputs, wiring blur/input handlers and ARIA state.',
}

export function validation(
  ...rules: ValidationArgs[]
): Modifier {
  const normalized = normalizeRules(rules)
  return createValidationModifier(normalized)
}

export function registerValidationModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  const factory = (...rules: ValidationArgs[]) =>
    createValidationModifier(normalizeRules(rules))

  registerModifierWithMetadata(
    'validation',
    factory,
    VALIDATION_METADATA,
    registry,
    plugin,
  )
}
