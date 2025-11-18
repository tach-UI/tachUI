/**
 * Resizable modifier helper (mirrors SwiftUI's Image.resizable()).
 */

import { ResizableModifier } from '@tachui/core/modifiers'
import type { Modifier } from '@tachui/types/modifiers'

export function resizable(): Modifier {
  return new ResizableModifier({})
}
