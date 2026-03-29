import type { Modifier, ModifierContext } from '@tachui/core/modifiers/types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import { createEffect, isComputed, isSignal, type Signal } from '@tachui/core'
import { validateValue } from '../validation'
import type { ValidationResult, ValidationRule } from '../types'

const validationPriority = 74

type ValidationArgs =
  | ValidationRule[]
  | ValidationRule
  | Signal<ValidationRule[]>
  | Signal<ValidationRule>
  | Signal<ValidationRule[] | ValidationRule>

interface ValidationProperties {
  rules: ValidationRule[]
}

const validationHandlers = new WeakMap<Element, (event?: Event) => void>()
const validationDisposers = new WeakMap<Element, () => void>()

function isReactiveRuleInput(
  value: ValidationArgs
): value is Signal<ValidationRule[] | ValidationRule> {
  return isSignal(value) || isComputed(value)
}

function normalizeRules(input: ValidationArgs[]): ValidationRule[] {
  const flattened: ValidationRule[] = []
  input.forEach(entry => {
    const resolvedEntry = isReactiveRuleInput(entry) ? entry() : entry
    if (Array.isArray(resolvedEntry)) {
      flattened.push(...resolvedEntry)
    } else {
      flattened.push(resolvedEntry)
    }
  })
  return flattened
}

function hasReactiveRuleInput(input: ValidationArgs[]): boolean {
  return input.some(entry => isReactiveRuleInput(entry))
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
  rulesInput: ValidationArgs[],
): Modifier {
  return {
    type: 'forms:validation',
    priority: validationPriority,
    properties: {
      get rules() {
        const resolved = normalizeRules(rulesInput)
        return resolved.length ? resolved : (['required'] as ValidationRule[])
      },
    } as ValidationProperties,
    apply(node: any, context: ModifierContext) {
      const element = (context.element ?? node) as Element | undefined
      if (!element) return node

      const buildRules = (): ValidationRule[] => {
        const resolved = normalizeRules(rulesInput)
        return resolved.length ? resolved : (['required'] as ValidationRule[])
      }

      const handler = () => {
        const currentRules = buildRules()
        const run = createValidationHandler(element, currentRules)
        run()
      }

      const existing = validationHandlers.get(element)
      if (existing) {
        element.removeEventListener('blur', existing)
        element.removeEventListener('input', existing)
      }
      const existingDispose = validationDisposers.get(element)
      if (existingDispose) {
        existingDispose()
        validationDisposers.delete(element)
      }

      element.addEventListener('blur', handler)
      element.addEventListener('input', handler)
      validationHandlers.set(element, handler)

      handler()

      if (hasReactiveRuleInput(rulesInput)) {
        const effect = createEffect(handler)
        validationDisposers.set(element, () => effect.dispose())
      }

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
  return createValidationModifier(rules)
}

export function registerValidationModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  const factory = (...rules: ValidationArgs[]) =>
    createValidationModifier(rules)

  registerModifierWithMetadata(
    'validation',
    factory,
    VALIDATION_METADATA,
    registry,
    plugin,
  )
}
