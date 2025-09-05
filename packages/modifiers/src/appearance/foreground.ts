/**
 * Foreground Modifiers
 *
 * Text color and foreground styling modifiers
 */

import { BaseModifier } from '../basic/base'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'

export interface ForegroundOptions {
  color: string
}

export class ForegroundModifier extends BaseModifier<ForegroundOptions> {
  readonly type = 'foreground'
  readonly priority = 90

  apply(_node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return

    const element = context.element as HTMLElement
    element.style.color = this.properties.color

    return undefined
  }
}

export function foregroundColor(color: string): ForegroundModifier {
  return new ForegroundModifier({ color })
}

export function foreground(color: string): ForegroundModifier {
  return new ForegroundModifier({ color })
}
