/**
 * Convenience factories for common accessibility helpers.
 */

import type { Modifier } from '@tachui/types/modifiers'
import { aria } from './aria'

export function role(value: string): Modifier {
  return aria({ role: value })
}

export function ariaLabel(value: string): Modifier {
  return aria({ label: value })
}

export function ariaLive(
  value: 'off' | 'polite' | 'assertive'
): Modifier {
  return aria({ live: value })
}

export function ariaDescribedBy(value: string): Modifier {
  return aria({ describedby: value })
}

export function ariaModal(value: boolean): Modifier {
  return aria({ modal: value })
}
