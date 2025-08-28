/**
 * Tests for Custom Icon Set Builder (Phase 2.7)
 */

import { describe, test, expect, beforeEach } from 'vitest'
import { 
  CustomIconSetBuilder, 
  createIconSetFromJSON,
  createIconSetFromSprite,
  validateIcon,
  validateIconSet
} from '../../src/utils/custom-icon-set-builder.js'
import type { CustomIconConfig, IconSetConfig } from '../../src/utils/custom-icon-set-builder.js'

describe('CustomIconSetBuilder', () => {
  let builder: CustomIconSetBuilder
  let config: IconSetConfig

  beforeEach(() => {
    config = {
      name: 'test-icons',
      version: '1.0.0',
      defaultVariant: 'none',
      defaultWeight: 'regular'
    }
    builder = new CustomIconSetBuilder(config)
  })

  describe('Basic Icon Addition', () => {
    test('should add a single icon', () => {
      const iconConfig: CustomIconConfig = {
        name: 'test-icon',
        svg: '<circle cx="12" cy="12" r="10"/>',
        viewBox: '0 0 24 24'
      }

      builder.addIcon(iconConfig)
      const iconSet = builder.build()

      expect(iconSet.name).toBe('test-icons')
      expect(iconSet.version).toBe('1.0.0')
      expect(iconSet.hasIcon('test-icon')).toBe(true)
    })

    test('should add multiple icons at once', () => {
      const icons: CustomIconConfig[] = [
        {
          name: 'icon1',
          svg: '<circle cx="12" cy="12" r="10"/>',
          viewBox: '0 0 24 24'
        },
        {
          name: 'icon2', 
          svg: '<rect x="2" y="2" width="20" height="20"/>',
          viewBox: '0 0 24 24'
        }
      ]

      builder.addIcons(icons)
      const iconSet = builder.build()

      expect(iconSet.hasIcon('icon1')).toBe(true)
      expect(iconSet.hasIcon('icon2')).toBe(true)
      expect(iconSet.listIcons()).toEqual(['icon1', 'icon2'])
    })

    test('should use default values when not specified', () => {
      const iconConfig: CustomIconConfig = {
        name: 'minimal-icon',
        svg: '<circle cx="12" cy="12" r="10"/>'
      }

      builder.addIcon(iconConfig)
      const iconSet = builder.build()
      const icon = iconSet.icons['minimal-icon']

      expect(icon.variant).toBe('none')
      expect(icon.weight).toBe('regular')
      expect(icon.viewBox).toBe('0 0 24 24')
    })

    test('should include metadata when provided', () => {
      const iconConfig: CustomIconConfig = {
        name: 'tagged-icon',
        svg: '<circle cx="12" cy="12" r="10"/>',
        metadata: {
          category: 'shapes',
          tags: ['circle', 'round'],
          unicodePoint: 'U+25CF'
        }
      }

      builder.addIcon(iconConfig)
      const iconSet = builder.build()
      const metadata = iconSet.getIconMetadata('tagged-icon')

      expect(metadata?.category).toBe('shapes')
      expect(metadata?.tags).toEqual(['circle', 'round'])
      expect(metadata?.unicodePoint).toBe('U+25CF')
    })
  })

  describe('Icon Variants', () => {
    test('should add variants to existing icons', () => {
      const iconConfig: CustomIconConfig = {
        name: 'star',
        svg: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>'
      }

      builder
        .addIcon(iconConfig)
        .addVariant('star', 'filled', '<path d="..." fill="currentColor"/>')

      const iconSet = builder.build()

      expect(iconSet.hasIcon('star')).toBe(true)
      expect(iconSet.hasIcon('star', 'filled')).toBe(true)
      expect(iconSet.supportsVariant('star', 'filled')).toBe(true)
    })

    test('should throw error when adding variant to non-existent icon', () => {
      expect(() => {
        builder.addVariant('non-existent', 'filled', '<path d="..."/>')
      }).toThrow('Icon "non-existent" not found. Add base icon first.')
    })

    test('should update base icon metadata with available variants', async () => {
      builder
        .addIcon({
          name: 'heart',
          svg: '<path d="..."/>'
        })
        .addVariant('heart', 'filled', '<path d="..." fill="currentColor"/>')

      const iconSet = builder.build()
      const baseIcon = await iconSet.getIcon('heart')

      expect(baseIcon?.metadata?.availableVariants).toContain('filled')
    })
  })

  describe('Icon Set Operations', () => {
    beforeEach(() => {
      builder
        .addIcon({
          name: 'circle',
          svg: '<circle cx="12" cy="12" r="10"/>'
        })
        .addIcon({
          name: 'square',
          svg: '<rect x="2" y="2" width="20" height="20"/>'
        })
        .addVariant('circle', 'filled', '<circle cx="12" cy="12" r="10" fill="currentColor"/>')
    })

    test('should retrieve icons correctly', async () => {
      const iconSet = builder.build()
      
      const circleIcon = await iconSet.getIcon('circle')
      const filledCircle = await iconSet.getIcon('circle', 'filled')
      const nonExistent = await iconSet.getIcon('non-existent')

      expect(circleIcon?.name).toBe('circle')
      expect(filledCircle?.name).toBe('circle-filled')
      expect(nonExistent).toBeUndefined()
    })

    test('should fallback to base icon when variant not found', async () => {
      const iconSet = builder.build()
      const fallbackIcon = await iconSet.getIcon('square', 'filled') // filled variant doesn't exist

      expect(fallbackIcon?.name).toBe('square')
      expect(fallbackIcon?.variant).toBe('none')
    })

    test('should check icon existence correctly', () => {
      const iconSet = builder.build()

      expect(iconSet.hasIcon('circle')).toBe(true)
      expect(iconSet.hasIcon('circle', 'filled')).toBe(true)
      expect(iconSet.hasIcon('square', 'filled')).toBe(true) // Falls back to base
      expect(iconSet.hasIcon('non-existent')).toBe(false)
    })

    test('should list base icons only', () => {
      const iconSet = builder.build()
      const icons = iconSet.listIcons()

      expect(icons).toEqual(['circle', 'square'])
      expect(icons).not.toContain('circle-filled')
    })

    test('should support variant and weight checking', () => {
      const iconSet = builder.build()

      expect(iconSet.supportsVariant('circle', 'filled')).toBe(true)
      expect(iconSet.supportsVariant('circle', 'slash')).toBe(false)
      expect(iconSet.supportsWeight('circle', 'regular')).toBe(true)
    })
  })

  describe('Fluent Interface', () => {
    test('should support method chaining', () => {
      const iconSet = builder
        .addIcon({
          name: 'icon1',
          svg: '<circle cx="12" cy="12" r="10"/>'
        })
        .addIcon({
          name: 'icon2',
          svg: '<rect x="2" y="2" width="20" height="20"/>'
        })
        .addVariant('icon1', 'filled', '<circle cx="12" cy="12" r="10" fill="currentColor"/>')
        .build()

      expect(iconSet.hasIcon('icon1')).toBe(true)
      expect(iconSet.hasIcon('icon2')).toBe(true)
      expect(iconSet.hasIcon('icon1', 'filled')).toBe(true)
    })

    test('should support adding multiple icons then variants', () => {
      const icons: CustomIconConfig[] = [
        { name: 'star', svg: '<path d="..."/>' },
        { name: 'heart', svg: '<path d="..."/>' }
      ]

      const iconSet = builder
        .addIcons(icons)
        .addVariant('star', 'filled', '<path d="..." fill="currentColor"/>')
        .addVariant('heart', 'filled', '<path d="..." fill="currentColor"/>')
        .build()

      expect(iconSet.supportsVariant('star', 'filled')).toBe(true)
      expect(iconSet.supportsVariant('heart', 'filled')).toBe(true)
    })
  })
})

