import type { DOMNode } from '@tachui/core/runtime/types'
import type { ComponentInstance } from '@tachui/core/runtime/types'
import type { FragmentMarker } from '@tachui/core/runtime/types'
import type { ModifierFactory } from '@tachui/core/modifiers/types'
import type { FragmentSnapshotHandlers } from './types'
import { BaseModifier, createModifierRegistry, ModifierPriority } from '@tachui/core/modifiers'

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

export function registerFragmentModifiers(): void {
  const registry = createModifierRegistry()

  if (!registry.has('interactive')) {
    registry.register('interactive', () => interactive())
  }

  if (!registry.has('snapshot')) {
    const snapshotFactory: ModifierFactory<FragmentSnapshotHandlers> = props =>
      snapshot(props as unknown as FragmentSnapshotHandlers)
    registry.register('snapshot', snapshotFactory)
  }
}
