/**
 * Tests for Grid Spanning Modifiers (Phase 3)
 */

import { beforeEach, describe, expect, it } from 'vitest'
import {
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
  gridCellAnchor
} from '../../src/modifiers/grid'
import type { GridSpanConfig } from '../../src/components/Grid'
import { setupModifierTest } from './test-utils'

describe('GridColumnSpanModifier', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('Constructor and Properties', () => {
    it('should create modifier with span only', () => {
      const modifier = new GridColumnSpanModifier(3)
      expect(modifier.type).toBe('grid-column-span')
      expect(modifier.priority).toBe(200)
      expect(modifier.properties).toEqual({ span: 3, start: undefined })
    })

    it('should create modifier with span and start position', () => {
      const modifier = new GridColumnSpanModifier(2, 3)
      expect(modifier.properties).toEqual({ span: 2, start: 3 })
    })
  })

  describe('CSS Application', () => {
    it('should apply grid-column span without start position', () => {
      const modifier = new GridColumnSpanModifier(3)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridColumn).toBe('span 3')
    })

    it('should apply grid-column span with start position', () => {
      const modifier = new GridColumnSpanModifier(2, 4)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridColumn).toBe('4 / span 2')
    })

    it('should handle missing element gracefully', () => {
      const modifier = new GridColumnSpanModifier(3)
      const invalidNode = { type: 'element', element: null } as any
      
      const result = modifier.apply(invalidNode, mockContext)
      expect(result).toBeUndefined()
    })
  })
})

describe('GridRowSpanModifier', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('Constructor and Properties', () => {
    it('should create modifier with span only', () => {
      const modifier = new GridRowSpanModifier(2)
      expect(modifier.type).toBe('grid-row-span')
      expect(modifier.priority).toBe(200)
      expect(modifier.properties).toEqual({ span: 2, start: undefined })
    })

    it('should create modifier with span and start position', () => {
      const modifier = new GridRowSpanModifier(3, 2)
      expect(modifier.properties).toEqual({ span: 3, start: 2 })
    })
  })

  describe('CSS Application', () => {
    it('should apply grid-row span without start position', () => {
      const modifier = new GridRowSpanModifier(2)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridRow).toBe('span 2')
    })

    it('should apply grid-row span with start position', () => {
      const modifier = new GridRowSpanModifier(3, 2)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridRow).toBe('2 / span 3')
    })

    it('should handle invalid element gracefully', () => {
      const modifier = new GridRowSpanModifier(2)
      const textNode = { type: 'text', content: 'test' } as any
      
      const result = modifier.apply(textNode, mockContext)
      expect(result).toBeUndefined()
    })
  })
})

describe('GridAreaModifier', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('Constructor and Properties', () => {
    it('should create modifier with named area', () => {
      const modifier = new GridAreaModifier('header')
      expect(modifier.type).toBe('grid-area')
      expect(modifier.priority).toBe(200)
      expect(modifier.properties).toEqual({ area: 'header' })
    })
  })

  describe('CSS Application', () => {
    it('should apply grid-area property', () => {
      const modifier = new GridAreaModifier('sidebar')
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridArea).toBe('sidebar')
    })

    it('should handle complex area names', () => {
      const modifier = new GridAreaModifier('main-content')
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridArea).toBe('main-content')
    })
  })
})

describe('GridCellAlignmentModifier', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('Constructor and Properties', () => {
    it('should create modifier with alignment for both axes by default', () => {
      const modifier = new GridCellAlignmentModifier('center')
      expect(modifier.type).toBe('grid-cell-alignment')
      expect(modifier.properties).toEqual({
        justifySelf: 'center',
        alignSelf: 'center'
      })
    })

    it('should create modifier for horizontal axis only', () => {
      const modifier = new GridCellAlignmentModifier('start', 'horizontal')
      expect(modifier.properties).toEqual({
        justifySelf: 'start',
        alignSelf: undefined
      })
    })

    it('should create modifier for vertical axis only', () => {
      const modifier = new GridCellAlignmentModifier('end', 'vertical')
      expect(modifier.properties).toEqual({
        justifySelf: undefined,
        alignSelf: 'end'
      })
    })

    it('should create modifier for both axes explicitly', () => {
      const modifier = new GridCellAlignmentModifier('stretch', 'both')
      expect(modifier.properties).toEqual({
        justifySelf: 'stretch',
        alignSelf: 'stretch'
      })
    })
  })

  describe('CSS Application', () => {
    it('should apply justify-self and align-self for both axes', () => {
      const modifier = new GridCellAlignmentModifier('center')
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.justifySelf).toBe('center')
      expect(mockElement.style.alignSelf).toBe('center')
    })

    it('should apply only justify-self for horizontal axis', () => {
      const modifier = new GridCellAlignmentModifier('start', 'horizontal')
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.justifySelf).toBe('start')
      expect(mockElement.style.alignSelf).toBe('')
    })

    it('should apply only align-self for vertical axis', () => {
      const modifier = new GridCellAlignmentModifier('end', 'vertical')
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.justifySelf).toBe('')
      expect(mockElement.style.alignSelf).toBe('end')
    })
  })
})