describe('createIconSetFromJSON', () => {
  test('should create icon set from JSON data', () => {
    const config: IconSetConfig = {
      name: 'json-icons',
      version: '1.0.0'
    }

    const iconData = {
      'home': {
        svg: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
        viewBox: '0 0 24 24',
        variants: {
          'filled': '<path d="..." fill="currentColor"/>'
        },
        metadata: {
          category: 'navigation',
          tags: ['home', 'house']
        }
      }
    }

    const iconSet = createIconSetFromJSON(config, iconData)

    expect(iconSet.name).toBe('json-icons')
    expect(iconSet.hasIcon('home')).toBe(true)
    expect(iconSet.hasIcon('home', 'filled')).toBe(true)
    expect(iconSet.getIconMetadata('home')?.category).toBe('navigation')
  })

  test('should handle empty icon data', () => {
    const config: IconSetConfig = {
      name: 'empty-icons',
      version: '1.0.0'
    }

    const iconSet = createIconSetFromJSON(config, {})

    expect(iconSet.name).toBe('empty-icons')
    expect(iconSet.listIcons()).toEqual([])
  })
})

describe('createIconSetFromSprite', () => {
  test('should create icon set from sprite mappings', () => {
    const config: IconSetConfig = {
      name: 'sprite-icons',
      version: '1.0.0'
    }

    const iconMappings = {
      'home': { id: 'icon-home', viewBox: '0 0 24 24' },
      'user': { id: 'icon-user', viewBox: '0 0 24 24' },
      'settings': { id: 'icon-settings' }
    }

    const iconSet = createIconSetFromSprite(config, '/assets/icons.svg', iconMappings)

    expect(iconSet.name).toBe('sprite-icons')
    expect(iconSet.hasIcon('home')).toBe(true)
    expect(iconSet.hasIcon('user')).toBe(true)
    expect(iconSet.hasIcon('settings')).toBe(true)

    const homeIcon = iconSet.icons['home']
    expect(homeIcon.svg).toContain('<use href="/assets/icons.svg#icon-home"/>')
    expect(homeIcon.viewBox).toBe('0 0 24 24')

    const settingsIcon = iconSet.icons['settings']
    expect(settingsIcon.viewBox).toBe('0 0 24 24') // Default fallback
  })
})

