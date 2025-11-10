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

import { registerGridModifiers } from './modifiers/grid'

registerGridModifiers()

export { registerGridModifiers } from './modifiers/grid'

if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  ;(import.meta as any).hot.accept(() => {
    registerGridModifiers({ force: true })
  })
}