describe('GridItemConfigModifier', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  describe('Constructor and Properties', () => {
    it('should create modifier with comprehensive configuration', () => {
      const config: GridSpanConfig = {
        columnSpan: 2,
        rowSpan: 3,
        columnStart: 1,
        rowStart: 2,
        area: 'main',
        alignment: 'center'
      }
      const modifier = new GridItemConfigModifier(config)
      expect(modifier.type).toBe('grid-item-config')
      expect(modifier.properties).toEqual(config)
    })

    it('should create modifier with partial configuration', () => {
      const config: GridSpanConfig = {
        columnSpan: 3,
        alignment: 'stretch'
      }
      const modifier = new GridItemConfigModifier(config)
      expect(modifier.properties).toEqual(config)
    })
  })

  describe('CSS Application', () => {
    it('should apply comprehensive grid configuration', () => {
      const config: GridSpanConfig = {
        columnSpan: 2,
        rowSpan: 3,
        columnStart: 1,
        rowStart: 2,
        area: 'main',
        alignment: 'center'
      }
      const modifier = new GridItemConfigModifier(config)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridColumn).toBe('1 / span 2')
      expect(mockElement.style.gridRow).toBe('2 / span 3')
      expect(mockElement.style.gridArea).toBe('main')
      expect(mockElement.style.justifySelf).toBe('center')
      expect(mockElement.style.alignSelf).toBe('center')
    })

    it('should apply column span without start position', () => {
      const config: GridSpanConfig = { columnSpan: 3 }
      const modifier = new GridItemConfigModifier(config)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridColumn).toBe('span 3')
      expect(mockElement.style.gridRow).toBe('')
    })

    it('should apply row span without start position', () => {
      const config: GridSpanConfig = { rowSpan: 2 }
      const modifier = new GridItemConfigModifier(config)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridRow).toBe('span 2')
      expect(mockElement.style.gridColumn).toBe('')
    })

    it('should apply start positions without spans', () => {
      const config: GridSpanConfig = {
        columnStart: 3,
        rowStart: 2
      }
      const modifier = new GridItemConfigModifier(config)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridColumnStart).toBe('3')
      expect(mockElement.style.gridRowStart).toBe('2')
      expect(mockElement.style.gridColumn).toBe('')
      expect(mockElement.style.gridRow).toBe('')
    })

    it('should apply alignment only', () => {
      const config: GridSpanConfig = { alignment: 'stretch' }
      const modifier = new GridItemConfigModifier(config)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.justifySelf).toBe('stretch')
      expect(mockElement.style.alignSelf).toBe('stretch')
    })

    it('should apply area only', () => {
      const config: GridSpanConfig = { area: 'footer' }
      const modifier = new GridItemConfigModifier(config)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.gridArea).toBe('footer')
    })
  })
})

describe('Factory Functions', () => {
  describe('gridColumnSpan', () => {
    it('should create GridColumnSpanModifier with span only', () => {
      const modifier = gridColumnSpan(3)
      expect(modifier).toBeInstanceOf(GridColumnSpanModifier)
      expect(modifier.properties).toEqual({ span: 3, start: undefined })
    })

    it('should create GridColumnSpanModifier with span and start', () => {
      const modifier = gridColumnSpan(2, 4)
      expect(modifier.properties).toEqual({ span: 2, start: 4 })
    })
  })

  describe('gridRowSpan', () => {
    it('should create GridRowSpanModifier', () => {
      const modifier = gridRowSpan(2)
      expect(modifier).toBeInstanceOf(GridRowSpanModifier)
      expect(modifier.properties).toEqual({ span: 2, start: undefined })
    })

    it('should create GridRowSpanModifier with start position', () => {
      const modifier = gridRowSpan(3, 2)
      expect(modifier.properties).toEqual({ span: 3, start: 2 })
    })
  })

  describe('gridArea', () => {
    it('should create GridAreaModifier', () => {
      const modifier = gridArea('header')
      expect(modifier).toBeInstanceOf(GridAreaModifier)
      expect(modifier.properties).toEqual({ area: 'header' })
    })
  })

  describe('gridCellAlignment', () => {
    it('should create GridCellAlignmentModifier with default axis', () => {
      const modifier = gridCellAlignment('center')
      expect(modifier).toBeInstanceOf(GridCellAlignmentModifier)
      expect(modifier.properties).toEqual({
        justifySelf: 'center',
        alignSelf: 'center'
      })
    })

    it('should create GridCellAlignmentModifier with specific axis', () => {
      const modifier = gridCellAlignment('start', 'horizontal')
      expect(modifier.properties).toEqual({
        justifySelf: 'start',
        alignSelf: undefined
      })
    })
  })

  describe('gridItemConfig', () => {
    it('should create GridItemConfigModifier', () => {
      const config: GridSpanConfig = {
        columnSpan: 2,
        alignment: 'center'
      }
      const modifier = gridItemConfig(config)
      expect(modifier).toBeInstanceOf(GridItemConfigModifier)
      expect(modifier.properties).toEqual(config)
    })
  })
})

