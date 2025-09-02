/**
 * Tests for Grid Layout Components (Phase 1)
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type {
  GridProps,
  GridRowProps,
  LazyVGridProps,
  LazyHGridProps,
  GridItemConfig,
  ResponsiveGridItemConfig,
} from '../../src/components/Grid'
import {
  Grid,
  GridRow,
  LazyVGrid,
  LazyHGrid,
  GridItem,
  GridCSSGenerator,
  BaseGridComponent,
  EnhancedGrid,
  EnhancedGridRow,
  EnhancedLazyVGrid,
  EnhancedLazyHGrid,
} from '../../src/components/Grid'
import { Text } from '@tachui/primitives'

// Mock DOM environment
function createMockGridElement(): HTMLElement {
  const element = {
    tagName: 'DIV',
    style: {} as CSSStyleDeclaration,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    querySelector: vi.fn(),
    querySelectorAll: vi.fn(() => []),
    children: [],
    textContent: '',
    id: `mock-${Math.random()}`,
  } as any

  return element
}

// Mock document methods
beforeEach(() => {
  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => {
      if (tagName === 'div') {
        return createMockGridElement()
      }
      return {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        style: {},
        setAttribute: vi.fn(),
      }
    }),
  }
})

describe('GridItem', () => {
  describe('Factory Methods', () => {
    it('should create fixed-size grid item', () => {
      const item = GridItem.fixed(200)
      expect(item).toEqual({
        type: 'fixed',
        size: 200,
        spacing: undefined,
      })
    })

    it('should create fixed-size grid item with spacing', () => {
      const item = GridItem.fixed(150, 10)
      expect(item).toEqual({
        type: 'fixed',
        size: 150,
        spacing: 10,
      })
    })

    it('should create flexible grid item with defaults', () => {
      const item = GridItem.flexible()
      expect(item).toEqual({
        type: 'flexible',
        minimum: 0,
        maximum: undefined,
      })
    })

    it('should create flexible grid item with constraints', () => {
      const item = GridItem.flexible(100, 300)
      expect(item).toEqual({
        type: 'flexible',
        minimum: 100,
        maximum: 300,
      })
    })

    it('should create adaptive grid item', () => {
      const item = GridItem.adaptive(120)
      expect(item).toEqual({
        type: 'adaptive',
        minimum: 120,
        maximum: undefined,
      })
    })

    it('should create adaptive grid item with maximum', () => {
      const item = GridItem.adaptive(100, 250)
      expect(item).toEqual({
        type: 'adaptive',
        minimum: 100,
        maximum: 250,
      })
    })
  })
})

describe('GridCSSGenerator', () => {
  describe('generateColumns', () => {
    it('should generate CSS for fixed columns', () => {
      const items: GridItemConfig[] = [GridItem.fixed(200), GridItem.fixed(150)]
      const result = GridCSSGenerator.generateColumns(items)
      expect(result).toBe('200px 150px')
    })

    it('should generate CSS for flexible columns', () => {
      const items: GridItemConfig[] = [
        GridItem.flexible(),
        GridItem.flexible(100, 300),
      ]
      const result = GridCSSGenerator.generateColumns(items)
      expect(result).toBe('1fr minmax(100px, 300px)')
    })

    it('should generate CSS for adaptive columns', () => {
      const items: GridItemConfig[] = [
        GridItem.adaptive(120),
        GridItem.adaptive(100, 200),
      ]
      const result = GridCSSGenerator.generateColumns(items)
      expect(result).toBe('minmax(120px, 1fr) minmax(100px, 200px)')
    })

    it('should generate CSS for mixed column types', () => {
      const items: GridItemConfig[] = [
        GridItem.fixed(100),
        GridItem.flexible(50, 200),
        GridItem.adaptive(120),
      ]
      const result = GridCSSGenerator.generateColumns(items)
      expect(result).toBe('100px minmax(50px, 200px) minmax(120px, 1fr)')
    })
  })

  describe('generateSpacing', () => {
    it('should handle number spacing', () => {
      const result = GridCSSGenerator.generateSpacing(16)
      expect(result).toBe('16px')
    })

    it('should handle object spacing', () => {
      const result = GridCSSGenerator.generateSpacing({
        horizontal: 20,
        vertical: 12,
      })
      expect(result).toBe('12px 20px')
    })

    it('should handle partial object spacing', () => {
      const result = GridCSSGenerator.generateSpacing({ horizontal: 16 })
      expect(result).toBe('0px 16px')
    })

    it('should handle undefined spacing', () => {
      const result = GridCSSGenerator.generateSpacing()
      expect(result).toBe('0')
    })
  })

  describe('generateAlignment', () => {
    it('should handle center alignment', () => {
      const result = GridCSSGenerator.generateAlignment('center')
      expect(result).toEqual({
        justifyItems: 'center',
        alignItems: 'center',
      })
    })

    it('should handle topLeading alignment', () => {
      const result = GridCSSGenerator.generateAlignment('topLeading')
      expect(result).toEqual({
        justifyItems: 'start',
        alignItems: 'start',
      })
    })

    it('should handle bottomTrailing alignment', () => {
      const result = GridCSSGenerator.generateAlignment('bottomTrailing')
      expect(result).toEqual({
        justifyItems: 'end',
        alignItems: 'end',
      })
    })
  })
})

describe('Grid', () => {
  describe('Basic Functionality', () => {
    it('should create grid component with default props', () => {
      const grid = Grid()
      expect(grid).toBeDefined()
      expect(grid.modifier).toBeDefined()
    })

    it('should create grid component with children', () => {
      const textChild = Text('Grid Item')
      const grid = Grid({ children: [textChild] })
      expect(grid).toBeDefined()
    })

    it('should render grid element with CSS Grid display', () => {
      const textChild = Text('Test').modifier.build() // Get the component instance
      const gridComponent = new EnhancedGrid({ children: [textChild] }, [
        textChild,
      ])
      const elements = gridComponent.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('div')
      expect(elements[0].props?.className).toContain('tachui-grid')
      expect(elements[0].props?.style?.display).toBe('grid')
    })

    it('should apply spacing correctly', () => {
      const gridComponent = new EnhancedGrid({ spacing: 20 })
      const elements = gridComponent.render()

      expect(elements[0].props?.style?.gap).toBe('20px')
    })

    it('should apply alignment correctly', () => {
      const gridComponent = new EnhancedGrid({ alignment: 'topLeading' })
      const elements = gridComponent.render()

      expect(elements[0].props?.style?.justifyItems).toBe('start')
      expect(elements[0].props?.style?.alignItems).toBe('start')
    })
  })
})

describe('GridRow', () => {
  describe('Basic Functionality', () => {
    it('should create grid row component', () => {
      const textChildren = [Text('Item 1'), Text('Item 2')]
      const gridRow = GridRow(textChildren)
      expect(gridRow).toBeDefined()
      expect(gridRow.modifier).toBeDefined()
    })

    it('should render with display contents for transparent grid row', () => {
      const textChildren = [
        Text('A').modifier.build(),
        Text('B').modifier.build(),
      ]
      const gridRowComponent = new EnhancedGridRow(
        { children: textChildren },
        textChildren
      )
      const elements = gridRowComponent.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('div')
      expect(elements[0].props?.className).toContain('tachui-gridrow')
      expect(elements[0].props?.style?.display).toBe('contents')
    })
  })
})

describe('LazyVGrid', () => {
  describe('Basic Functionality', () => {
    it('should create vertical grid component', () => {
      const columns = [GridItem.flexible(), GridItem.flexible()]
      const textChildren = [Text('1'), Text('2'), Text('3'), Text('4')]
      const vgrid = LazyVGrid({ columns, children: textChildren })

      expect(vgrid).toBeDefined()
      expect(vgrid.modifier).toBeDefined()
    })

    it('should render with grid-template-columns', () => {
      const columns = [GridItem.fixed(100), GridItem.flexible()]
      const textChildren = [Text('Test').modifier.build()]
      const vgridComponent = new EnhancedLazyVGrid(
        { columns, children: textChildren },
        textChildren
      )
      const elements = vgridComponent.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toContain('tachui-lazy-vgrid')
      expect(elements[0].props?.style?.display).toBe('grid')
      expect(elements[0].props?.style?.gridTemplateColumns).toBe('100px 1fr')
    })

    it('should handle responsive columns configuration', () => {
      const responsiveColumns: ResponsiveGridItemConfig = {
        base: [GridItem.flexible()],
        md: [GridItem.flexible(), GridItem.flexible()],
      }
      const textChildren = [Text('Test').modifier.build()]
      const vgridComponent = new EnhancedLazyVGrid(
        { columns: responsiveColumns, children: textChildren },
        textChildren
      )
      const elements = vgridComponent.render()

      // Should use base configuration by default
      expect(elements[0].props?.style?.gridTemplateColumns).toBe('1fr')
    })
  })
})

describe('LazyHGrid', () => {
  describe('Basic Functionality', () => {
    it('should create horizontal grid component', () => {
      const rows = [GridItem.adaptive(100)]
      const textChildren = [Text('1'), Text('2'), Text('3')]
      const hgrid = LazyHGrid({ rows, children: textChildren })

      expect(hgrid).toBeDefined()
      expect(hgrid.modifier).toBeDefined()
    })

    it('should render with grid-template-rows and horizontal flow', () => {
      const rows = [GridItem.fixed(80), GridItem.flexible()]
      const textChildren = [Text('Test').modifier.build()]
      const hgridComponent = new EnhancedLazyHGrid(
        { rows, children: textChildren },
        textChildren
      )
      const elements = hgridComponent.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toContain('tachui-lazy-hgrid')
      expect(elements[0].props?.style?.display).toBe('grid')
      expect(elements[0].props?.style?.gridTemplateRows).toBe('80px 1fr')
      expect(elements[0].props?.style?.gridAutoFlow).toBe('column')
      expect(elements[0].props?.style?.overflowX).toBe('auto')
    })
  })
})

describe('Integration Tests', () => {
  it('should create complex grid layout with Grid and GridRow', () => {
    const gridRowChildren1 = [
      Text('A1').modifier.build(),
      Text('B1').modifier.build(),
      Text('C1').modifier.build(),
    ]
    const gridRowChildren2 = [
      Text('A2').modifier.build(),
      Text('B2').modifier.build(),
      Text('C2').modifier.build(),
    ]
    const gridRow1 = new EnhancedGridRow(
      { children: gridRowChildren1 },
      gridRowChildren1
    )
    const gridRow2 = new EnhancedGridRow(
      { children: gridRowChildren2 },
      gridRowChildren2
    )

    const gridComponent = new EnhancedGrid(
      {
        spacing: 16,
        alignment: 'center',
        children: [gridRow1, gridRow2],
      },
      [gridRow1, gridRow2]
    )

    const elements = gridComponent.render()

    expect(elements[0].props?.style?.display).toBe('grid')
    expect(elements[0].props?.style?.gap).toBe('16px')
    expect(elements[0].children).toHaveLength(2) // Two GridRow children
  })

  it('should create responsive LazyVGrid', () => {
    const responsiveColumns: ResponsiveGridItemConfig = {
      base: [GridItem.flexible()],
      sm: [GridItem.flexible(), GridItem.flexible()],
      lg: Array(3).fill(GridItem.flexible()),
    }

    const items = Array.from({ length: 6 }, (_, i) =>
      Text(`Item ${i + 1}`).modifier.build()
    )
    const vgridComponent = new EnhancedLazyVGrid(
      {
        columns: responsiveColumns,
        spacing: { horizontal: 16, vertical: 12 },
        alignment: 'topLeading',
        children: items,
      },
      items
    )

    const elements = vgridComponent.render()

    expect(elements[0].props?.style?.gap).toBe('12px 16px')
    expect(elements[0].props?.style?.justifyItems).toBe('start')
    expect(elements[0].props?.style?.alignItems).toBe('start')
  })
})
