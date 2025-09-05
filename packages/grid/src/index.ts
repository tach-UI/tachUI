/**
 * @tachui/grid - CSS Grid Layout System
 *
 * SwiftUI-inspired grid components for building responsive layouts
 * with CSS Grid integration.
 */

// Export grid components
export type {
  BaseGridProps,
  GridAlignment,
  GridItemConfig,
  GridProps,
  GridRowProps,
  LazyHGridProps,
  LazyVGridProps,
  ResponsiveGridItemConfig,
  GridSpanConfig,
} from './components/Grid'

export {
  BaseGridComponent,
  EnhancedGrid,
  EnhancedGridRow,
  EnhancedLazyHGrid,
  EnhancedLazyVGrid,
  Grid,
  GridCSSGenerator,
  GridItem,
  GridRow,
  LazyHGrid,
  LazyVGrid,
} from './components/Grid'

// Export grid modifiers
export {
  GridColumnSpanModifier,
  GridRowSpanModifier,
  GridAreaModifier,
  GridCellAlignmentModifier,
  GridItemConfigModifier,
  gridColumnSpan,
  gridRowSpan,
  gridArea,
  gridCellAlignment,
  gridItemConfig,
  gridCellColumns,
  gridCellRows,
  gridCellAnchor,
} from './modifiers/grid'

// Registry integration for grid modifiers
import { globalModifierRegistry } from '@tachui/core'
import {
  gridColumnSpan,
  gridRowSpan,
  gridArea,
  gridCellAlignment,
  gridItemConfig,
  gridCellColumns,
  gridCellRows,
  gridCellAnchor,
} from './modifiers/grid'

const gridModifierRegistrations: Array<[string, (...args: any[]) => any]> = [
  ['gridColumnSpan', gridColumnSpan],
  ['gridRowSpan', gridRowSpan],
  ['gridArea', gridArea],
  ['gridCellAlignment', gridCellAlignment],
  ['gridItemConfig', gridItemConfig],
  ['gridCellColumns', gridCellColumns],
  ['gridCellRows', gridCellRows],
  ['gridCellAnchor', gridCellAnchor],
]

// Auto-register grid modifiers on import
gridModifierRegistrations.forEach(([name, factory]) => {
  globalModifierRegistry.register(name, factory)
})

if (process.env.NODE_ENV !== 'production') {
  console.info(
    `🔍 [@tachui/grid] Registered ${gridModifierRegistrations.length} grid modifiers with global registry`
  )
}
