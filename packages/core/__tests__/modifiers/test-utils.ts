/**
 * Test utilities for modifier tests
 */

import { vi } from 'vitest'
import type { DOMNode } from '../../runtime/types'
import type { ModifierContext } from '../types'

/**
 * Create a mock HTML element with proper style handling
 */
export function createMockElement() {
  const styleProperties: Record<string, string> = {}
  const propertyPriorities: Record<string, string> = {}

  const mockStyle = {
    setProperty: vi.fn((property: string, value: string, priority?: string) => {
      // Convert kebab-case to camelCase for CSS properties
      const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      styleProperties[camelCase] = value
      ;(mockStyle as any)[camelCase] = value
      
      // Track priority separately
      if (priority === 'important') {
        propertyPriorities[property] = 'important'
      } else {
        delete propertyPriorities[property]
      }
    }),
    removeProperty: vi.fn((property: string) => {
      const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      delete styleProperties[camelCase]
      ;(mockStyle as any)[camelCase] = ''
      delete propertyPriorities[property]
    }),
    getPropertyValue: vi.fn((property: string) => {
      const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
      return styleProperties[camelCase] || ''
    }),
    getPropertyPriority: vi.fn((property: string) => {
      return propertyPriorities[property] || ''
    }),
    // Common CSS properties
    width: '',
    height: '',
    minWidth: '',
    maxWidth: '',
    minHeight: '',
    maxHeight: '',
    color: '',
    fontSize: '',
    fontWeight: '',
    fontFamily: '',
    backgroundColor: '',
    margin: '',
    marginTop: '',
    marginRight: '',
    marginBottom: '',
    marginLeft: '',
    padding: '',
    paddingTop: '',
    paddingRight: '',
    paddingBottom: '',
    paddingLeft: '',
    borderRadius: '',
    borderWidth: '',
    borderColor: '',
    borderStyle: '',
    opacity: '',
    display: '',
    flexGrow: '',
    flexShrink: '',
    flexBasis: '',
    alignSelf: '',
    justifyContent: '',
    alignItems: '',
    gap: '',
    cursor: '',
    position: '',
    zIndex: '',
    overflow: '',
    overflowX: '',
    overflowY: '',
    textAlign: '',
    textTransform: '',
    letterSpacing: '',
    lineHeight: '',
    // Enhanced modifier properties
    borderTopLeftRadius: '',
    borderTopRightRadius: '',
    borderBottomLeftRadius: '',
    borderBottomRightRadius: '',
    borderTopWidth: '',
    borderTopStyle: '',
    borderTopColor: '',
    borderRightWidth: '',
    borderRightStyle: '',
    borderRightColor: '',
    borderBottomWidth: '',
    borderBottomStyle: '',
    borderBottomColor: '',
    borderLeftWidth: '',
    borderLeftStyle: '',
    borderLeftColor: '',
    borderImage: '',
    boxShadow: '',
    textShadow: '',
    scrollBehavior: '',
    scrollMargin: '',
    scrollMarginTop: '',
    scrollMarginRight: '',
    scrollMarginBottom: '',
    scrollMarginLeft: '',
    scrollPadding: '',
    scrollPaddingTop: '',
    scrollPaddingRight: '',
    scrollPaddingBottom: '',
    scrollPaddingLeft: '',
    scrollSnapType: '',
    scrollSnapAlign: '',
    scrollSnapStop: '',
    overscrollBehavior: '',
    overscrollBehaviorX: '',
    overscrollBehaviorY: '',
    // CSS Features properties
    transform: '',
    transformOrigin: '',
    transformStyle: '',
    backfaceVisibility: '',
    perspective: '',
    transition: '',
    backdropFilter: '',
    webkitBackdropFilter: '',
    filter: '',
    // Background clip properties
    backgroundImage: '',
    backgroundClip: '',
    webkitBackgroundClip: '',
    webkitTextFillColor: '',
    // Advanced transform properties
    perspectiveOrigin: '',
    // Grid layout properties (Phase 3)
    gridColumn: '',
    gridRow: '',
    gridArea: '',
    justifySelf: '',
    gridColumnStart: '',
    gridRowStart: '',
  }

  // Sync properties with the style object
  Object.defineProperty(mockStyle, 'setProperty', {
    value: vi.fn((property: string, value: string, priority?: string) => {
      // Handle CSS custom properties (-- properties) directly
      if (property.startsWith('--')) {
        styleProperties[property] = value
        ;(mockStyle as any)[property] = value
      } else {
        const camelCase = property.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
        styleProperties[camelCase] = value
        ;(mockStyle as any)[camelCase] = value
      }
      
      // Track priority separately
      if (priority === 'important') {
        propertyPriorities[property] = 'important'
      } else {
        delete propertyPriorities[property]
      }
    }),
    writable: true,
  })

  const mockElement = {
    style: mockStyle,
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      contains: vi.fn(),
      toggle: vi.fn(),
    },
    setAttribute: vi.fn(),
    removeAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLElement

  return mockElement
}

/**
 * Create a mock DOM node for testing
 */
export function createMockDOMNode(element: HTMLElement): DOMNode {
  return {
    type: 'element',
    tag: 'div',
    props: {},
    element: element,
  }
}

/**
 * Create a mock modifier context for testing
 */
export function createMockModifierContext(element: HTMLElement): ModifierContext {
  return {
    componentId: 'test-component',
    element: element,
    phase: 'creation',
  }
}

/**
 * Test setup function that creates all necessary mocks
 */
export function setupModifierTest() {
  const mockElement = createMockElement()
  const mockNode = createMockDOMNode(mockElement)
  const mockContext = createMockModifierContext(mockElement)

  return {
    mockElement,
    mockNode,
    mockContext,
  }
}
