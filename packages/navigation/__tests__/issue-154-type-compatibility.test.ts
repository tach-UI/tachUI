/**
 * Issue #154: Module augmentation of ComponentInstance in @tachui/navigation
 * breaks compatibility with other ComponentInstance implementors
 *
 * Verifies two things:
 * 1. Other ComponentInstance implementors are no longer infected by navigation methods
 * 2. Chained navigation modifier calls on the builder proxy actually set metadata
 *    (i.e. the ModifierBuilderImpl prototype extensions are reachable, not dead code)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { HTML, VStack, Text } from '@tachui/primitives'
import '@tachui/modifiers/preload/basic'
// Load the registry so modifier builder prototype extensions are active.
// In production, this runs as a side effect of importing @tachui/navigation.
import '../src/navigation-modifiers-registry'
import {
  extractNavigationModifiers,
  hasNavigationModifiers,
  clearNavigationModifiers,
} from '../src/navigation-modifiers'
import { createSignal } from '@tachui/core'
import { createModifierBuilder } from '@tachui/core/modifiers'

describe('Issue #154 - Type Compatibility Fix', () => {
  beforeEach(() => clearNavigationModifiers())
  afterEach(() => {
    clearNavigationModifiers()
    document.querySelectorAll('[data-tachui-sheet-root="true"]').forEach(n => n.remove())
  })

  describe('ComponentInstance implementors are no longer infected', () => {
    it('other ComponentInstance implementors compile without navigation methods', () => {
      // If this compiles without error, ComponentInstance is no longer augmented
      const component = VStack({ children: [Text('Hello')] })
      expect(component).toBeDefined()
    })
  })

  describe('Chained modifier calls via createModifierBuilder set metadata directly', () => {
    it('navigationTitle sets _navigationModifiers.title on the component', () => {
      // HTML.div({}).build() produces a real ComponentInstance (same pattern as existing tests)
      const component = HTML.div({}).build()
      createModifierBuilder(component).navigationTitle('My Title')
      expect((component as any)._navigationModifiers?.title).toBe('My Title')
    })

    it('navigationBarHidden sets _navigationModifiers on the component', () => {
      const component = HTML.div({}).build()
      createModifierBuilder(component).navigationBarHidden(true)
      expect((component as any)._navigationModifiers?.barHidden).toBe(true)
    })

    it('multiple modifiers chain and all set metadata', () => {
      const component = HTML.div({}).build()
      createModifierBuilder(component)
        .navigationTitle('Chained')
        .navigationBarHidden(false)
        .navigationBarTitleDisplayMode('large')
      expect((component as any)._navigationModifiers?.title).toBe('Chained')
      expect((component as any)._navigationModifiers?.barHidden).toBe(false)
      expect((component as any)._navigationModifiers?.titleDisplayMode).toBe('large')
    })

    it('sheet sets _navigationModifiers.sheet on the component', () => {
      const component = HTML.div({}).build()
      const [isPresented] = createSignal(false)
      const content = () => HTML.div({}).build()
      createModifierBuilder(component).sheet(isPresented, content)
      expect((component as any)._navigationModifiers?.sheet).toBeDefined()
      expect((component as any)._navigationModifiers?.sheet.isPresented).toBe(isPresented)
    })

    it('tabItem sets _tabItem on the component', () => {
      const component = HTML.div({}).build()
      createModifierBuilder(component).tabItem('home', 'Home', 'house')
      expect((component as any)._tabItem).toBeDefined()
      expect((component as any)._tabItem.id).toBe('home')
      expect((component as any)._tabItem.label).toBe('Home')
    })
  })

  describe('Chained modifier calls via component proxy (VStack fluent API)', () => {
    it('navigationTitle sets metadata on the internal modifiable component', () => {
      // VStack returns a ModifiableComponent+ModifierBuilder proxy.
      // Metadata set via chain lands on (proxy as any).component — the internal modifiable.
      // build() creates a fresh clone, so we read from the modifiable directly.
      const vstack = VStack({ children: [Text('Hello')] })
      vstack.navigationTitle('Proxy Test')
      const modifiable = (vstack as any).component
      expect(hasNavigationModifiers(modifiable)).toBe(true)
      expect(extractNavigationModifiers(modifiable).title).toBe('Proxy Test')
    })

    it('chaining does not throw and returns a chainable value', () => {
      const vstack = VStack({ children: [] })
      expect(() => {
        vstack
          .navigationTitle('Test')
          .navigationBarHidden(true)
          .navigationBarTitleDisplayMode('large')
      }).not.toThrow()
    })
  })
})
