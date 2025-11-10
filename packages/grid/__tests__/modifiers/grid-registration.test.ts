import { describe, expect, it } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import {
  registerGridModifiers,
  gridColumnSpan,
  gridArea,
} from '../../src'

describe('@tachui/grid modifiers', () => {
  it('registers runtime factories and metadata', () => {
    const registry = createIsolatedRegistry()
    registerGridModifiers({ registry })

    const columnMeta = registry.getMetadata('gridColumnSpan')
    const areaMeta = registry.getMetadata('gridArea')

    expect(columnMeta?.plugin).toBe('@tachui/grid')
    expect(columnMeta?.category).toBe('layout')
    expect(areaMeta?.priority).toBeGreaterThan(0)

    const factory = registry.get('gridColumnSpan')
    expect(factory).toBeDefined()

    const instance = factory?.(3)
    const direct = gridColumnSpan(3)

    expect(instance?.type).toBe(direct.type)
    expect(instance?.properties).toEqual(direct.properties)

    const areaFactory = registry.get('gridArea')
    const areaInstance = areaFactory?.('sidebar')
    const areaDirect = gridArea('sidebar')
    expect(areaInstance?.properties).toEqual(areaDirect.properties)
  })
})
