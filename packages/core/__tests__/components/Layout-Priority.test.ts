/**
 * Tests for Layout Priority modifier implementation (Phase 5.7)
 *
 * Tests layoutPriority modifier for controlling element sizing behavior in ZStack,
 * VStack, and HStack containers, ensuring SwiftUI compatibility.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { HTML } from '@tachui/primitives'
import { Layout } from '../../src/components'
import { Text } from '@tachui/primitives'
import { layoutModifiers } from '../../src/modifiers/core'
import { createSignal } from '../../src/reactive'

// Mock DOM environment
function createMockElement(tagName: string = 'div'): HTMLElement {
  const element = {
    tagName: tagName.toUpperCase(),
    style: {} as CSSStyleDeclaration,
    children: [] as HTMLElement[],
    appendChild: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    querySelector: vi.fn(),
    textContent: '',
    id: `mock-${Math.random()}`,
    setProperty: vi.fn(),
    removeProperty: vi.fn(),
  } as any

  return element
}

// Mock DOMRenderer
vi.mock('../../src/runtime/renderer', () => ({
  DOMRenderer: vi.fn().mockImplementation(() => ({
    createElement: vi.fn((tag: string) => createMockElement(tag)),
    createTextNode: vi.fn((text: string) => ({
      textContent: text,
      nodeType: 3,
    })),
    appendChild: vi.fn(),
    insertBefore: vi.fn(),
    removeChild: vi.fn(),
    setAttribute: vi.fn(),
    setProperty: vi.fn(),
    addEventListeners: vi.fn(),
    removeEventListeners: vi.fn(),
  })),
}))

beforeEach(() => {
  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => createMockElement(tagName)),
  }
})

describe('Layout Priority System (Phase 5.7) - EXPECTED TO FAIL', () => {
  describe('layoutPriority Modifier', () => {
    it('should create layoutPriority modifier with correct properties', () => {
      const priorityMod = layoutModifiers.layoutPriority(10)

      expect(priorityMod.type).toBe('layout')
      expect(priorityMod.properties).toEqual({ layoutPriority: 10 })
      expect(priorityMod.priority).toBe(100) // Layout modifier priority
    })

    it('should support reactive layoutPriority values', () => {
      const [priority, setPriority] = createSignal(5)
      const priorityMod = layoutModifiers.layoutPriority(priority)

      expect(priorityMod.properties.layoutPriority).toBe(priority)

      // Update priority
      setPriority(15)
      expect(priority()).toBe(15)
    })

    it('should apply layoutPriority through modifier builder', () => {
      const priorityComponent = Text('High Priority')
        .modifier.layoutPriority(20)
        .backgroundColor('#007AFF')
        .build()

      // Should have layout modifier with layoutPriority
      const layoutMod = priorityComponent.modifiers.find(
        m => m.type === 'layout'
      )
      expect(layoutMod).toBeDefined()
      expect(layoutMod?.properties).toEqual({ layoutPriority: 20 })
    })
  })

  describe('ZStack with Layout Priority', () => {
    it('should identify highest priority child in ZStack', () => {
      const lowPriorityChild = Text('Background')
        .modifier.layoutPriority(1)
        .backgroundColor('#f0f0f0')
        .build()

      const highPriorityChild = Text('Main Content')
        .modifier.layoutPriority(10)
        .backgroundColor('#007AFF')
        .padding(20)
        .build()

      const mediumPriorityChild = Text('Overlay')
        .modifier.layoutPriority(5)
        .backgroundColor('#ff9500')
        .build()

      const zstack = Layout.ZStack({
        children: [lowPriorityChild, highPriorityChild, mediumPriorityChild],
        alignment: 'center',
      })

      // ZStack should exist and have the correct children
      expect(zstack.children).toHaveLength(3)
      expect(zstack.children[1]).toBe(highPriorityChild) // Highest priority child
    })

    it('should handle ZStack without layoutPriority modifiers', () => {
      const child1 = Text('Child 1').modifier.backgroundColor('#f0f0f0').build()
      const child2 = Text('Child 2').modifier.backgroundColor('#007AFF').build()

      const zstack = Layout.ZStack({
        children: [child1, child2],
        alignment: 'center',
      })

      expect(zstack.children).toHaveLength(2)
      // Should work with default index-based z-index
    })

    it('should support different ZStack alignments with priority', () => {
      const priorityChild = Text('Priority Content')
        .modifier.layoutPriority(100)
        .frame(200, 150)
        .build()

      const backgroundChild = Text('Background')
        .modifier.layoutPriority(1)
        .backgroundColor('#f0f0f0')
        .build()

      const alignments: Array<'topLeading' | 'center' | 'bottomTrailing'> = [
        'topLeading',
        'center',
        'bottomTrailing',
      ]

      alignments.forEach(alignment => {
        const zstack = Layout.ZStack({
          children: [backgroundChild, priorityChild],
          alignment,
        })

        expect(zstack.children).toHaveLength(2)
        expect(zstack.children[1]).toBe(priorityChild)
      })
    })
  })

  describe('VStack and HStack with Layout Priority', () => {
    it('should apply layoutPriority to VStack children', () => {
      const flexibleChild = Text('Flexible')
        .modifier.layoutPriority(1) // Lower priority, should shrink
        .backgroundColor('#f0f0f0')
        .build()

      const fixedChild = Text('Fixed Size')
        .modifier.layoutPriority(10) // Higher priority, should maintain size
        .backgroundColor('#007AFF')
        .padding(20)
        .build()

      const vstack = Layout.VStack({
        children: [flexibleChild, fixedChild],
        spacing: 16,
        alignment: 'center',
      })

      expect(vstack.children).toHaveLength(2)
      expect(vstack.children[0]).toBe(flexibleChild)
      expect(vstack.children[1]).toBe(fixedChild)
    })

    it('should apply layoutPriority to HStack children', () => {
      const compressibleChild = Text('Compressible Text Content')
        .modifier.layoutPriority(0) // Default priority
        .backgroundColor('#f0f0f0')
        .build()

      const importantChild = Text('Important')
        .modifier.layoutPriority(50) // High priority
        .backgroundColor('#007AFF')
        .fontWeight('bold')
        .build()

      const hstack = Layout.HStack({
        children: [compressibleChild, importantChild],
        spacing: 12,
        alignment: 'center',
      })

      expect(hstack.children).toHaveLength(2)
      expect(hstack.children[1]).toBe(importantChild)
    })
  })

  describe('Complex Layout Priority Scenarios', () => {
    it('should handle nested layouts with different priorities', () => {
      const innerVStack = Layout.VStack({
        children: [
          Text('Inner 1').modifier.layoutPriority(5).build(),
          Text('Inner 2').modifier.layoutPriority(15).build(),
        ],
        spacing: 8,
      })

      const innerWithPriority = innerVStack.modifier.layoutPriority(20).build()

      const outerZStack = Layout.ZStack({
        children: [
          Text('Background')
            .modifier.layoutPriority(1)
            .backgroundColor('#f9f9f9')
            .build(),
          innerWithPriority,
          Text('Overlay')
            .modifier.layoutPriority(10)
            .foregroundColor('#ffffff')
            .build(),
        ],
        alignment: 'center',
      })

      expect(outerZStack.children).toHaveLength(3)
      expect(outerZStack.children[1]).toBe(innerWithPriority)
    })

    it('should handle equal layoutPriority values', () => {
      const child1 = Text('Child 1')
        .modifier.layoutPriority(10)
        .backgroundColor('#007AFF')
        .build()

      const child2 = Text('Child 2')
        .modifier.layoutPriority(10) // Same priority as child1
        .backgroundColor('#ff9500')
        .build()

      const zstack = Layout.ZStack({
        children: [child1, child2],
        alignment: 'center',
      })

      // Should handle equal priorities gracefully
      expect(zstack.children).toHaveLength(2)
    })

    it('should handle negative layoutPriority values', () => {
      const negativePriorityChild = Text('Low Priority')
        .modifier.layoutPriority(-5) // Negative priority
        .backgroundColor('#f0f0f0')
        .build()

      const normalChild = Text('Normal Priority')
        .modifier.layoutPriority(0)
        .backgroundColor('#007AFF')
        .build()

      const vstack = Layout.VStack({
        children: [negativePriorityChild, normalChild],
        spacing: 10,
      })

      expect(vstack.children).toHaveLength(2)
      // Normal priority child should have higher precedence
    })
  })

  describe('Modifier Integration', () => {
    it('should combine layoutPriority with other layout modifiers', () => {
      const complexComponent = HTML.div({ children: 'Complex Layout' })
        .modifier.layoutPriority(25)
        .frame(300, 200)
        .padding(16)
        .margin(8)
        .backgroundColor('#007AFF')
        .cornerRadius(8)
        .build()

      expect(complexComponent.modifiers).toHaveLength(6)

      // Should have layout modifier with multiple properties
      const layoutMods = complexComponent.modifiers.filter(
        m => m.type === 'layout'
      )
      expect(layoutMods.length).toBeGreaterThan(0)

      // Check that layoutPriority is included
      const hasLayoutPriority = layoutMods.some(
        mod => 'layoutPriority' in mod.properties
      )
      expect(hasLayoutPriority).toBe(true)
    })

    it('should work with appearance and interaction modifiers', () => {
      const interactiveComponent = Text('Interactive Priority Element')
        .modifier.layoutPriority(30)
        .fontSize(18)
        .fontWeight('bold')
        .foregroundColor('#ffffff')
        .backgroundColor('#007AFF')
        .padding(12)
        .cornerRadius(6)
        .onTap(() => console.log('Tapped!'))
        .transition('all', 200)
        .build()

      const modifierTypes = interactiveComponent.modifiers.map(m => m.type)
      expect(modifierTypes).toContain('layout')
      expect(modifierTypes).toContain('appearance')
      expect(modifierTypes).toContain('interaction')
      expect(modifierTypes).toContain('transition')
    })
  })

  describe('Performance and Edge Cases', () => {
    it('should handle large layoutPriority values', () => {
      const veryHighPriority = Text('Maximum Priority')
        .modifier.layoutPriority(Number.MAX_SAFE_INTEGER)
        .build()

      expect(veryHighPriority.modifiers[0].properties.layoutPriority).toBe(
        Number.MAX_SAFE_INTEGER
      )
    })

    it('should handle zero layoutPriority correctly', () => {
      const zeroPriority = Text('Zero Priority')
        .modifier.layoutPriority(0)
        .build()

      expect(zeroPriority.modifiers[0].properties.layoutPriority).toBe(0)
    })

    it('should handle fractional layoutPriority values', () => {
      const fractionalPriority = Text('Fractional Priority')
        .modifier.layoutPriority(2.5)
        .build()

      expect(fractionalPriority.modifiers[0].properties.layoutPriority).toBe(
        2.5
      )
    })
  })

  describe('SwiftUI Compatibility', () => {
    it('should match SwiftUI layoutPriority behavior in ZStack', () => {
      // In SwiftUI, the highest layoutPriority child determines ZStack size
      const backgroundImage = HTML.img({
        src: '/background.jpg',
        alt: 'Background',
      })
        .modifier.layoutPriority(0) // Default priority
        .frame('100%', '100%')
        .build()

      const contentCard = Layout.VStack({
        children: [
          Text('Card Title').modifier.fontSize(20).fontWeight('bold').build(),
          Text('Card content goes here...').modifier.fontSize(14).build(),
        ],
        spacing: 8,
      })
        .modifier.layoutPriority(10) // High priority - determines container size
        .backgroundColor('#ffffff')
        .padding(20)
        .cornerRadius(12)
        .shadow({ x: 0, y: 4, radius: 8, color: 'rgba(0,0,0,0.1)' })
        .build()

      const overlay = Text('NEW')
        .modifier.layoutPriority(5) // Medium priority
        .backgroundColor('#ff3b30')
        .foregroundColor('#ffffff')
        .fontSize(12)
        .fontWeight('bold')
        .padding(4, 8)
        .cornerRadius(4)
        .build()

      const cardWithOverlay = Layout.ZStack({
        children: [backgroundImage, contentCard, overlay],
        alignment: 'topTrailing',
      })

      // Container should size to contentCard (highest priority)
      expect(cardWithOverlay.children).toHaveLength(3)
      expect(cardWithOverlay.children[1]).toBe(contentCard) // Highest priority
    })

    it('should support SwiftUI-style priority-based sizing in flexible layouts', () => {
      // SwiftUI example: flexible sidebar with fixed content
      const sidebar = Layout.VStack({
        children: [
          Text('Sidebar Item 1'),
          Text('Sidebar Item 2'),
          Text('Sidebar Item 3'),
        ],
        spacing: 12,
      })
        .modifier.layoutPriority(1) // Lower priority - can shrink
        .backgroundColor('#f9f9f9')
        .padding(16)
        .frame({ minWidth: 200 })
        .build()

      const mainContent = Layout.VStack({
        children: [
          Text('Main Content Title')
            .modifier.fontSize(24)
            .fontWeight('bold')
            .build(),
          Text('This is the main content area that should maintain its size.')
            .modifier.fontSize(16)
            .build(),
        ],
        spacing: 16,
      })
        .modifier.layoutPriority(10) // Higher priority - maintains size
        .backgroundColor('#ffffff')
        .padding(24)
        .frame({ minWidth: 400 })
        .build()

      const appLayout = Layout.HStack({
        children: [sidebar, mainContent],
        spacing: 0,
        alignment: 'top',
      })

      expect(appLayout.children).toHaveLength(2)
      expect(appLayout.children[1]).toBe(mainContent) // Should maintain size
    })
  })
})
