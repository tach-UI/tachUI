import { describe, test, expect, beforeEach, vi } from 'vitest'
import { IconLoader } from '../../src/utils/icon-loader.js'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { suppressErrors } from '../utils/suppress-errors.js'
import type { IconSet, IconDefinition } from '../../src/types.js'

// Mock icon set for testing
class MockIconSet implements IconSet {
  name = 'mock'
  version = '1.0.0'
  icons = {}
  
  private mockIcons: Record<string, IconDefinition> = {
    'heart': {
      name: 'heart',
      variant: 'none',
      weight: 'regular',
      svg: '<path d="heart"/>',
      viewBox: '0 0 24 24'
    },
    'star': {
      name: 'star',
      variant: 'none',
      weight: 'regular',
      svg: '<path d="star"/>',
      viewBox: '0 0 24 24'
    }
  }
  
  async getIcon(name: string, variant = 'none' as const) {
    // Simulate async loading
    await new Promise(resolve => setTimeout(resolve, 10))
    
    if (name === 'error-icon') {
      throw new Error('Failed to load icon')
    }
    
    return this.mockIcons[name] ? {
      ...this.mockIcons[name],
      variant
    } : undefined
  }
  
  hasIcon(name: string) {
    return name in this.mockIcons
  }
  
  listIcons() {
    return Object.keys(this.mockIcons)
  }
  
  getIconMetadata() {
    return undefined
  }
  
  supportsVariant() {
    return true
  }
  
  supportsWeight() {
    return true
  }
}

