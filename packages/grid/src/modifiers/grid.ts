/**
 * Grid Layout Modifiers (Phase 3)
 *
 * SwiftUI-equivalent grid modifiers for spanning, positioning, and alignment.
 * Provides comprehensive grid item control with CSS Grid integration.
 */

import { BaseModifier } from '@tachui/modifiers'
import type { ModifierContext } from '@tachui/modifiers'
import { registerModifierWithMetadata } from '@tachui/core/modifiers'
import type {
  ModifierRegistry,
  PluginInfo,
} from '@tachui/registry'
import type { DOMNode } from '@tachui/core/runtime/types'
import type { GridSpanConfig } from '../components/Grid'
import { TACHUI_PACKAGE_VERSION } from '../version'

/**
 * Grid column span modifier (equivalent to SwiftUI's gridCellColumns)
 */
export class GridColumnSpanModifier extends BaseModifier<{
  span: number
  start?: number
}> {
  readonly type = 'grid-column-span'
  readonly priority = 200

  constructor(span: number, start?: number) {
    super({ span, start })
  }

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    const element = context.element || node.element
    if (!element) {
      return undefined
    }

    const { span, start } = this.properties

    if (start !== undefined) {
      ;(element as any).style.gridColumn = `${start} / span ${span}`
    } else {
      ;(element as any).style.gridColumn = `span ${span}`
    }

    return undefined
  }
}

/**
 * Grid row span modifier (equivalent to SwiftUI's gridCellRows)
 */
export class GridRowSpanModifier extends BaseModifier<{
  span: number
  start?: number
}> {
  readonly type = 'grid-row-span'
  readonly priority = 200

  constructor(span: number, start?: number) {
    super({ span, start })
  }

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    const element = context.element || node.element
    if (!element) {
      return undefined
    }

    const { span, start } = this.properties

    if (start !== undefined) {
      ;(element as any).style.gridRow = `${start} / span ${span}`
    } else {
      ;(element as any).style.gridRow = `span ${span}`
    }

    return undefined
  }
}

/**
 * Grid area modifier for named grid areas
 */
export class GridAreaModifier extends BaseModifier<{ area: string }> {
  readonly type = 'grid-area'
  readonly priority = 200

  constructor(area: string) {
    super({ area })
  }

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    const element = context.element || node.element
    if (!element) {
      return undefined
    }

    ;(element as any).style.gridArea = this.properties.area

    return undefined
  }
}

/**
 * Grid cell alignment modifier (equivalent to SwiftUI's gridCellAnchor)
 */
export class GridCellAlignmentModifier extends BaseModifier<{
  justifySelf?: 'start' | 'center' | 'end' | 'stretch'
  alignSelf?: 'start' | 'center' | 'end' | 'stretch'
}> {
  readonly type = 'grid-cell-alignment'
  readonly priority = 200

  constructor(
    alignment: 'start' | 'center' | 'end' | 'stretch',
    axis?: 'horizontal' | 'vertical' | 'both'
  ) {
    const config: {
      justifySelf?: 'start' | 'center' | 'end' | 'stretch'
      alignSelf?: 'start' | 'center' | 'end' | 'stretch'
    } = {}

    if (axis === 'horizontal' || axis === 'both' || axis === undefined) {
      config.justifySelf = alignment
    }
    if (axis === 'vertical' || axis === 'both' || axis === undefined) {
      config.alignSelf = alignment
    }

    super(config)
  }

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    const element = context.element || node.element
    if (!element) {
      return undefined
    }

    const { justifySelf, alignSelf } = this.properties

    if (justifySelf) {
      ;(element as any).style.justifySelf = justifySelf
    }
    if (alignSelf) {
      ;(element as any).style.alignSelf = alignSelf
    }

    return undefined
  }
}

/**
 * Comprehensive grid item configuration modifier
 */
export class GridItemConfigModifier extends BaseModifier<GridSpanConfig> {
  readonly type = 'grid-item-config'
  readonly priority = 200

  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    const element = context.element || node.element
    if (!element) {
      return undefined
    }

    const { columnSpan, rowSpan, columnStart, rowStart, area, alignment } =
      this.properties
    const elementStyle = (element as any).style

    // Apply column spanning
    if (columnSpan !== undefined) {
      if (columnStart !== undefined) {
        elementStyle.gridColumn = `${columnStart} / span ${columnSpan}`
      } else {
        elementStyle.gridColumn = `span ${columnSpan}`
      }
    } else if (columnStart !== undefined) {
      elementStyle.gridColumnStart = columnStart.toString()
    }

    // Apply row spanning
    if (rowSpan !== undefined) {
      if (rowStart !== undefined) {
        elementStyle.gridRow = `${rowStart} / span ${rowSpan}`
      } else {
        elementStyle.gridRow = `span ${rowSpan}`
      }
    } else if (rowStart !== undefined) {
      elementStyle.gridRowStart = rowStart.toString()
    }

