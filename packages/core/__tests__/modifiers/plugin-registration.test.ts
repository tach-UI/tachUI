import { describe, expect, it } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import { registerModifiers as registerBasicModifiers } from '@tachui/modifiers'
import { registerFormsModifiers } from '@tachui/forms'
import { registerGridModifiers } from '@tachui/grid'
import { registerResponsiveModifiers } from '@tachui/responsive'
import { registerMobileModifiers } from '@tachui/mobile'
import { registerViewportModifiers } from '@tachui/viewport'

describe('plugin modifier registration', () => {
  it('hydrates a shared registry with core and plugin metadata', () => {
    const registry = createIsolatedRegistry()

    registerBasicModifiers({ registry })
    registerFormsModifiers({ registry })
    registerGridModifiers({ registry })
    registerResponsiveModifiers({ registry })
    registerMobileModifiers({ registry })
    registerViewportModifiers({ registry })

    const plugins = registry.listPlugins().map(plugin => plugin.name)

    expect(plugins).toContain('@tachui/forms')
    expect(plugins).toContain('@tachui/grid')
    expect(plugins).toContain('@tachui/responsive')
    expect(plugins).toContain('@tachui/mobile')
    expect(plugins).toContain('@tachui/viewport')

    const conflicts = registry.getConflicts()
    expect(conflicts.size).toBe(0)
  })

  it('registers every plugin modifier with a signature derived from its factory', () => {
    const registry = createIsolatedRegistry()

    registerBasicModifiers({ registry })
    registerFormsModifiers({ registry })
    registerGridModifiers({ registry })
    registerResponsiveModifiers({ registry })
    registerMobileModifiers({ registry })
    registerViewportModifiers({ registry })

    const metadata = registry.getAllMetadata()
    expect(metadata.length).toBe(registry.list().length)
    for (const entry of metadata) {
      expect(entry.signature, String(entry.name)).toMatch(/^\(.*\): this$/)
    }

    expect(registry.getMetadata('placeholder')?.signature).toBe(
      '(value: PlaceholderValue): this',
    )
    expect(registry.getMetadata('gridCellColumns')?.signature).toBe(
      '(span: ReactiveNumber, start?: ReactiveNumber): this',
    )
    expect(registry.getMetadata('responsive')?.signature).toBe(
      '(config: ResponsiveStyleConfig): this',
    )
    expect(registry.getMetadata('refreshable')?.signature).toBe(
      '(options: RefreshableOptions): this',
    )
    expect(registry.getMetadata('onAppear')?.signature).toBe(
      '(handler: () => void): this',
    )
    expect(registry.getMetadata('onAppear')?.description).toBe(
      'Executes a callback when the component enters the viewport.',
    )
  })
})
