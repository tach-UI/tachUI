/**
 * ColorAsset Reactivity Tests
 *
 * Verifies that ColorAsset.resolve() creates reactive dependencies
 * and updates when theme changes.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { setTheme, getThemeSignal } from '../../src/reactive/theme'
import { createEffect } from '../../src/reactive/effect'

describe('ColorAsset Reactivity', () => {
  beforeEach(async () => {
    setTheme('light')
    // Wait for any pending reactive updates from theme change to complete
    await new Promise(resolve => setTimeout(resolve, 0))
    await new Promise(resolve => queueMicrotask(resolve))
  })

  it('should resolve to correct color based on current theme', () => {
    const primaryColor = ColorAsset.init({
      name: 'primary',
      default: '#000000',
      light: '#000000',
      dark: '#ffffff',
    })

    // Light theme
    setTheme('light')
    expect(primaryColor.resolve()).toBe('#000000')

    // Dark theme
    setTheme('dark')
    expect(primaryColor.resolve()).toBe('#ffffff')

    // Back to light
    setTheme('light')
    expect(primaryColor.resolve()).toBe('#000000')
  })

  it('should create reactive dependency when resolve() is called in effect', async () => {
    const primaryColor = ColorAsset.init({
      name: 'primary',
      default: '#000',
      light: '#111',
      dark: '#fff',
    })

    let resolvedColor = ''
    let effectRunCount = 0

    // Create effect that uses ColorAsset
    const effect = createEffect(() => {
      resolvedColor = primaryColor.resolve()
      effectRunCount++
    })

    // Initial run
    expect(effectRunCount).toBeGreaterThanOrEqual(1)
    expect(resolvedColor).toBe('#111') // light theme

    const countAfterInit = effectRunCount

    // Change theme - effect should re-run
    setTheme('dark')
    // Wait for microtask queue to flush
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBeGreaterThan(countAfterInit)
    expect(resolvedColor).toBe('#fff')

    const countAfterDark = effectRunCount

    // Change theme again - effect should re-run
    setTheme('light')
    // Wait for microtask queue to flush
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBeGreaterThan(countAfterDark)
    expect(resolvedColor).toBe('#111')

    // Cleanup
    effect.dispose()
  })

  it('should update multiple ColorAssets independently', async () => {
    const primary = ColorAsset.init({
      name: 'primary',
      default: '#000',
      light: '#000',
      dark: '#fff',
    })

    const secondary = ColorAsset.init({
      name: 'secondary',
      default: '#666',
      light: '#999',
      dark: '#333',
    })

    let primaryResolved = ''
    let secondaryResolved = ''
    let effectRunCount = 0

    const effect = createEffect(() => {
      primaryResolved = primary.resolve()
      secondaryResolved = secondary.resolve()
      effectRunCount++
    })

    // Initial
    expect(effectRunCount).toBe(1)
    expect(primaryResolved).toBe('#000')
    expect(secondaryResolved).toBe('#999')

    // Change theme - both should update
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBe(2)
    expect(primaryResolved).toBe('#fff')
    expect(secondaryResolved).toBe('#333')

    effect.dispose()
  })

  it('should work with ColorAsset that only has default', async () => {
    const simpleColor = ColorAsset.init({
      name: 'simple',
      default: '#abc123',
    })

    let resolvedColor = ''
    let effectRunCount = 0

    const effect = createEffect(() => {
      resolvedColor = simpleColor.resolve()
      effectRunCount++
    })

    // Should use default for light
    setTheme('light')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(resolvedColor).toBe('#abc123')

    const countAfterLight = effectRunCount

    // Should use default for dark
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(resolvedColor).toBe('#abc123')

    // Effect should still run when theme changes
    expect(effectRunCount).toBeGreaterThan(countAfterLight)

    effect.dispose()
  })

  it('should work with partial theme overrides', async () => {
    const colorWithLightOnly = ColorAsset.init({
      name: 'lightOnly',
      default: '#000000',
      light: '#111111',
    })

    let resolvedColor = ''

    const effect = createEffect(() => {
      resolvedColor = colorWithLightOnly.resolve()
    })

    // Light theme - use light value
    setTheme('light')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(resolvedColor).toBe('#111111')

    // Dark theme - fallback to default
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(resolvedColor).toBe('#000000')

    effect.dispose()
  })

  it('should track multiple effects on same ColorAsset', async () => {
    const color = ColorAsset.init({
      name: 'shared',
      default: '#000',
      light: '#000',
      dark: '#fff',
    })

    let resolved1 = ''
    let resolved2 = ''
    let count1 = 0
    let count2 = 0

    const effect1 = createEffect(() => {
      resolved1 = color.resolve()
      count1++
    })

    const effect2 = createEffect(() => {
      resolved2 = color.resolve()
      count2++
    })

    // Initial runs
    expect(count1).toBe(1)
    expect(count2).toBe(1)
    expect(resolved1).toBe('#000')
    expect(resolved2).toBe('#000')

    // Theme change - both effects should update
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(count1).toBe(2)
    expect(count2).toBe(2)
    expect(resolved1).toBe('#fff')
    expect(resolved2).toBe('#fff')

    effect1.dispose()
    effect2.dispose()
  })

  it('should dispose effect correctly', async () => {
    const color = ColorAsset.init({
      name: 'disposable',
      default: '#000',
      light: '#000',
      dark: '#fff',
    })

    let resolvedColor = ''
    let effectRunCount = 0

    const effect = createEffect(() => {
      resolvedColor = color.resolve()
      effectRunCount++
    })

    expect(effectRunCount).toBe(1)

    // Dispose effect
    effect.dispose()

    // Theme change should NOT trigger effect
    const countBeforeDispose = effectRunCount
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBe(countBeforeDispose) // Should not increase
  })

  it('should handle rapid theme changes', async () => {
    const color = ColorAsset.init({
      name: 'rapid',
      default: '#000',
      light: '#000',
      dark: '#fff',
    })

    let resolvedColor = ''
    let effectRunCount = 0

    const effect = createEffect(() => {
      resolvedColor = color.resolve()
      effectRunCount++
    })

    expect(effectRunCount).toBe(1)

    // Make separate theme changes with awaits to allow batching
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBe(2)
    expect(resolvedColor).toBe('#fff')

    setTheme('light')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBe(3)
    expect(resolvedColor).toBe('#000')

    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))
    expect(effectRunCount).toBe(4)
    expect(resolvedColor).toBe('#fff')

    effect.dispose()
  })

  it('should work with theme signal directly', () => {
    const color = ColorAsset.init({
      name: 'direct',
      default: '#000',
      light: '#aaa',
      dark: '#fff',
    })

    // Access theme signal directly
    const themeSignal = getThemeSignal()

    setTheme('light')
    expect(themeSignal()).toBe('light')
    expect(color.resolve()).toBe('#aaa')

    setTheme('dark')
    expect(themeSignal()).toBe('dark')
    expect(color.resolve()).toBe('#fff')
  })

  it('should update nested effects', async () => {
    const color = ColorAsset.init({
      name: 'nested',
      default: '#000',
      light: '#000',
      dark: '#fff',
    })

    let outerValue = ''
    let innerValue = ''
    let outerCount = 0
    let innerCount = 0

    const outerEffect = createEffect(() => {
      outerValue = color.resolve()
      outerCount++

      // Create inner effect
      const innerEffect = createEffect(() => {
        innerValue = color.resolve()
        innerCount++
      })

      // Cleanup inner on outer re-run
      return () => innerEffect.dispose()
    })

    const initialOuterCount = outerCount
    const initialInnerCount = innerCount

    // Change theme
    setTheme('dark')
    await new Promise(resolve => queueMicrotask(resolve))

    expect(outerCount).toBeGreaterThan(initialOuterCount)
    expect(innerCount).toBeGreaterThan(initialInnerCount)
    expect(outerValue).toBe('#fff')
    expect(innerValue).toBe('#fff')

    outerEffect.dispose()
  })
})