    // Apply grid area
    if (area) {
      elementStyle.gridArea = area
    }

    // Apply alignment
    if (alignment) {
      elementStyle.justifySelf = alignment
      elementStyle.alignSelf = alignment
    }

    return undefined
  }
}

/**
 * SwiftUI-style modifier factory functions
 */

/**
 * Span multiple columns (.gridCellColumns equivalent)
 */
export function gridColumnSpan(
  span: number,
  start?: number
): GridColumnSpanModifier {
  return new GridColumnSpanModifier(span, start)
}

/**
 * Span multiple rows (.gridCellRows equivalent)
 */
export function gridRowSpan(span: number, start?: number): GridRowSpanModifier {
  return new GridRowSpanModifier(span, start)
}

/**
 * Place item in named grid area
 */
export function gridArea(area: string): GridAreaModifier {
  return new GridAreaModifier(area)
}

/**
 * Align grid item within its cell (.gridCellAnchor equivalent)
 */
export function gridCellAlignment(
  alignment: 'start' | 'center' | 'end' | 'stretch',
  axis?: 'horizontal' | 'vertical' | 'both'
): GridCellAlignmentModifier {
  return new GridCellAlignmentModifier(alignment, axis)
}

/**
 * Comprehensive grid item configuration
 */
export function gridItemConfig(config: GridSpanConfig): GridItemConfigModifier {
  return new GridItemConfigModifier(config)
}

// SwiftUI naming compatibility aliases
export const gridCellColumns = gridColumnSpan
export const gridCellRows = gridRowSpan
export const gridCellAnchor = gridCellAlignment

const GRID_PLUGIN_INFO: PluginInfo = {
  name: '@tachui/grid',
  version: TACHUI_PACKAGE_VERSION,
  author: 'TachUI Team',
  verified: true,
}

type GridModifierRegistration = [
  name: string,
  factory: (...args: any[]) => any,
  metadata: {
    category: 'layout'
    priority: number
    signature: string
    description: string
  }
]

const GRID_MODIFIER_PRIORITY = 180

const gridModifierRegistrations: GridModifierRegistration[] = [
  [
    'gridColumnSpan',
    gridColumnSpan,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature: '(span: number, start?: number) => Modifier',
      description: 'Spans a grid item across multiple columns with optional starting column.',
    },
  ],
  [
    'gridRowSpan',
    gridRowSpan,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature: '(span: number, start?: number) => Modifier',
      description: 'Spans a grid item across multiple rows with optional starting row.',
    },
  ],
  [
    'gridArea',
    gridArea,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature: '(area: string) => Modifier',
      description: 'Places a grid item into a named CSS grid area.',
    },
  ],
  [
    'gridCellAlignment',
    gridCellAlignment,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature:
        "(alignment: 'start' | 'center' | 'end' | 'stretch', axis?: 'horizontal' | 'vertical' | 'both') => Modifier",
      description: 'Aligns a grid item within its cell on horizontal or vertical axes.',
    },
  ],
  [
    'gridItemConfig',
    gridItemConfig,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature: '(config: GridSpanConfig) => Modifier',
      description: 'Applies a full grid configuration including span, start, area, and alignment.',
    },
  ],
  [
    'gridCellColumns',
    gridCellColumns,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature: '(span: number, start?: number) => Modifier',
      description: 'SwiftUI compatibility alias for gridColumnSpan.',
    },
  ],
  [
    'gridCellRows',
    gridCellRows,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature: '(span: number, start?: number) => Modifier',
      description: 'SwiftUI compatibility alias for gridRowSpan.',
    },
  ],
  [
    'gridCellAnchor',
    gridCellAnchor,
    {
      category: 'layout',
      priority: GRID_MODIFIER_PRIORITY,
      signature:
        "(alignment: 'start' | 'center' | 'end' | 'stretch', axis?: 'horizontal' | 'vertical' | 'both') => Modifier",
      description: 'SwiftUI compatibility alias for gridCellAlignment.',
    },
  ],
]

let gridModifiersRegistered = false

export interface RegisterGridModifiersOptions {
  registry?: ModifierRegistry
  plugin?: PluginInfo
  force?: boolean
}

export function registerGridModifiers(
  options?: RegisterGridModifiersOptions,
): void {
  const targetRegistry = options?.registry
  const targetPlugin = options?.plugin ?? GRID_PLUGIN_INFO
  const shouldForce = options?.force === true
  const isCustomTarget = Boolean(targetRegistry || options?.plugin)

  if (!isCustomTarget && gridModifiersRegistered && !shouldForce) {
    return
  }

  gridModifierRegistrations.forEach(([name, factory, metadata]) => {
    registerModifierWithMetadata(
      name,
      factory,
      metadata,
      targetRegistry,
      targetPlugin,
    )
  })

  if (!isCustomTarget) {
    gridModifiersRegistered = true
  }
}
