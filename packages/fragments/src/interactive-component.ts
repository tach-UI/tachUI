import { h } from '@tachui/core'
import type { DOMNode } from '@tachui/core/runtime/types'
import type { FragmentMarker } from '@tachui/core/runtime/types'
import type { InteractiveProps } from './types'

function markNodeAsInteractive(node: DOMNode, componentName: string): DOMNode {
  if (node.type !== 'element') {
    return node
  }

  const existing = (node as any).__tachui_fragment as FragmentMarker | undefined
  const shouldWarnMissingComponentId =
    typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
  if (shouldWarnMissingComponentId && !existing?.componentId) {
    console.warn(
      `[tachui/fragments] Interactive boundary "${componentName}" has no componentId and will remain static.`
    )
  }
  ;(node as any).__tachui_fragment = {
    ...existing,
    componentId: existing?.componentId ?? '',
    componentName: existing?.componentName ?? componentName,
    snapshotData: existing?.snapshotData,
  } satisfies FragmentMarker

  return node
}

export function Interactive(props: InteractiveProps): DOMNode {
  const children = props.children == null
    ? []
    : Array.isArray(props.children)
      ? props.children
      : [props.children]

  const componentName = props.componentName ?? 'Interactive'

  if (children.length === 1) {
    return markNodeAsInteractive(children[0], componentName)
  }

  const wrapper = h('div', null, ...children)
  return markNodeAsInteractive(wrapper, componentName)
}
