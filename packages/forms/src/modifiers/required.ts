import type { Modifier, ModifierContext } from '@tachui/core/modifiers/types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'

const requiredPriority = 72

interface RequiredModifierOptions {
  message?: string
  enabled?: boolean
}

function normalizeOptions(
  value?: boolean | string | RequiredModifierOptions,
): RequiredModifierOptions {
  if (typeof value === 'boolean') {
    return { enabled: value }
  }
  if (typeof value === 'string') {
    return { message: value, enabled: true }
  }
  const normalized: RequiredModifierOptions = { enabled: true }

  if (value) {
    Object.assign(normalized, value)
  }

  return normalized
}

function applyRequired(
  element: Element,
  { enabled, message }: RequiredModifierOptions,
): void {
  if (!(element instanceof HTMLElement)) return

  if (enabled !== false) {
    element.setAttribute('aria-required', 'true')
    element.classList.add('tachui-required')
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      element.required = true
    } else {
      element.setAttribute('data-required', 'true')
    }
    if (message) {
      element.setAttribute('data-required-message', message)
    }
  } else {
    element.removeAttribute('aria-required')
    element.classList.remove('tachui-required')
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement) {
      element.required = false
    } else {
      element.removeAttribute('data-required')
    }
    element.removeAttribute('data-required-message')
  }
}

function createRequiredModifier(
  options?: boolean | string | RequiredModifierOptions,
): Modifier {
  const normalized = normalizeOptions(options)
  return {
    type: 'forms:required',
    priority: requiredPriority,
    properties: normalized,
    apply(node: any, context: ModifierContext) {
      const element = (context.element ?? node) as Element | undefined
      if (!element) return node

      applyRequired(element, normalized)
      return node
    },
  }
}

const REQUIRED_METADATA = {
  category: 'accessibility' as const,
  priority: requiredPriority,
  signature: '(options?: boolean | string | { message?: string }) => Modifier',
  description:
    'Marks form inputs as required, wiring ARIA attributes and optional custom messaging.',
}

export function required(
  options?: boolean | string | RequiredModifierOptions,
): Modifier {
  return createRequiredModifier(options)
}

export function registerRequiredModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  const factory = (options?: boolean | string | RequiredModifierOptions) =>
    createRequiredModifier(options)

  registerModifierWithMetadata(
    'required',
    factory,
    REQUIRED_METADATA,
    registry,
    plugin,
  )
}