describe('Icon Validation Functions', () => {
  describe('validateIcon', () => {
    test('should validate correct icon configuration', () => {
      const validIcon: CustomIconConfig = {
        name: 'test-icon',
        svg: '<circle cx="12" cy="12" r="10"/>',
        viewBox: '0 0 24 24'
      }

      const result = validateIcon(validIcon)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('should catch missing name', () => {
      const invalidIcon = {
        name: '',
        svg: '<circle cx="12" cy="12" r="10"/>'
      } as CustomIconConfig

      const result = validateIcon(invalidIcon)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Icon name is required and must be a string')
    })

    test('should catch missing SVG', () => {
      const invalidIcon = {
        name: 'test-icon',
        svg: ''
      } as CustomIconConfig

      const result = validateIcon(invalidIcon)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Icon SVG is required and must be a string')
    })

    test('should catch invalid SVG format', () => {
      const invalidIcon: CustomIconConfig = {
        name: 'test-icon',
        svg: 'not-svg-content'
      }

      const result = validateIcon(invalidIcon)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Icon SVG must be valid SVG markup')
    })

    test('should catch invalid viewBox format', () => {
      const invalidIcon: CustomIconConfig = {
        name: 'test-icon',
        svg: '<circle cx="12" cy="12" r="10"/>',
        viewBox: 'invalid-viewbox'
      }

      const result = validateIcon(invalidIcon)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('ViewBox must be in format "x y width height"')
    })

    test('should accept valid viewBox formats', () => {
      const validIcon: CustomIconConfig = {
        name: 'test-icon',
        svg: '<circle cx="12" cy="12" r="10"/>',
        viewBox: '0 0 24 24'
      }

      const result = validateIcon(validIcon)

      expect(result.valid).toBe(true)
    })
  })

  describe('validateIconSet', () => {
    test('should validate correct icon set configuration', () => {
      const config: IconSetConfig = {
        name: 'test-set',
        version: '1.0.0'
      }

      const icons: CustomIconConfig[] = [
        {
          name: 'icon1',
          svg: '<circle cx="12" cy="12" r="10"/>'
        },
        {
          name: 'icon2',
          svg: '<rect x="2" y="2" width="20" height="20"/>'
        }
      ]

      const result = validateIconSet(config, icons)

      expect(result.valid).toBe(true)
      expect(result.errors).toEqual([])
    })

    test('should catch missing icon set name', () => {
      const config = {
        name: '',
        version: '1.0.0'
      } as IconSetConfig

      const icons: CustomIconConfig[] = [{
        name: 'icon1',
        svg: '<circle cx="12" cy="12" r="10"/>'
      }]

      const result = validateIconSet(config, icons)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Icon set name is required')
    })

    test('should catch missing version', () => {
      const config = {
        name: 'test-set',
        version: ''
      } as IconSetConfig

      const icons: CustomIconConfig[] = [{
        name: 'icon1',
        svg: '<circle cx="12" cy="12" r="10"/>'
      }]

      const result = validateIconSet(config, icons)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Icon set version is required')
    })

    test('should catch empty icon array', () => {
      const config: IconSetConfig = {
        name: 'test-set',
        version: '1.0.0'
      }

      const result = validateIconSet(config, [])

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Icon set must contain at least one icon')
    })

    test('should catch duplicate icon names', () => {
      const config: IconSetConfig = {
        name: 'test-set',
        version: '1.0.0'
      }

      const icons: CustomIconConfig[] = [
        {
          name: 'duplicate',
          svg: '<circle cx="12" cy="12" r="10"/>'
        },
        {
          name: 'duplicate',
          svg: '<rect x="2" y="2" width="20" height="20"/>'
        }
      ]

      const result = validateIconSet(config, icons)

      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Duplicate icon name: duplicate')
    })

    test('should catch individual icon validation errors', () => {
      const config: IconSetConfig = {
        name: 'test-set',
        version: '1.0.0'
      }

      const icons: CustomIconConfig[] = [
        {
          name: '',
          svg: '<circle cx="12" cy="12" r="10"/>'
        }
      ]

      const result = validateIconSet(config, icons)

      expect(result.valid).toBe(false)
      expect(result.errors.some(error => error.includes('Icon 1:'))).toBe(true)
    })
  })
})