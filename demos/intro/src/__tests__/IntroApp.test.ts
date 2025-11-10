import { describe, it, expect, beforeAll } from 'vitest'
import { VStack } from '@tachui/primitives'
import '@tachui/modifiers'
import { registerModifiers } from '@tachui/modifiers'
import { globalModifierRegistry } from '@tachui/registry'
import { IntroApp } from '../components/IntroApp'
import { createIntroAssets } from '../assets/intro-assets'

describe('IntroApp', () => {
  beforeAll(() => {
    registerModifiers()
    if (!globalModifierRegistry.has('id')) {
      throw new Error('IntroApp test setup: id modifier not registered')
    }
    // Register all intro app assets before running tests
    createIntroAssets()
  })

  it('should create the intro app component', () => {
    const app = IntroApp()
    expect(app).toBeDefined()
    expect(typeof app).toBe('object')
  })

  it('should expose chained modifiers for VStack', () => {
    const view = VStack({ children: [] })
    expect(typeof (view as any).padding).toBe('function')
    const afterPadding = (view as any).padding({ vertical: 0, horizontal: 20 })
    expect(typeof afterPadding.maxWidth).toBe('function')
    const afterMaxWidth = afterPadding.maxWidth(1200)
    expect(typeof afterMaxWidth.elementId).toBe('function')
  })

  it('should have the correct structure', () => {
    const app = IntroApp()
    // The app should be a VStack with multiple children
    expect(app).toHaveProperty('props')
    const children = Array.isArray(app.props?.children)
      ? app.props.children
      : []

    // Should have multiple sections (Header, Hero, Features, etc.)
    expect(children.length).toBeGreaterThan(5)
  })
})
