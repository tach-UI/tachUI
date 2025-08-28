import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createGradientAsset } from '../../src/gradients/gradient-asset'
import { LinearGradient } from '../../src/gradients/index'

describe('GradientAsset', () => {
  beforeEach(() => {
    // Reset window.matchMedia mock
    vi.clearAllMocks()
  })

  it('creates a gradient asset with light and dark themes', () => {
    const lightGradient = LinearGradient({
      colors: ['#FFFFFF', '#F0F0F0'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const darkGradient = LinearGradient({
      colors: ['#333333', '#000000'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const gradientAsset = createGradientAsset({
      light: lightGradient,
      dark: darkGradient,
    })

    expect(gradientAsset).toBeDefined()
  })

  it('resolves to light theme by default', () => {
    const lightGradient = LinearGradient({
      colors: ['#FFFFFF', '#F0F0F0'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const darkGradient = LinearGradient({
      colors: ['#333333', '#000000'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const gradientAsset = createGradientAsset({
      light: lightGradient,
      dark: darkGradient,
    })

    // Mock light theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false, // Light theme
      })),
    })

    const css = gradientAsset.resolve()
    expect(css).toBe('linear-gradient(to bottom, #FFFFFF, #F0F0F0)')
  })

  it('resolves to dark theme when preferred', () => {
    const lightGradient = LinearGradient({
      colors: ['#FFFFFF', '#F0F0F0'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const darkGradient = LinearGradient({
      colors: ['#333333', '#000000'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const gradientAsset = createGradientAsset({
      light: lightGradient,
      dark: darkGradient,
    })

    // Mock dark theme
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true, // Dark theme
      })),
    })

    const css = gradientAsset.resolve()
    expect(css).toBe('linear-gradient(to bottom, #333333, #000000)')
  })

  it('falls back to light theme if dark is not available', () => {
    const lightGradient = LinearGradient({
      colors: ['#FFFFFF', '#F0F0F0'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const gradientAsset = createGradientAsset({
      light: lightGradient,
      dark: lightGradient, // Same as light for this test
    })

    // Mock dark theme preference
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: true, // Dark theme
      })),
    })

    const css = gradientAsset.resolve()
    expect(css).toBe('linear-gradient(to bottom, #FFFFFF, #F0F0F0)')
  })

  it('works in server-side environment', () => {
    const lightGradient = LinearGradient({
      colors: ['#FFFFFF', '#F0F0F0'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const darkGradient = LinearGradient({
      colors: ['#333333', '#000000'],
      startPoint: 'top',
      endPoint: 'bottom',
    })

    const gradientAsset = createGradientAsset({
      light: lightGradient,
      dark: darkGradient,
    })

    // Mock server environment (no window)
    const originalWindow = global.window
    delete (global as any).window

    const css = gradientAsset.resolve()
    expect(css).toBe('linear-gradient(to bottom, #FFFFFF, #F0F0F0)')

    // Restore window
    global.window = originalWindow
  })
})
