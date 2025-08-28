/**
 * Navigation Modifiers Tests
 * 
 * Tests for SwiftUI-compatible navigation modifiers
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { HTML, Text } from '../../core/src'
import {
  navigationTitle,
  navigationBarTitleDisplayMode,
  navigationBarHidden,
  navigationBarBackButtonHidden,
  navigationBarBackButtonTitle,
  navigationBarItems,
  toolbarBackground,
  toolbarForegroundColor,
  extractNavigationModifiers,
  getCurrentNavigationModifiers,
  hasNavigationModifiers,
  clearNavigationModifiers,
  enhanceNavigationStackWithModifiers,
  onNavigationModifierChange,
  NavigationModifierUtils
} from '../src/navigation-modifiers'

describe('Navigation Modifiers - SwiftUI Compatible Modifiers', () => {
  let mockComponent: any
  
  beforeEach(() => {
    mockComponent = HTML.div({ children: 'Base Component' }).modifier.build()
  })

  describe('Basic Navigation Modifiers', () => {
    it('applies navigationTitle modifier', () => {
      const titled = navigationTitle(mockComponent, 'My Title')
      
      expect(titled).toBeDefined()
      expect((titled as any)._navigationModifiers).toBeDefined()
      expect((titled as any)._navigationModifiers.title).toBe('My Title')
    })

    it('applies navigationBarTitleDisplayMode modifier', () => {
      const displayMode = navigationBarTitleDisplayMode(mockComponent, 'large')
      
      expect(displayMode).toBeDefined()
      expect((displayMode as any)._navigationModifiers.titleDisplayMode).toBe('large')
    })

    it('applies navigationBarHidden modifier', () => {
      const hidden = navigationBarHidden(mockComponent, true)
      
      expect(hidden).toBeDefined()
      expect((hidden as any)._navigationModifiers.barHidden).toBe(true)
    })

    it('applies navigationBarBackButtonHidden modifier', () => {
      const backHidden = navigationBarBackButtonHidden(mockComponent, true)
      
      expect(backHidden).toBeDefined()
      expect((backHidden as any)._navigationModifiers.backButtonHidden).toBe(true)
    })

    it('applies navigationBarBackButtonTitle modifier', () => {
      const backTitle = navigationBarBackButtonTitle(mockComponent, 'Custom Back')
      
      expect(backTitle).toBeDefined()
      expect((backTitle as any)._navigationModifiers.backButtonTitle).toBe('Custom Back')
    })
  })

  describe('Toolbar Modifiers', () => {
    it('applies toolbarBackground modifier', () => {
      const bgColor = toolbarBackground(mockComponent, '#007AFF')
      
      expect(bgColor).toBeDefined()
      expect((bgColor as any)._navigationModifiers.toolbarBackground).toBe('#007AFF')
    })

    it('applies toolbarForegroundColor modifier', () => {
      const fgColor = toolbarForegroundColor(mockComponent, '#FFFFFF')
      
      expect(fgColor).toBeDefined()
      expect((fgColor as any)._navigationModifiers.foregroundColor).toBe('#FFFFFF')
    })

    it('applies navigationBarItems modifier', () => {
      const leadingItem = HTML.button({ children: 'Edit' }).modifier.build()
      const trailingItem = HTML.button({ children: 'Save' }).modifier.build()
      
      const withItems = navigationBarItems(mockComponent, {
        leading: leadingItem,
        trailing: trailingItem
      })
      
      expect(withItems).toBeDefined()
      expect((withItems as any)._navigationModifiers.leadingItems).toBeDefined()
      expect((withItems as any)._navigationModifiers.trailingItems).toBeDefined()
    })
  })

  describe('Modifier Chaining', () => {
    it('chains multiple navigation modifiers', () => {
      const chained = toolbarForegroundColor(
        toolbarBackground(
          navigationBarTitleDisplayMode(
            navigationTitle(mockComponent, 'Chained Title'),
            'large'
          ),
          '#007AFF'
        ),
        '#FFFFFF'
      )
      
      const modifiers = (chained as any)._navigationModifiers
      
      expect(modifiers.title).toBe('Chained Title')
      expect(modifiers.titleDisplayMode).toBe('large')
      expect(modifiers.toolbarBackground).toBe('#007AFF')
      expect(modifiers.foregroundColor).toBe('#FFFFFF')
    })

    it('preserves existing modifiers when adding new ones', () => {
      const step1 = navigationTitle(mockComponent, 'Initial Title')
      const step2 = navigationBarHidden(step1, true)
      const step3 = toolbarBackground(step2, '#FF0000')
      
      const modifiers = (step3 as any)._navigationModifiers
      
      expect(modifiers.title).toBe('Initial Title')
      expect(modifiers.barHidden).toBe(true)
      expect(modifiers.toolbarBackground).toBe('#FF0000')
    })

    it('overwrites same modifier type', () => {
      const step1 = navigationTitle(mockComponent, 'First Title')
      const step2 = navigationTitle(step1, 'Second Title')
      
      const modifiers = (step2 as any)._navigationModifiers
      
      expect(modifiers.title).toBe('Second Title')
    })
  })

  describe('SwiftUI Compatibility', () => {
    it('matches SwiftUI modifier chaining syntax', () => {
      // SwiftUI: view.navigationTitle("Title").navigationBarTitleDisplayMode(.large)
      const swiftUIStyled = navigationBarTitleDisplayMode(
        navigationTitle(mockComponent, 'SwiftUI Style'),
        'large'
      )
      
      expect(swiftUIStyled).toBeDefined()
    })

    it('supports SwiftUI display mode values', () => {
      const comp1 = HTML.div({ children: 'Test1' }).modifier.build()
      const comp2 = HTML.div({ children: 'Test2' }).modifier.build()
      const comp3 = HTML.div({ children: 'Test3' }).modifier.build()
      
      const automatic = navigationBarTitleDisplayMode(comp1, 'automatic')
      const inline = navigationBarTitleDisplayMode(comp2, 'inline')
      const large = navigationBarTitleDisplayMode(comp3, 'large')
      
      expect((automatic as any)._navigationModifiers.titleDisplayMode).toBe('automatic')
      expect((inline as any)._navigationModifiers.titleDisplayMode).toBe('inline')
      expect((large as any)._navigationModifiers.titleDisplayMode).toBe('large')
    })

    it('supports SwiftUI toolbar item placement', () => {
      const editButton = HTML.button({ children: 'Edit' }).modifier.build()
      const doneButton = HTML.button({ children: 'Done' }).modifier.build()
      const addButton = HTML.button({ children: '+' }).modifier.build()
      
      const withToolbarItems = navigationBarItems(mockComponent, {
        leading: editButton,
        trailing: [doneButton, addButton]
      })
      
      expect(withToolbarItems).toBeDefined()
      expect((withToolbarItems as any)._navigationModifiers.leadingItems).toHaveLength(1)
      expect((withToolbarItems as any)._navigationModifiers.trailingItems).toHaveLength(2)
    })
  })

  describe('Modifier Utilities', () => {
    it('extracts navigation modifiers from component', () => {
      const modified = navigationTitle(
        navigationBarHidden(mockComponent, true),
        'Extracted Title'
      )
      
      const extracted = extractNavigationModifiers(modified)
      
      expect(extracted).toBeDefined()
      expect(extracted.title).toBe('Extracted Title')
      expect(extracted.barHidden).toBe(true)
    })

    it('gets current navigation modifiers', () => {
      const current = getCurrentNavigationModifiers()
      
      expect(current).toBeDefined()
      expect(typeof current).toBe('object')
    })

    it('checks if component has navigation modifiers', () => {
      const unmodified = HTML.div({ children: 'Unmodified' }).modifier.build()
      const modified = navigationTitle(HTML.div({ children: 'Modified' }).modifier.build(), 'Has Modifiers')
      
      expect(hasNavigationModifiers(unmodified)).toBe(false)
      expect(hasNavigationModifiers(modified)).toBe(true)
    })
  })

  describe('NavigationStack Integration', () => {
    it('enhances NavigationStack with modifiers', () => {
      const mockNavStack = HTML.div({ children: 'Nav Stack' }).modifier.build()
      
      const enhanced = enhanceNavigationStackWithModifiers(mockNavStack)
      
      expect(enhanced).toBeDefined()
      expect((enhanced as any)._modifierCleanup).toBeDefined()
    })
  })

  describe('Modifier Change Events', () => {
    it('registers navigation modifier change listeners', () => {
      let changeCount = 0
      const listener = () => { changeCount++ }
      
      const unregister = onNavigationModifierChange(listener)
      
      expect(typeof unregister).toBe('function')
      
      // Cleanup
      unregister()
    })

    it('unregisters navigation modifier change listeners', () => {
      let changeCount = 0
      const listener = () => { changeCount++ }
      
      const unregister = onNavigationModifierChange(listener)
      unregister()
      
      expect(changeCount).toBe(0)
    })
  })

  describe('Navigation Modifier Utils', () => {
    it('provides navigation modifier utilities', () => {
      expect(NavigationModifierUtils).toBeDefined()
      expect(typeof NavigationModifierUtils.createScope).toBe('function')
      expect(typeof NavigationModifierUtils.mergeConfigs).toBe('function')
      expect(typeof NavigationModifierUtils.isEmpty).toBe('function')
    })

    it('creates modifier scopes', () => {
      const scope = NavigationModifierUtils.createScope()
      
      expect(scope.push).toBeDefined()
      expect(scope.pop).toBeDefined()
      expect(scope.current).toBeDefined()
    })

    it('merges modifier configurations', () => {
      const config1 = { title: 'Title 1', barHidden: true }
      const config2 = { titleDisplayMode: 'large' as const }
      
      const merged = NavigationModifierUtils.mergeConfigs(config1, config2)
      
      expect(merged.title).toBe('Title 1')
      expect(merged.barHidden).toBe(true)
      expect(merged.titleDisplayMode).toBe('large')
    })

    it('checks if configuration is empty', () => {
      const empty = {}
      const notEmpty = { title: 'Test' }
      
      expect(NavigationModifierUtils.isEmpty(empty)).toBe(true)
      expect(NavigationModifierUtils.isEmpty(notEmpty)).toBe(false)
    })
  })

  describe('Error Handling', () => {
    it('handles null component gracefully', () => {
      expect(() => {
        navigationTitle(null as any, 'Null Component')
      }).toThrow() // The implementation should throw for null components
    })

    it('handles invalid modifier values gracefully', () => {
      const modified = navigationTitle(mockComponent, '' as any)
      
      expect(modified).toBeDefined()
      expect((modified as any)._navigationModifiers.title).toBe('')
    })
  })

  describe('Performance', () => {
    it('applies modifiers efficiently', () => {
      const startTime = performance.now()
      
      let current = mockComponent
      for (let i = 0; i < 100; i++) {
        current = navigationTitle(HTML.div({ children: `Test ${i}` }).modifier.build(), `Title ${i}`)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200) // Relaxed threshold
    })

    it('handles complex modifier chains efficiently', () => {
      const startTime = performance.now()
      
      const complex = toolbarForegroundColor(
        toolbarBackground(
          navigationBarItems(mockComponent, {
            leading: HTML.button({ children: 'L1' }).modifier.build(),
            trailing: [
              HTML.button({ children: 'T1' }).modifier.build(),
              HTML.button({ children: 'T2' }).modifier.build(),
              HTML.button({ children: 'T3' }).modifier.build()
            ]
          }),
          '#007AFF'
        ),
        '#FFFFFF'
      )
      
      const endTime = performance.now()
      
      expect(complex).toBeDefined()
      expect(endTime - startTime).toBeLessThan(50)
    })
  })

  describe('Integration with Components', () => {
    it('works with Text components', () => {
      const textComponent = Text('Navigation Text')
      const titledText = navigationTitle(textComponent, 'Text Title')
      
      expect(titledText).toBeDefined()
      expect((titledText as any)._navigationModifiers.title).toBe('Text Title')
    })

    it('works with complex nested components', () => {
      const nestedComponent = HTML.div({
        children: [
          Text('Header'),
          HTML.div({
            children: [
              Text('Nested content'),
              HTML.button({ children: 'Button' }).modifier.build()
            ]
          }).modifier.build()
        ]
      }).modifier.build()
      
      const modifiedNested = navigationTitle(nestedComponent, 'Nested Title')
      
      expect(modifiedNested).toBeDefined()
      expect((modifiedNested as any)._navigationModifiers.title).toBe('Nested Title')
    })
  })
})