import type { ModifierMethodsOf } from '@tachui/types/modifiers'
import type { DOMNode } from '@tachui/core/runtime/types'
import type { ComponentInstance } from '@tachui/core/runtime/types'
import type { FragmentMarker } from '@tachui/core/runtime/types'
import type { ModifierFactory } from '@tachui/core/modifiers/types'
import type { FragmentSnapshotHandlers } from './types'
import {
  BaseModifier,
  ModifierPriority,
  registerModifierWithMetadata,
} from '@tachui/core/modifiers'
import { fragmentModifierSignatures } from './modifier-signatures.generated'
import { TACHUI_PACKAGE_VERSION } from './version'

function resolveComponentName(componentInstance?: ComponentInstance): string {
  if (!componentInstance) return 'Fragment'

  const value = componentInstance as unknown as Record<string, unknown>
  const displayName = value.displayName
  if (typeof displayName === 'string' && displayName.trim().length > 0) {
    return displayName
  }

  const renderFn = value.render
  if (typeof renderFn === 'function' && renderFn.name) {
    return renderFn.name
  }

  return 'Fragment'
}

function ensureFragmentMarker(
  node: DOMNode,
  context: { componentId: string; componentInstance?: ComponentInstance }
): FragmentMarker {
  const existing = (node as any).__tachui_fragment as FragmentMarker | undefined
  const componentId =
    existing?.componentId ||
    context.componentId ||
    ((node as any).componentId ? String((node as any).componentId) : 'unknown')
  const componentName = existing?.componentName || resolveComponentName(context.componentInstance)

  const marker: FragmentMarker = {
    ...existing,
    componentId,
    componentName,
  }

  ;(node as any).__tachui_fragment = marker
  return marker
}

export class InteractiveModifier extends BaseModifier<Record<string, never>> {
  readonly type = 'interactive'
  readonly priority = ModifierPriority.INTERACTION

  constructor() {
    super({})
  }

  apply(node: DOMNode, context: { componentId: string; componentInstance?: ComponentInstance }): DOMNode {
    if (node.type !== 'element') {
      return node
    }

    ensureFragmentMarker(node, context)
    return node
  }
}

export class SnapshotModifier extends BaseModifier<FragmentSnapshotHandlers> {
  readonly type = 'snapshot'
  readonly priority = ModifierPriority.INTERACTION

  apply(node: DOMNode, context: { componentId: string; componentInstance?: ComponentInstance }): DOMNode {
    if (node.type !== 'element') {
      return node
    }

    const marker = ensureFragmentMarker(node, context)

    marker.snapshotData = this.properties.get()

    return node
  }
}

export function interactive(): InteractiveModifier {
  return new InteractiveModifier()
}

export function snapshot(properties: FragmentSnapshotHandlers): SnapshotModifier {
  return new SnapshotModifier(properties)
}

const FRAGMENTS_PLUGIN_INFO = {
  name: '@tachui/fragments',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

export function registerFragmentModifiers(): void {
  registerModifierWithMetadata(
    'interactive',
    () => interactive(),
    {
      category: 'interaction',
      priority: ModifierPriority.INTERACTION,
      signature: fragmentModifierSignatures.interactive,
      description: 'Marks the component as a fragment that hydrates on the client.',
    },
    undefined,
    FRAGMENTS_PLUGIN_INFO,
  )

  const snapshotFactory: ModifierFactory<FragmentSnapshotHandlers> = props =>
    snapshot(props as unknown as FragmentSnapshotHandlers)
  registerModifierWithMetadata(
    'snapshot',
    snapshotFactory,
    {
      category: 'interaction',
      priority: ModifierPriority.INTERACTION,
      signature: fragmentModifierSignatures.snapshot,
      description: 'Captures and restores fragment state across hydration.',
    },
    undefined,
    FRAGMENTS_PLUGIN_INFO,
  )
}

// Type the fragment modifiers on the builder, from their factories, so they
// typecheck exactly when this module has registered them.
declare module '@tachui/types/modifiers' {
  interface ModifierBuilder<T extends ComponentInstance = ComponentInstance>
    extends ModifierMethodsOf<{ interactive: typeof interactive; snapshot: typeof snapshot }> {}
}
