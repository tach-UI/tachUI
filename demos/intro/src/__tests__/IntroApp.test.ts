import { describe, it, expect, beforeAll } from 'vitest'
import { IntroApp } from '../components/IntroApp'
import { createIntroAssets } from '../assets/intro-assets'

describe('IntroApp', () => {
  beforeAll(() => {
    // Register all intro app assets before running tests
    createIntroAssets()
  })

  it('should create the intro app component', () => {
    const app = IntroApp()
    expect(app).toBeDefined()
    expect(typeof app).toBe('object')
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
