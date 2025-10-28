import { isSignal } from '@tachui/core'
import type { Signal } from '@tachui/core'
import type {
  Modifier,
  ModifierContext,
} from '@tachui/core/modifiers/types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'

const placeholderPriority = 70

type PlaceholderValue = string | Signal<string>

function resolvePlaceholder(value: PlaceholderValue): string {
  if (typeof value === 'function' && isSignal(value)) {
    return value()
  }
  if (typeof value === 'function') {
    return (value as () => string)()
  }
  return value ?? ''
}

const placeholderHandlers = new WeakMap<Element, () => void>()

function applyPlaceholder(
  element: Element,
  value: PlaceholderValue,
): void {
  const resolved = resolvePlaceholder(value)
  if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
    element.placeholder = resolved
  } else if (element instanceof HTMLElement) {
    element.setAttribute('placeholder', resolved)
  }
  if (resolved) {
    element.setAttribute('data-placeholder', resolved)
  } else {
    element.removeAttribute('data-placeholder')
  }
}

function createPlaceholderModifier(value: PlaceholderValue): Modifier {
  return {
    type: 'forms:placeholder',
    priority: placeholderPriority,
    properties: { value },
    apply(node: any, context: ModifierContext) {
      const element = (context.element ?? node) as Element | undefined
      if (!element) {
        return node
      }

      const update = () => applyPlaceholder(element, value)
      update()

      const previous = placeholderHandlers.get(element)
      if (previous) {
        element.removeEventListener('input', previous)
      }

      const handler = () => applyPlaceholder(element, value)
      element.addEventListener('input', handler)
      placeholderHandlers.set(element, handler)

      return node
    },
  }
}

const PLACEHOLDER_METADATA = {
  category: 'accessibility' as const,
  priority: placeholderPriority,
  signature: '(text: string) => Modifier',
  description:
    'Sets placeholder text on form inputs and keeps a data attribute in sync.',
}

export function placeholder(value: PlaceholderValue): Modifier {
  return createPlaceholderModifier(value)
}

export function registerPlaceholderModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  const factory = (value: PlaceholderValue) => createPlaceholderModifier(value)
  registerModifierWithMetadata(
    'placeholder',
    factory,
    PLACEHOLDER_METADATA,
    registry,
    plugin,
  )
}
