/**
 * Preload entry for backdrop and glassmorphism utilities.
 */

import { globalModifierRegistry } from '@tachui/registry'
import {
  backdropFilter,
  customGlassmorphism,
  glassmorphism,
} from '../effects/backdrop'

const backdropRegistrations: Array<[string, (...args: any[]) => any]> = [
  ['backdropFilter', backdropFilter],
  ['glassmorphism', glassmorphism],
  ['customGlassmorphism', customGlassmorphism],
]

backdropRegistrations.forEach(([name, factory]) => {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, factory as any)
  }
})

export * from '../effects/backdrop'
