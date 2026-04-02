/**
 * Compositing Group Modifier
 *
 * Creates a local compositing context so descendant blend modes are isolated
 * from content outside this element.
 */

import { BaseModifier } from '../basic/base'
import type { DOMNode } from '@tachui/types/runtime'
import type { ModifierContext } from '@tachui/types/modifiers'

export class CompositingGroupModifier extends BaseModifier<Record<string, never>> {
  readonly type = 'compositingGroup'
  readonly priority = 94

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    this.applyStyleChange(context.element, 'isolation', 'isolate')
    return undefined
  }
}

export function compositingGroup(): CompositingGroupModifier {
  return new CompositingGroupModifier({})
}
