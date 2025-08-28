import { describe, test, expect, beforeEach } from 'vitest'
import { IconSetRegistry } from '../../src/icon-sets/registry.js'
import { LucideIconSet } from '../../src/icon-sets/lucide.js'
import type { IconSet } from '../../src/types.js'

// Mock icon set for testing
class MockIconSet implements IconSet {
  name = 'mock'
  version = '1.0.0'
  icons = {}
  
  async getIcon(name: string) {
    return {
      name,
      variant: 'none' as const,
      weight: 'regular' as const,
      svg: '<path d="mock"/>',
      viewBox: '0 0 24 24'
    }
  }
  
  hasIcon(_name: string) {
    return true
  }
  
  listIcons() {
    return ['mock-icon']
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

describe('IconSetRegistry', () => {
  beforeEach(() => {
    IconSetRegistry.clear()
  })

  describe('Registration', () => {
    test('registers new icon set', () => {
      const mockSet = new MockIconSet()
      IconSetRegistry.register(mockSet)
      
      expect(IconSetRegistry.has('mock')).toBe(true)
      expect(IconSetRegistry.list()).toContain('mock')
    })

    test('allows multiple icon sets', () => {
      const mockSet = new MockIconSet()
      const lucideSet = new LucideIconSet()
      
      IconSetRegistry.register(mockSet)
      IconSetRegistry.register(lucideSet)
      
      expect(IconSetRegistry.list()).toContain('mock')
      expect(IconSetRegistry.list()).toContain('lucide')
      expect(IconSetRegistry.list()).toHaveLength(2)
    })

    test('overwrites existing icon set with same name', () => {
      const mockSet1 = new MockIconSet()
      const mockSet2 = new MockIconSet()
      mockSet2.version = '2.0.0'
      
      IconSetRegistry.register(mockSet1)
      IconSetRegistry.register(mockSet2)
      
      const retrieved = IconSetRegistry.get('mock')
      expect(retrieved.version).toBe('2.0.0')
      expect(IconSetRegistry.list()).toHaveLength(1)
    })
  })

  describe('Retrieval', () => {
    test('gets registered icon set by name', () => {
      const mockSet = new MockIconSet()
      IconSetRegistry.register(mockSet)
      
      const retrieved = IconSetRegistry.get('mock')
      expect(retrieved).toBe(mockSet)
      expect(retrieved.name).toBe('mock')
    })

    test('gets default icon set when no name provided', () => {
      const lucideSet = new LucideIconSet()
      IconSetRegistry.register(lucideSet)
      
      const retrieved = IconSetRegistry.get()
      expect(retrieved).toBe(lucideSet)
      expect(retrieved.name).toBe('lucide')
    })

    test('throws error for unregistered icon set', () => {
      expect(() => {
        IconSetRegistry.get('nonexistent')
      }).toThrow('Icon set "nonexistent" not registered')
    })
  })

  describe('Default Icon Set', () => {
    test('sets default icon set', () => {
      const mockSet = new MockIconSet()
      IconSetRegistry.register(mockSet)
      IconSetRegistry.setDefault('mock')
      
      const retrieved = IconSetRegistry.get()
      expect(retrieved.name).toBe('mock')
    })

    test('throws error when setting unregistered set as default', () => {
      expect(() => {
        IconSetRegistry.setDefault('nonexistent')
      }).toThrow('Cannot set default to unregistered icon set "nonexistent"')
    })

    test('default is lucide initially', () => {
      const lucideSet = new LucideIconSet()
      IconSetRegistry.register(lucideSet)
      
      const retrieved = IconSetRegistry.get()
      expect(retrieved.name).toBe('lucide')
    })
  })

  describe('Utility Methods', () => {
    test('checks if icon set exists', () => {
      const mockSet = new MockIconSet()
      IconSetRegistry.register(mockSet)
      
      expect(IconSetRegistry.has('mock')).toBe(true)
      expect(IconSetRegistry.has('nonexistent')).toBe(false)
    })

    test('lists all registered icon sets', () => {
      const mockSet = new MockIconSet()
      const lucideSet = new LucideIconSet()
      
      IconSetRegistry.register(mockSet)
      IconSetRegistry.register(lucideSet)
      
      const list = IconSetRegistry.list()
      expect(list).toContain('mock')
      expect(list).toContain('lucide')
      expect(list).toHaveLength(2)
    })

    test('clear removes all icon sets', () => {
      const mockSet = new MockIconSet()
      const lucideSet = new LucideIconSet()
      
      IconSetRegistry.register(mockSet)
      IconSetRegistry.register(lucideSet)
      
      expect(IconSetRegistry.list()).toHaveLength(2)
      
      IconSetRegistry.clear()
      
      expect(IconSetRegistry.list()).toHaveLength(0)
      expect(IconSetRegistry.has('mock')).toBe(false)
      expect(IconSetRegistry.has('lucide')).toBe(false)
    })

    test('clear resets default to lucide', () => {
      const mockSet = new MockIconSet()
      IconSetRegistry.register(mockSet)
      IconSetRegistry.setDefault('mock')
      
      IconSetRegistry.clear()
      
      // Register lucide again and check it's the default
      const lucideSet = new LucideIconSet()
      IconSetRegistry.register(lucideSet)
      
      const retrieved = IconSetRegistry.get()
      expect(retrieved.name).toBe('lucide')
    })
  })

  describe('Edge Cases', () => {
    test('handles empty registry gracefully', () => {
      expect(IconSetRegistry.list()).toHaveLength(0)
      expect(IconSetRegistry.has('anything')).toBe(false)
    })

    test('handles undefined icon set names', () => {
      const lucideSet = new LucideIconSet()
      IconSetRegistry.register(lucideSet)
      
      const retrieved = IconSetRegistry.get(undefined)
      expect(retrieved.name).toBe('lucide')
    })

    test('handles null icon set names', () => {
      const lucideSet = new LucideIconSet()
      IconSetRegistry.register(lucideSet)
      
      const retrieved = IconSetRegistry.get(null as any)
      expect(retrieved.name).toBe('lucide')
    })
  })
})