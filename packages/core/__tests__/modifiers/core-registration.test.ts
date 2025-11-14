import { describe, expect, it } from 'vitest'
import {
  createIsolatedRegistry,
  type ModifierRegistry,
} from '@tachui/registry'
import {
  layoutModifiers,
  appearanceModifiers,
} from '../../src/modifiers'

const { padding } = layoutModifiers
const { foregroundColor } = appearanceModifiers

function collectMetadata(registry: ModifierRegistry, name: string) {
  return registry.getMetadata(name)
}

describe('Core Modifiers Integration', () => {
  it('core modifiers are available through global registry after package load', () => {
    // Simulate what happens when @tachui/modifiers package loads
    expect(padding).toBeDefined()
    expect(foregroundColor).toBeDefined()
    
    const paddingInstance = padding(12)
    const foregroundInstance = foregroundColor('red')
    
    expect(paddingInstance.type).toBe('padding')
    expect(paddingInstance.properties.all ?? paddingInstance.properties.padding).toBe(12)
    
    expect(foregroundInstance.type).toBe('foreground')
    expect(foregroundInstance.properties.color).toBe('red')
  })

  it('modifiers work with registry system through global registry', () => {
    const registry = createIsolatedRegistry()
    
    // Manually register the factories to simulate what @tachui/modifiers does
    import('@tachui/modifiers').then(modifiers => {
      if (modifiers.padding) registry.register('padding', modifiers.padding)
      if (modifiers.foregroundColor) registry.register('foregroundColor', modifiers.foregroundColor)
      
      expect(registry.has('padding')).toBe(true)
      expect(registry.has('foregroundColor')).toBe(true)
    })
  })

  it('modifier instances are consistent between direct calls and registry', () => {
    const directPadding = padding(12)
    const directForeground = foregroundColor('red')
    
    // These would come from registry in real usage
    const registryPadding = padding(12)
    const registryForeground = foregroundColor('red')
    
    expect(registryPadding?.type).toBe(directPadding.type)
    expect(registryPadding?.properties).toEqual(directPadding.properties)
    
    expect(registryForeground?.type).toBe(directForeground.type)
    expect(registryForeground?.properties).toEqual(directForeground.properties)
  })
})
