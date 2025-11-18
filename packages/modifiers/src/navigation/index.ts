/**
 * Navigation helper factories used by the core builder and navigation package.
 */

import { AppearanceModifier } from '@tachui/core/modifiers'
import type { Modifier } from '@tachui/types/modifiers'
import type { ComponentInstance } from '@tachui/core'

export function navigationTitle(title: string): Modifier {
  return new AppearanceModifier({
    navigationTitle: title,
    role: 'heading',
  })
}

export function navigationBarHidden(
  hidden: boolean = true
): Modifier {
  return new AppearanceModifier({
    navigationBarHidden: hidden,
    'aria-hidden': hidden.toString(),
  })
}

export function navigationBarItems(options: {
  leading?: ComponentInstance | ComponentInstance[]
  trailing?: ComponentInstance | ComponentInstance[]
}): Modifier {
  return new AppearanceModifier({ navigationBarItems: options })
}