describe('SwiftUI Compatibility Aliases', () => {
  it('should provide gridCellColumns alias for gridColumnSpan', () => {
    expect(gridCellColumns).toBe(gridColumnSpan)
  })

  it('should provide gridCellRows alias for gridRowSpan', () => {
    expect(gridCellRows).toBe(gridRowSpan)
  })

  it('should provide gridCellAnchor alias for gridCellAlignment', () => {
    expect(gridCellAnchor).toBe(gridCellAlignment)
  })
})

describe('Integration Tests', () => {
  let mockElement: HTMLElement
  let mockNode: any
  let mockContext: any

  beforeEach(() => {
    const setup = setupModifierTest()
    mockElement = setup.mockElement
    mockNode = setup.mockNode
    mockContext = setup.mockContext
  })

  it('should combine multiple grid modifiers correctly', () => {
    const columnModifier = gridColumnSpan(2, 1)
    const rowModifier = gridRowSpan(3)
    const alignmentModifier = gridCellAlignment('center')

    // Apply all modifiers
    columnModifier.apply(mockNode, mockContext)
    rowModifier.apply(mockNode, mockContext)
    alignmentModifier.apply(mockNode, mockContext)

    // Verify all properties are applied
    expect(mockElement.style.gridColumn).toBe('1 / span 2')
    expect(mockElement.style.gridRow).toBe('span 3')
    expect(mockElement.style.justifySelf).toBe('center')
    expect(mockElement.style.alignSelf).toBe('center')
  })

  it('should handle comprehensive configuration with one modifier', () => {
    const config: GridSpanConfig = {
      columnSpan: 3,
      rowSpan: 2,
      columnStart: 2,
      rowStart: 1,
      alignment: 'stretch'
    }
    const modifier = gridItemConfig(config)
    modifier.apply(mockNode, mockContext)

    expect(mockElement.style.gridColumn).toBe('2 / span 3')
    expect(mockElement.style.gridRow).toBe('1 / span 2')
    expect(mockElement.style.justifySelf).toBe('stretch')
    expect(mockElement.style.alignSelf).toBe('stretch')
  })

  it('should override with area when specified', () => {
    // First apply spanning
    const spanModifier = gridItemConfig({ columnSpan: 2, rowSpan: 2 })
    spanModifier.apply(mockNode, mockContext)

    expect(mockElement.style.gridColumn).toBe('span 2')
    expect(mockElement.style.gridRow).toBe('span 2')

    // Then apply area (should override)
    const areaModifier = gridArea('main-content')
    areaModifier.apply(mockNode, mockContext)

    expect(mockElement.style.gridArea).toBe('main-content')
    // Previous spanning styles remain unless overridden by area
    expect(mockElement.style.gridColumn).toBe('span 2')
    expect(mockElement.style.gridRow).toBe('span 2')
  })

  it('should handle all alignment values correctly', () => {
    const alignments: Array<'start' | 'center' | 'end' | 'stretch'> = ['start', 'center', 'end', 'stretch']

    alignments.forEach(alignment => {
      // Reset element
      mockElement.style.justifySelf = ''
      mockElement.style.alignSelf = ''

      const modifier = gridCellAlignment(alignment)
      modifier.apply(mockNode, mockContext)

      expect(mockElement.style.justifySelf).toBe(alignment)
      expect(mockElement.style.alignSelf).toBe(alignment)
    })
  })

  it('should handle edge cases gracefully', () => {
    // Test with span of 1
    const modifier1 = gridColumnSpan(1)
    modifier1.apply(mockNode, mockContext)
    expect(mockElement.style.gridColumn).toBe('span 1')

    // Test with large span
    const modifier2 = gridRowSpan(10, 1)
    modifier2.apply(mockNode, mockContext)
    expect(mockElement.style.gridRow).toBe('1 / span 10')

    // Test with zero start position (should work)
    const modifier3 = gridColumnSpan(2, 0)
    modifier3.apply(mockNode, mockContext)
    expect(mockElement.style.gridColumn).toBe('0 / span 2')
  })
})