describe('IconLoader', () => {
  let mockIconSet: MockIconSet

  beforeEach(() => {
    IconLoader.clearCache()
    IconSetRegistry.clear()
    mockIconSet = new MockIconSet()
    IconSetRegistry.register(mockIconSet)
    IconSetRegistry.setDefault('mock')
  })

  describe('Basic Icon Loading', () => {
    test('loads icon successfully', async () => {
      const icon = await IconLoader.loadIcon('heart')
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
      expect(icon?.variant).toBe('none')
      expect(icon?.svg).toBe('<path d="heart"/>')
    })

    test('loads icon with variant', async () => {
      const icon = await IconLoader.loadIcon('heart', 'filled')
      
      expect(icon).toBeDefined()
      expect(icon?.variant).toBe('filled')
    })

    test('loads icon from specific icon set', async () => {
      const icon = await IconLoader.loadIcon('heart', 'none', 'mock')
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
    })

    test('returns undefined for non-existent icon', async () => {
      const icon = await IconLoader.loadIcon('non-existent')
      
      expect(icon).toBeUndefined()
    })

    test('handles loading errors gracefully', async () => {
      const icon = await suppressErrors(() => IconLoader.loadIcon('error-icon'))
      
      expect(icon).toBeUndefined()
    })
  })

  describe('Caching', () => {
    test('caches loaded icons', async () => {
      const icon1 = await IconLoader.loadIcon('heart')
      const icon2 = await IconLoader.loadIcon('heart')
      
      expect(icon1).toBe(icon2) // Same cached instance
    })

    test('caches icons with different variants separately', async () => {
      const iconNone = await IconLoader.loadIcon('heart', 'none')
      const iconFilled = await IconLoader.loadIcon('heart', 'filled')
      
      expect(iconNone).not.toBe(iconFilled)
      expect(iconNone?.variant).toBe('none')
      expect(iconFilled?.variant).toBe('filled')
    })

    test('caches icons from different icon sets separately', async () => {
      const icon1 = await IconLoader.loadIcon('heart', 'none', 'mock')
      const icon2 = await suppressErrors(() => IconLoader.loadIcon('heart', 'none', 'other'))
      
      // Different icon sets should cache separately (even if one fails)
      expect(icon1).toBeDefined()
      expect(icon2).toBeUndefined() // 'other' set doesn't exist
    })

    test('checks if icon is cached', async () => {
      expect(IconLoader.isIconCached('heart')).toBe(false)
      
      await IconLoader.loadIcon('heart')
      
      expect(IconLoader.isIconCached('heart')).toBe(true)
    })

    test('retrieves cached icon without loading', async () => {
      await IconLoader.loadIcon('heart')
      
      const cached = IconLoader.getCachedIcon('heart')
      expect(cached).toBeDefined()
      expect(cached?.name).toBe('heart')
    })

    test('returns undefined for non-cached icon', () => {
      const cached = IconLoader.getCachedIcon('non-existent')
      expect(cached).toBeUndefined()
    })
  })

  describe('Concurrent Loading', () => {
    test('handles concurrent requests for same icon', async () => {
      const promises = [
        IconLoader.loadIcon('heart'),
        IconLoader.loadIcon('heart'),
        IconLoader.loadIcon('heart'),
      ]
      
      const results = await Promise.all(promises)
      
      // All should return the same cached instance
      expect(results[0]).toBe(results[1])
      expect(results[1]).toBe(results[2])
    })

    test('handles concurrent requests for different icons', async () => {
      const promises = [
        IconLoader.loadIcon('heart'),
        IconLoader.loadIcon('star'),
      ]
      
      const results = await Promise.all(promises)
      
      expect(results[0]?.name).toBe('heart')
      expect(results[1]?.name).toBe('star')
    })
  })

  describe('Preloading', () => {
    test('preloads multiple icons', async () => {
      const icons = await IconLoader.preloadIcons(['heart', 'star'])
      
      expect(icons).toHaveLength(2)
      expect(icons[0]?.name).toBe('heart')
      expect(icons[1]?.name).toBe('star')
      
      // Should be cached now
      expect(IconLoader.isIconCached('heart')).toBe(true)
      expect(IconLoader.isIconCached('star')).toBe(true)
    })

    test('preloads with specific variant', async () => {
      const icons = await IconLoader.preloadIcons(['heart'], 'filled')
      
      expect(icons[0]?.variant).toBe('filled')
      expect(IconLoader.isIconCached('heart', 'filled')).toBe(true)
    })

    test('preloads critical icons', async () => {
      await IconLoader.preloadCriticalIcons()
      
      // Should have cached several critical icons
      const stats = IconLoader.getCacheStats()
      expect(stats.cached).toBeGreaterThan(0)
    })

    test('handles preloading errors gracefully', async () => {
      const icons = await suppressErrors(() => IconLoader.preloadIcons(['heart', 'error-icon', 'star']))
      
      expect(icons).toHaveLength(3)
      expect(icons[0]?.name).toBe('heart')
      expect(icons[1]).toBeUndefined() // Error icon
      expect(icons[2]?.name).toBe('star')
    })
  })

  describe('Fallback Loading', () => {
    test('loads fallback when primary icon fails', async () => {
      const icon = await suppressErrors(() => IconLoader.loadIconWithFallback('non-existent', 'heart'))
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
    })

    test('returns primary icon when available', async () => {
      const icon = await IconLoader.loadIconWithFallback('heart', 'star')
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
    })

    test('returns undefined when both primary and fallback fail', async () => {
      const icon = await suppressErrors(() => IconLoader.loadIconWithFallback('non-existent', 'also-non-existent'))
      
      expect(icon).toBeUndefined()
    })

    test('handles same primary and fallback gracefully', async () => {
      const icon = await IconLoader.loadIconWithFallback('heart', 'heart')
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
    })
  })

  describe('Cache Management', () => {
    test('clears all cache', async () => {
      await IconLoader.loadIcon('heart')
      await IconLoader.loadIcon('star')
      
      expect(IconLoader.getCacheStats().cached).toBe(2)
      
      IconLoader.clearCache()
      
      expect(IconLoader.getCacheStats().cached).toBe(0)
    })

    test('provides cache statistics', async () => {
      const stats1 = IconLoader.getCacheStats()
      expect(stats1.cached).toBe(0)
      expect(stats1.loading).toBe(0)
      expect(stats1.totalSize).toBe(0)
      
      await IconLoader.loadIcon('heart')
      
      const stats2 = IconLoader.getCacheStats()
      expect(stats2.cached).toBe(1)
      expect(stats2.totalSize).toBeGreaterThan(0)
    })

    test('tracks loading operations', async () => {
      const loadPromise = IconLoader.loadIcon('heart')
      
      // During loading
      const stats = IconLoader.getCacheStats()
      expect(stats.loading).toBeGreaterThan(0)
      
      await loadPromise
      
      // After loading
      const finalStats = IconLoader.getCacheStats()
      expect(finalStats.loading).toBe(0)
      expect(finalStats.cached).toBe(1)
    })
  })

  describe('Error Handling', () => {
    test('handles icon set registry errors', async () => {
      IconSetRegistry.clear()
      
      // With auto-registration, this should now succeed
      const icon = await suppressErrors(() => IconLoader.loadIcon('heart'))
      
      expect(icon).toBeDefined()
      expect(icon?.name).toBe('heart')
    })

    test('handles empty icon name', async () => {
      const icon = await IconLoader.loadIcon('')
      
      expect(icon).toBeUndefined()
    })

    test('handles undefined variant gracefully', async () => {
      const icon = await IconLoader.loadIcon('heart', undefined as any)
      
      expect(icon).toBeDefined()
      expect(icon?.variant).toBe('none')
    })
  })

  describe('Performance', () => {
    test('avoids duplicate loading requests', async () => {
      const spy = vi.spyOn(mockIconSet, 'getIcon')
      
      // Start multiple concurrent requests
      const promises = [
        IconLoader.loadIcon('heart'),
        IconLoader.loadIcon('heart'),
        IconLoader.loadIcon('heart'),
      ]
      
      await Promise.all(promises)
      
      // Should only call getIcon once
      expect(spy).toHaveBeenCalledTimes(1)
    })

    test('calculates total cache size correctly', async () => {
      await IconLoader.loadIcon('heart')
      await IconLoader.loadIcon('star')
      
      const stats = IconLoader.getCacheStats()
      
      expect(stats.totalSize).toBe(
        '<path d="heart"/>'.length + '<path d="star"/>'.length
      )
    })
  })
})