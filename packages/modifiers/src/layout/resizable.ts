/**
 * Resizable modifier helper (mirrors SwiftUI's Image.resizable()).
 */

import { ResizableModifier } from '@tachui/core/modifiers'
import type { Modifier } from '@tachui/core/modifiers/types'

export function resizable(): Modifier {
  return new ResizableModifier({})
}
