import { describe, expect, it } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import {
  registerMobileModifiers,
  refreshable,
} from '../../src/modifiers'
import { MobileGestureModifier } from '../../src/modifiers/gestures'

describe('@tachui/mobile modifiers', () => {
  it('registers refreshable modifier with metadata', () => {
    const registry = createIsolatedRegistry()
    registerMobileModifiers({ registry })

    const meta = registry.getMetadata('refreshable')
    expect(meta?.plugin).toBe('@tachui/mobile')
    expect(meta?.category).toBe('interaction')

    const factory = registry.get('refreshable')
    expect(factory).toBeDefined()

    const onRefresh = async () => {}
    const direct = refreshable({ onRefresh })
    const fromRegistry = factory?.({ onRefresh })

    expect(fromRegistry).toBeInstanceOf(MobileGestureModifier)
    expect(fromRegistry?.properties.refreshable?.isRefreshing).toBeUndefined()
    expect(
      typeof fromRegistry?.properties.refreshable?.onRefresh,
    ).toBe('function')
    expect(
      fromRegistry?.properties.refreshable?.onRefresh,
    ).toBe(direct.properties.refreshable?.onRefresh)
  })
})
