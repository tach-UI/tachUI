/**
 * Advanced Media Query Features Tests
 *
 * Tests for orientation, color scheme, accessibility preferences,
 * device capabilities, and other advanced CSS media query features.
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { ResponsiveModifierBuilderImpl } from '../responsive-builder'
import { MediaQueries, combineMediaQueries, orMediaQueries } from '../utilities'
import { createMediaQueryModifier } from '../responsive-modifier'

// Mock ModifierBuilder
class MockModifierBuilder {
  private modifiers: any[] = []

  addModifier(modifier: any) {
    this.modifiers.push(modifier)
  }

  build() {
    return { modifiers: this.modifiers }
  }

  getModifiers() {
    return this.modifiers
  }
}

// Mock window.matchMedia
const mockMatchMedia = vi.fn()
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia,
})

describe('Advanced Media Query Features', () => {
  let mockBuilder: MockModifierBuilder
  let responsiveBuilder: ResponsiveModifierBuilderImpl<any>

  beforeEach(() => {
    mockBuilder = new MockModifierBuilder()
    responsiveBuilder = new ResponsiveModifierBuilderImpl(mockBuilder as any)

    // Reset matchMedia mock
    mockMatchMedia.mockClear()
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Device Orientation', () => {
    test('orientation() creates correct portrait media query', () => {
      const styles = { fontSize: 16, padding: 8 }
      responsiveBuilder.orientation('portrait', styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(orientation: portrait)')
      expect(modifier.styles).toEqual(styles)
    })

    test('orientation() creates correct landscape media query', () => {
      const styles = { fontSize: 18, margin: 10 }
      responsiveBuilder.orientation('landscape', styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(orientation: landscape)')
      expect(modifier.styles).toEqual(styles)
    })

    test('MediaQueries contains correct orientation queries', () => {
      expect(MediaQueries.landscape).toBe('(orientation: landscape)')
      expect(MediaQueries.portrait).toBe('(orientation: portrait)')
    })
  })

  describe('Color Scheme Preferences', () => {
    test('colorScheme() creates correct dark mode media query', () => {
      const styles = { backgroundColor: '#1a1a1a', color: '#ffffff' }
      responsiveBuilder.colorScheme('dark', styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(prefers-color-scheme: dark)')
      expect(modifier.styles).toEqual(styles)
    })

    test('colorScheme() creates correct light mode media query', () => {
      const styles = { backgroundColor: '#ffffff', color: '#000000' }
      responsiveBuilder.colorScheme('light', styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(prefers-color-scheme: light)')
      expect(modifier.styles).toEqual(styles)
    })

    test('MediaQueries contains correct color scheme queries', () => {
      expect(MediaQueries.darkMode).toBe('(prefers-color-scheme: dark)')
      expect(MediaQueries.lightMode).toBe('(prefers-color-scheme: light)')
      expect(MediaQueries.noColorSchemePreference).toBe(
        '(prefers-color-scheme: no-preference)'
      )
    })
  })

  describe('Accessibility Preferences', () => {
    test('reducedMotion() creates correct media query', () => {
      const styles = { transition: 'none', animation: 'none' }
      responsiveBuilder.reducedMotion(styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(prefers-reduced-motion: reduce)')
      expect(modifier.styles).toEqual(styles)
    })

    test('highContrast() creates correct media query', () => {
      const styles = { border: '2px solid black', fontWeight: 'bold' }
      responsiveBuilder.highContrast(styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(prefers-contrast: high)')
      expect(modifier.styles).toEqual(styles)
    })

    test('MediaQueries contains correct accessibility queries', () => {
      expect(MediaQueries.reducedMotion).toBe(
        '(prefers-reduced-motion: reduce)'
      )
      expect(MediaQueries.allowMotion).toBe(
        '(prefers-reduced-motion: no-preference)'
      )
      expect(MediaQueries.highContrast).toBe('(prefers-contrast: high)')
      expect(MediaQueries.lowContrast).toBe('(prefers-contrast: low)')
      expect(MediaQueries.normalContrast).toBe(
        '(prefers-contrast: no-preference)'
      )
    })
  })

  describe('Device Capabilities', () => {
    test('touchDevice() creates correct media query', () => {
      const styles = { padding: 12, fontSize: 16 }
      responsiveBuilder.touchDevice(styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(pointer: coarse)')
      expect(modifier.styles).toEqual(styles)
    })

    test('mouseDevice() creates correct media query', () => {
      const styles = { padding: 8, fontSize: 14 }
      responsiveBuilder.mouseDevice(styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(pointer: fine)')
      expect(modifier.styles).toEqual(styles)
    })

    test('retina() creates correct media query', () => {
      const styles = { backgroundSize: '50%', fontSize: 12 }
      responsiveBuilder.retina(styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('(min-resolution: 2dppx)')
      expect(modifier.styles).toEqual(styles)
    })

    test('MediaQueries contains correct device capability queries', () => {
      expect(MediaQueries.touchDevice).toBe('(pointer: coarse)')
      expect(MediaQueries.mouseDevice).toBe('(pointer: fine)')
      expect(MediaQueries.finePointer).toBe('(pointer: fine)')
      expect(MediaQueries.coarsePointer).toBe('(pointer: coarse)')
      expect(MediaQueries.canHover).toBe('(hover: hover)')
      expect(MediaQueries.noHover).toBe('(hover: none)')
    })
  })

  describe('Print Media', () => {
    test('print() creates correct media query', () => {
      const styles = { color: 'black', backgroundColor: 'white' }
      responsiveBuilder.print(styles)

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(1)

      const modifier = modifiers[0]
      expect(modifier.query).toBe('print')
      expect(modifier.styles).toEqual(styles)
    })

    test('MediaQueries contains correct print queries', () => {
      expect(MediaQueries.print).toBe('print')
      expect(MediaQueries.screen).toBe('screen')
      expect(MediaQueries.speech).toBe('speech')
    })
  })

  describe('Resolution Queries', () => {
    test('MediaQueries contains resolution-based queries', () => {
      expect(MediaQueries.highDPI).toBe('(min-resolution: 2dppx)')
      expect(MediaQueries.lowDPI).toBe('(max-resolution: 1dppx)')
      expect(MediaQueries.retinaDisplay).toBe('(min-resolution: 2dppx)')
      expect(MediaQueries.standardDisplay).toBe('(max-resolution: 1.9dppx)')

      expect(MediaQueries.lowRes).toBe('(max-resolution: 120dpi)')
      expect(MediaQueries.standardRes).toBe(
        '(min-resolution: 120dpi) and (max-resolution: 192dpi)'
      )
      expect(MediaQueries.highRes).toBe('(min-resolution: 192dpi)')
    })

    test('MediaQueries custom resolution builder works', () => {
      expect(MediaQueries.customResolution(150)).toBe(
        '(min-resolution: 150dpi)'
      )
      expect(MediaQueries.customResolution(300)).toBe(
        '(min-resolution: 300dpi)'
      )
    })
  })

  describe('Advanced Display Features', () => {
    test('MediaQueries contains modern display feature queries', () => {
      expect(MediaQueries.wideColorGamut).toBe('(color-gamut: p3)')
      expect(MediaQueries.standardColorGamut).toBe('(color-gamut: srgb)')
      expect(MediaQueries.hdr).toBe('(dynamic-range: high)')
      expect(MediaQueries.sdr).toBe('(dynamic-range: standard)')
    })

    test('MediaQueries contains forced colors queries', () => {
      expect(MediaQueries.forcedColors).toBe('(forced-colors: active)')
      expect(MediaQueries.normalColors).toBe('(forced-colors: none)')
      expect(MediaQueries.invertedColors).toBe('(inverted-colors: inverted)')
      expect(MediaQueries.normalInvertedColors).toBe('(inverted-colors: none)')
    })
  })

  describe('Aspect Ratio Queries', () => {
    test('MediaQueries contains aspect ratio queries', () => {
      expect(MediaQueries.square).toBe('(aspect-ratio: 1/1)')
      expect(MediaQueries.landscape16_9).toBe('(aspect-ratio: 16/9)')
      expect(MediaQueries.portrait9_16).toBe('(aspect-ratio: 9/16)')
      expect(MediaQueries.widescreen).toBe('(min-aspect-ratio: 16/9)')
      expect(MediaQueries.tallscreen).toBe('(max-aspect-ratio: 9/16)')
    })

    test('MediaQueries custom aspect ratio builders work', () => {
      expect(MediaQueries.customAspectRatio('4/3')).toBe('(aspect-ratio: 4/3)')
      expect(MediaQueries.minAspectRatio('16/10')).toBe(
        '(min-aspect-ratio: 16/10)'
      )
      expect(MediaQueries.maxAspectRatio('3/2')).toBe('(max-aspect-ratio: 3/2)')
    })
  })

  describe('Media Query Utilities', () => {
    test('combineMediaQueries() combines queries with AND', () => {
      const combined = combineMediaQueries(
        '(min-width: 768px)',
        '(orientation: landscape)',
        '(prefers-color-scheme: dark)'
      )

      expect(combined).toBe(
        '(min-width: 768px) and (orientation: landscape) and (prefers-color-scheme: dark)'
      )
    })

    test('combineMediaQueries() filters out empty queries', () => {
      const combined = combineMediaQueries(
        '(min-width: 768px)',
        '',
        '(orientation: landscape)',
        null as any,
        undefined as any
      )

      expect(combined).toBe('(min-width: 768px) and (orientation: landscape)')
    })

    test('orMediaQueries() combines queries with OR', () => {
      const combined = orMediaQueries(
        '(min-width: 768px)',
        '(orientation: landscape)'
      )

      expect(combined).toBe('(min-width: 768px), (orientation: landscape)')
    })
  })

  describe('Complex Media Query Scenarios', () => {
    test('chaining multiple advanced media queries', () => {
      responsiveBuilder
        .orientation('landscape', { fontSize: 16 })
        .colorScheme('dark', { backgroundColor: '#1a1a1a' })
        .reducedMotion({ transition: 'none' })
        .touchDevice({ padding: 12 })

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(4)

      expect(modifiers[0].query).toBe('(orientation: landscape)')
      expect(modifiers[1].query).toBe('(prefers-color-scheme: dark)')
      expect(modifiers[2].query).toBe('(prefers-reduced-motion: reduce)')
      expect(modifiers[3].query).toBe('(pointer: coarse)')
    })

    test('combining standard responsive with advanced queries', () => {
      responsiveBuilder
        .responsive({
          base: { fontSize: 14 },
          md: { fontSize: 16 },
          lg: { fontSize: 18 },
        })
        .colorScheme('dark', { color: '#ffffff' })
        .reducedMotion({ animation: 'none' })

      const modifiers = mockBuilder.getModifiers()
      expect(modifiers).toHaveLength(3)

      // First should be the responsive modifier
      expect(modifiers[0].config).toEqual({
        base: { fontSize: 14 },
        md: { fontSize: 16 },
        lg: { fontSize: 18 },
      })

      // Second should be dark mode
      expect(modifiers[1].query).toBe('(prefers-color-scheme: dark)')

      // Third should be reduced motion
      expect(modifiers[2].query).toBe('(prefers-reduced-motion: reduce)')
    })
  })

  describe('Custom Media Query Builder', () => {
    test('custom media query builders work correctly', () => {
      expect(MediaQueries.minWidth(768)).toBe('(min-width: 768px)')
      expect(MediaQueries.minWidth('768px')).toBe('(min-width: 768px)')
      expect(MediaQueries.maxWidth(1024)).toBe('(max-width: 1024px)')
      expect(MediaQueries.between(768, 1024)).toBe(
        '(min-width: 768px) and (max-width: 1024px)'
      )

      expect(MediaQueries.minHeight(600)).toBe('(min-height: 600px)')
      expect(MediaQueries.heightBetween(400, 800)).toBe(
        '(min-height: 400px) and (max-height: 800px)'
      )
    })
  })

  describe('Data Preferences', () => {
    test('MediaQueries contains data preference queries', () => {
      expect(MediaQueries.reduceData).toBe('(prefers-reduced-data: reduce)')
      expect(MediaQueries.allowData).toBe(
        '(prefers-reduced-data: no-preference)'
      )
      expect(MediaQueries.reduceTransparency).toBe(
        '(prefers-reduced-transparency: reduce)'
      )
      expect(MediaQueries.allowTransparency).toBe(
        '(prefers-reduced-transparency: no-preference)'
      )
    })
  })

  describe('Update and Scripting Capabilities', () => {
    test('MediaQueries contains update and scripting queries', () => {
      expect(MediaQueries.slowUpdate).toBe('(update: slow)')
      expect(MediaQueries.fastUpdate).toBe('(update: fast)')

      expect(MediaQueries.scriptingEnabled).toBe('(scripting: enabled)')
      expect(MediaQueries.scriptingDisabled).toBe('(scripting: none)')
      expect(MediaQueries.scriptingInitialOnly).toBe(
        '(scripting: initial-only)'
      )
    })
  })

  describe('Device-Specific Patterns', () => {
    test('MediaQueries contains device-specific queries', () => {
      expect(MediaQueries.iPhone).toBe('(max-width: 428px)')
      expect(MediaQueries.iPad).toBe(
        '(min-width: 768px) and (max-width: 1024px)'
      )
      expect(MediaQueries.desktopSmall).toBe(
        '(min-width: 1024px) and (max-width: 1440px)'
      )
      expect(MediaQueries.desktopLarge).toBe('(min-width: 1440px)')

      expect(MediaQueries.keyboardNavigation).toBe(
        '(hover: none) and (pointer: coarse)'
      )
    })
  })
})
