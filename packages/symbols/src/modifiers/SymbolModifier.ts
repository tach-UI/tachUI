import type { ModifierBuilder, Signal, ComponentInstance } from '@tachui/core'
import type { 
  SymbolVariant, 
  SymbolScale, 
  SymbolWeight, 
  SymbolRenderingMode, 
  SymbolEffect 
} from '../types.js'

/**
 * Symbol-specific modifier extensions
 * 
 * These modifiers extend the base TachUI modifier system with Symbol-specific
 * functionality. The actual implementation is handled by the modifier registry
 * in TachUI core.
 */
export interface SymbolModifierBuilder<T extends ComponentInstance = ComponentInstance> extends ModifierBuilder<T> {
  // Symbol variants
  variant(variant: SymbolVariant | Signal<SymbolVariant>): SymbolModifierBuilder<T>
  filled(): SymbolModifierBuilder<T>                    // .variant('filled')
  slash(): SymbolModifierBuilder<T>                     // .variant('slash')
  circle(): SymbolModifierBuilder<T>                    // .variant('circle')
  square(): SymbolModifierBuilder<T>                    // .variant('square')
  
  // Symbol scaling (renamed to avoid conflict with ModifierBuilder.scale)
  symbolScale(scale: SymbolScale | Signal<SymbolScale>): SymbolModifierBuilder<T>
  scaleSmall(): SymbolModifierBuilder<T>                // .symbolScale('small')
  scaleMedium(): SymbolModifierBuilder<T>               // .symbolScale('medium')  
  scaleLarge(): SymbolModifierBuilder<T>                // .symbolScale('large')
  
  // Symbol weight
  weight(weight: SymbolWeight | Signal<SymbolWeight>): SymbolModifierBuilder<T>
  weightThin(): SymbolModifierBuilder<T>                // .weight('thin')
  weightRegular(): SymbolModifierBuilder<T>             // .weight('regular')
  weightBold(): SymbolModifierBuilder<T>                // .weight('bold')
  
  // Rendering modes
  renderingMode(mode: SymbolRenderingMode): SymbolModifierBuilder<T>
  monochrome(): SymbolModifierBuilder<T>                // .renderingMode('monochrome')
  hierarchical(): SymbolModifierBuilder<T>              // .renderingMode('hierarchical')
  palette(primary: string, secondary?: string, tertiary?: string): SymbolModifierBuilder<T>
  multicolor(): SymbolModifierBuilder<T>                // .renderingMode('multicolor')
  
  // Symbol effects
  symbolEffect(effect: SymbolEffect, value?: number): SymbolModifierBuilder<T>
  bounce(): SymbolModifierBuilder<T>                    // .symbolEffect('bounce')
  pulse(): SymbolModifierBuilder<T>                     // .symbolEffect('pulse')
  wiggle(): SymbolModifierBuilder<T>                    // .symbolEffect('wiggle')
  rotate(): SymbolModifierBuilder<T>                    // .symbolEffect('rotate')
  breathe(): SymbolModifierBuilder<T>                   // .symbolEffect('breathe')
}