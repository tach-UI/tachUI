import { describe, expect, it } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import { registerCoreModifiers } from '../../src/modifiers'
import { registerFormsModifiers } from '@tachui/forms/modifiers'
import { registerGridModifiers } from '@tachui/grid'
import { registerResponsiveModifiers } from '@tachui/responsive'
import { registerMobileModifiers } from '@tachui/mobile/modifiers'
import { registerViewportModifiers } from '@tachui/viewport/modifiers'

describe('plugin modifier registration', () => {
  it('hydrates a shared registry with core and plugin metadata', () => {
    const registry = createIsolatedRegistry()

    registerCoreModifiers({ registry })
    registerFormsModifiers({ registry })
    registerGridModifiers({ registry })
    registerResponsiveModifiers({ registry })
    registerMobileModifiers({ registry })
    registerViewportModifiers({ registry })

    const plugins = registry.listPlugins().map(plugin => plugin.name)

    expect(plugins).toContain('@tachui/core')
    expect(plugins).toContain('@tachui/forms')
    expect(plugins).toContain('@tachui/grid')
    expect(plugins).toContain('@tachui/responsive')
    expect(plugins).toContain('@tachui/mobile')
    expect(plugins).toContain('@tachui/viewport')

    const conflicts = registry.getConflicts()
    expect(conflicts.size).toBe(0)
  })
})
