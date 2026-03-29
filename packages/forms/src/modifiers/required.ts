import type { Modifier, ModifierContext } from '@tachui/core/modifiers/types'
import type { ModifierRegistry, PluginInfo } from '@tachui/registry'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import { createEffect, isComputed, isSignal, type Signal } from '@tachui/core'

const requiredPriority = 72

interface RequiredModifierOptions {
  message?: string | Signal<string>
  enabled?: boolean | Signal<boolean>
}

type RequiredInput = boolean | string | RequiredModifierOptions
interface ResolvedRequiredOptions {
  message?: string
  enabled?: boolean
}
const requiredDisposers = new WeakMap<Element, () => void>()

function resolveReactive<T>(value: T | Signal<T>): T {
  if (isSignal(value) || isComputed(value)) {
    return (value as Signal<T>)()
  }
  return value as T
}

function normalizeOptions(
  value?: RequiredInput,
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

function resolveOptions(
  value?: RequiredInput,
): ResolvedRequiredOptions {
  const normalized = normalizeOptions(value)
  return {
    enabled:
      normalized.enabled === undefined
        ? undefined
        : resolveReactive(normalized.enabled),
    message:
      normalized.message === undefined
        ? undefined
        : resolveReactive(normalized.message),
  }
}

function hasReactiveOptions(value?: RequiredInput): boolean {
  if (isSignal(value) || isComputed(value)) return true
  if (!value || typeof value !== 'object') return false
  return (
    isSignal(value.enabled) ||
    isComputed(value.enabled) ||
    isSignal(value.message) ||
    isComputed(value.message)
  )
}

function applyRequired(
  element: Element,
  { enabled, message }: ResolvedRequiredOptions,
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
  options?: RequiredInput,
): Modifier {
  return {
    type: 'forms:required',
    priority: requiredPriority,
    properties: normalizeOptions(options),
    apply(node: any, context: ModifierContext) {
      const element = (context.element ?? node) as Element | undefined
      if (!element) return node

      const applyCurrent = () => applyRequired(element, resolveOptions(options))

      const previousDispose = requiredDisposers.get(element)
      if (previousDispose) {
        previousDispose()
        requiredDisposers.delete(element)
      }

      applyCurrent()

      if (hasReactiveOptions(options)) {
        const effect = createEffect(applyCurrent)
        requiredDisposers.set(element, () => effect.dispose())
      }
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
  options?: RequiredInput,
): Modifier {
  return createRequiredModifier(options)
}

export function registerRequiredModifier(
  registry?: ModifierRegistry,
  plugin?: PluginInfo,
): void {
  const factory = (options?: RequiredInput) =>
    createRequiredModifier(options)

  registerModifierWithMetadata(
    'required',
    factory,
    REQUIRED_METADATA,
    registry,
    plugin,
  )
}
