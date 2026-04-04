import { renderComponent } from '@tachui/core'
import type { ComponentInstance, Modifier } from '@tachui/core'
import { getFragmentConfig } from './config'
import type { FragmentErrorContext, FragmentRuntimeManifest } from './types'

const fragmentRegistry = new Map<string, () => ComponentInstance>()
let hydrationStarted = false

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error))
}

function reportHydrationError(error: unknown, context: FragmentErrorContext): void {
  const config = getFragmentConfig()
  config.onHydrationError(toError(error), context)
}

function readManifestFromDOM(): FragmentRuntimeManifest {
  if (typeof document === 'undefined') {
    return {}
  }

  const manifestElement = document.getElementById('tachui-fragment-manifest')
  if (!manifestElement?.textContent) {
    return {}
  }

  try {
    return JSON.parse(manifestElement.textContent) as FragmentRuntimeManifest
  } catch {
    return {}
  }
}

function restoreSnapshotIfAvailable(
  instance: ComponentInstance,
  snapshot: Record<string, unknown> | undefined
): void {
  if (!snapshot) return

  const modifiers = ((instance as any).modifiers ?? []) as Modifier[]
  for (const modifier of modifiers) {
    if (modifier.type !== 'snapshot') continue

    const restore = (modifier as any).properties?.restore
    if (typeof restore === 'function') {
      restore(snapshot)
    }
  }
}

function resolveComponentFactory(name: string): (() => ComponentInstance) | undefined {
  return fragmentRegistry.get(name)
}

function normalizeComponentInstance(value: unknown): ComponentInstance {
  if (
    typeof value === 'object' &&
    value !== null &&
    (value as any).type === 'component' &&
    typeof (value as any).render === 'function'
  ) {
    return value as ComponentInstance
  }

  if (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as any).build === 'function'
  ) {
    const built = (value as any).build()
    if (
      typeof built === 'object' &&
      built !== null &&
      (built as any).type === 'component' &&
      typeof (built as any).render === 'function'
    ) {
      return built as ComponentInstance
    }
  }

  throw new Error('Fragment factory must return a component instance or modifier builder.')
}

function hydrateNow(): void {
  const manifest = readManifestFromDOM()
  const nodes = Array.from(document.querySelectorAll('tachui-fragment'))

  for (const fragmentElement of nodes) {
    const componentId = fragmentElement.getAttribute('data-component-id') ?? undefined
    const componentName =
      fragmentElement.getAttribute('data-component') ??
      (componentId ? manifest[componentId] : undefined)

    if (!componentName) {
      reportHydrationError(
        new Error('Missing fragment component name.'),
        { phase: 'resolve', componentId }
      )
      continue
    }

    const factory = resolveComponentFactory(componentName)
    if (!factory) {
      reportHydrationError(
        new Error(`Fragment component "${componentName}" is not registered.`),
        { phase: 'resolve', componentId, componentName }
      )
      continue
    }

    const stateRaw = fragmentElement.getAttribute('data-state')
    let snapshot: Record<string, unknown> | undefined
    if (stateRaw) {
      try {
        snapshot = JSON.parse(stateRaw) as Record<string, unknown>
      } catch (error) {
        reportHydrationError(error, {
          phase: 'restore',
          componentId,
          componentName,
        })
      }
    }

    const staticHTML = fragmentElement.innerHTML

    try {
      const instance = normalizeComponentInstance(factory())
      restoreSnapshotIfAvailable(instance, snapshot)
      fragmentElement.innerHTML = ''
      renderComponent(instance, fragmentElement)
    } catch (error) {
      fragmentElement.innerHTML = staticHTML
      reportHydrationError(error, {
        phase: 'hydrate',
        componentId,
        componentName,
      })
    }
  }
}

export function registerFragment(name: string, component: () => ComponentInstance): void {
  fragmentRegistry.set(name, component)
}

export function hydrateFragments(): void {
  if (hydrationStarted || typeof document === 'undefined') {
    return
  }

  hydrationStarted = true

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrateNow, { once: true })
    return
  }

  hydrateNow()
}

export function __resetFragmentsRuntimeForTests(): void {
  hydrationStarted = false
  fragmentRegistry.clear()
}
