import { describe, expect, it } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import {
  registerResponsiveModifiers,
  createResponsiveModifier,
  createMediaQueryModifier,
} from '../../src'

describe('@tachui/responsive modifiers', () => {
  it('registers metadata for responsive factories', () => {
    const registry = createIsolatedRegistry()
    registerResponsiveModifiers({ registry })

    const responsiveMeta = registry.getMetadata('responsive')
    const mediaMeta = registry.getMetadata('mediaQuery')

    expect(responsiveMeta?.plugin).toBe('@tachui/responsive')
    expect(responsiveMeta?.category).toBe('layout')
    expect(mediaMeta?.priority).toBeGreaterThan(0)

    const responsiveFactory = registry.get('responsive')
    const responsiveInstance = responsiveFactory?.({
      padding: { base: 8, md: 16 },
    })
    const direct = createResponsiveModifier({
      padding: { base: 8, md: 16 },
    })
    expect(responsiveInstance?.type).toBe(direct.type)
    expect(responsiveInstance?.properties).toEqual(direct.properties)

    const mediaFactory = registry.get('mediaQuery')
    const mediaInstance = mediaFactory?.('(min-width: 800px)', {
      display: 'grid',
    })
    const mediaDirect = createMediaQueryModifier('(min-width: 800px)', {
      display: 'grid',
    })
    expect(mediaInstance?.properties).toEqual(mediaDirect.properties)
  })
})
