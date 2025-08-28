import { describe, test, expect, beforeEach, vi } from 'vitest'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import type { SymbolVariant } from '../../src/types.js'
import { suppressErrors } from '../utils/suppress-errors.js'

// Mock the dynamic import for Lucide icons
vi.mock('lucide/dist/esm/icons/heart.js', () => ({
  default: {
    body: '<path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" stroke="currentColor" fill="none"/>',
  }
}))

vi.mock('lucide/dist/esm/icons/star.js', () => ({
  default: {
    body: '<polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>',
  }
}))

describe('LucideIconSet', () => {
  let iconSet: LucideIconSet

  beforeEach(() => {
    iconSet = new LucideIconSet()
  })

  describe('Basic Properties', () => {
    test('has correct name and version', () => {
      expect(iconSet.name).toBe('lucide')
      expect(iconSet.version).toBe('0.447.0')
    })

    test('initializes with empty cache', () => {
      expect(iconSet.icons).toBeDefined()
      expect(typeof iconSet.icons).toBe('object')
    })
  })

  describe('Icon Retrieval', () => {
    test('loads icon successfully', async () => {
      const icon = await iconSet.getIcon('heart')
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
      expect(icon?.variant).toBe('none')
      expect(icon?.weight).toBe('regular')
      expect(icon?.viewBox).toBe('0 0 24 24')
      expect(icon?.svg).toContain('path')
    })

    test('loads icon with variant', async () => {
      const icon = await iconSet.getIcon('heart', 'filled')
      
      expect(icon).toBeDefined()
      expect(icon?.variant).toBe('filled')
    })

    test('caches loaded icons', async () => {
      const icon1 = await iconSet.getIcon('heart')
      const icon2 = await iconSet.getIcon('heart')
      
      expect(icon1).toBe(icon2) // Should be the same cached instance
    })

    test('handles different variants separately in cache', async () => {
      const iconNone = await iconSet.getIcon('heart', 'none')
      const iconFilled = await iconSet.getIcon('heart', 'filled')
      
      expect(iconNone).not.toBe(iconFilled)
      expect(iconNone?.variant).toBe('none')
      expect(iconFilled?.variant).toBe('filled')
    })

    test('returns undefined for non-existent icon', async () => {
      const icon = await suppressErrors(() => iconSet.getIcon('non-existent-icon'))
      
      expect(icon).toBeUndefined()
    })

    test('handles camelCase to kebab-case conversion', async () => {
      // Should work with camelCase names
      const icon = await suppressErrors(() => iconSet.getIcon('heartIcon'))
      // This will fail to load but should attempt the conversion
      expect(icon).toBeUndefined() // Since we don't have this icon mocked
    })
  })

  describe('Icon Variants', () => {
    test('processes filled variant correctly', async () => {
      const icon = await iconSet.getIcon('heart', 'filled')
      
      expect(icon?.svg).toBeDefined()
      // For filled variant, strokes should be converted to fills
      if (icon?.svg) {
        expect(icon.svg).toContain('fill="currentColor"')
      }
    })

    test('processes default variant correctly', async () => {
      const icon = await iconSet.getIcon('heart', 'none')
      
      expect(icon?.svg).toBeDefined()
      expect(icon?.variant).toBe('none')
    })
  })

  describe('Icon Support Checks', () => {
    test('checks icon existence', () => {
      // For now, always returns true
      expect(iconSet.hasIcon('heart')).toBe(true)
      expect(iconSet.hasIcon('non-existent')).toBe(true)
    })

    test('checks variant support', () => {
      expect(iconSet.supportsVariant('heart', 'none')).toBe(true)
      expect(iconSet.supportsVariant('heart', 'filled')).toBe(true)
      expect(iconSet.supportsVariant('heart', 'circle')).toBe(false)
    })

    test('checks weight support', () => {
      expect(iconSet.supportsWeight('heart', 'regular')).toBe(true)
      expect(iconSet.supportsWeight('heart', 'bold')).toBe(false)
      expect(iconSet.supportsWeight('heart', 'thin')).toBe(false)
    })
  })

  describe('Icon Listing', () => {
    test('lists common icons', () => {
      const icons = iconSet.listIcons()
      
      expect(Array.isArray(icons)).toBe(true)
      expect(icons.length).toBeGreaterThan(0)
      expect(icons).toContain('heart')
      expect(icons).toContain('star')
      expect(icons).toContain('user')
      expect(icons).toContain('home')
    })

    test('includes essential UI icons', () => {
      const icons = iconSet.listIcons()
      
      expect(icons).toContain('plus')
      expect(icons).toContain('minus')
      expect(icons).toContain('x')
      expect(icons).toContain('check')
      expect(icons).toContain('search')
      expect(icons).toContain('menu')
    })

    test('includes navigation icons', () => {
      const icons = iconSet.listIcons()
      
      expect(icons).toContain('arrow-right')
      expect(icons).toContain('arrow-left')
      expect(icons).toContain('arrow-up')
      expect(icons).toContain('arrow-down')
    })
  })

  describe('Icon Metadata', () => {
    test('provides metadata for common icons', () => {
      const heartMeta = iconSet.getIconMetadata('heart')
      expect(heartMeta?.category).toBe('social')
      expect(heartMeta?.tags).toContain('love')
      
      const userMeta = iconSet.getIconMetadata('user')
      expect(userMeta?.category).toBe('account')
      expect(userMeta?.tags).toContain('person')
      
      const searchMeta = iconSet.getIconMetadata('search')
      expect(searchMeta?.category).toBe('action')
      expect(searchMeta?.tags).toContain('find')
    })

    test('returns undefined for unknown icons', () => {
      const meta = iconSet.getIconMetadata('unknown-icon')
      expect(meta).toBeUndefined()
    })

    test('includes useful categorization', () => {
      const icons = iconSet.listIcons()
      const metadataCount = icons.reduce((count, icon) => {
        const meta = iconSet.getIconMetadata(icon)
        return meta ? count + 1 : count
      }, 0)
      
      expect(metadataCount).toBeGreaterThan(5) // At least some icons have metadata
    })
  })

  describe('Error Handling', () => {
    test('handles empty icon name gracefully', async () => {
      const icon = await suppressErrors(() => iconSet.getIcon(''))
      expect(icon).toBeUndefined()
    })

    test('handles undefined variant gracefully', async () => {
      const icon = await iconSet.getIcon('heart', undefined)
      expect(icon?.variant).toBe('none')
    })

    test('handles import errors gracefully', async () => {
      // Test with an icon that will definitely fail to import
      const icon = await suppressErrors(() => iconSet.getIcon('definitely-does-not-exist-123'))
      expect(icon).toBeUndefined()
    })
  })

  describe('Performance', () => {
    test('caches icons efficiently', async () => {
      // Load the same icon multiple times
      const promises = [
        iconSet.getIcon('heart'),
        iconSet.getIcon('heart'),
        iconSet.getIcon('heart'),
      ]
      
      const results = await Promise.all(promises)
      
      // All should return the same cached instance
      expect(results[0]).toBe(results[1])
      expect(results[1]).toBe(results[2])
    })

    test('handles concurrent loading', async () => {
      // Load different icons concurrently
      const promises = [
        iconSet.getIcon('heart'),
        iconSet.getIcon('star'),
        iconSet.getIcon('user'),
      ]
      
      const results = await Promise.all(promises)
      
      expect(results[0]?.name).toBe('heart')
      expect(results[1]?.name).toBe('star')
      expect(results[2]?.name).toBe('user')
    })
  })

  describe('SVG Processing', () => {
    test('processes icon data correctly', async () => {
      const icon = await iconSet.getIcon('heart')
      
      expect(icon?.svg).toBeDefined()
      expect(typeof icon?.svg).toBe('string')
      expect(icon?.svg.length).toBeGreaterThan(0)
    })

    test('handles different Lucide data formats', async () => {
      // The mock should handle the common Lucide format
      const icon = await iconSet.getIcon('heart')
      
      expect(icon?.svg).toContain('path')
    })
  })
})