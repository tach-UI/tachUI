import { describe, expect, it, vi } from 'vitest'
import { createIsolatedRegistry } from '@tachui/registry'
import {
  registerViewportModifiers,
  onAppear,
  onDisappear,
} from '../../src/modifiers'

describe('@tachui/viewport modifiers', () => {
  it('registers lifecycle modifiers with metadata', () => {
    const registry = createIsolatedRegistry()
    registerViewportModifiers({ registry })

    const appearMeta = registry.getMetadata('onAppear')
    const disappearMeta = registry.getMetadata('onDisappear')

    expect(appearMeta?.plugin).toBe('@tachui/viewport')
    expect(disappearMeta?.category).toBe('interaction')

    const appearFactory = registry.get('onAppear')
    const disappearFactory = registry.get('onDisappear')

    const onAppearHandler = () => {}
    const appearModifier = appearFactory?.(onAppearHandler)
    const directAppear = onAppear(onAppearHandler)
    expect(
      appearModifier?.properties.onAppear,
    ).toBe(directAppear.properties.onAppear)

    const spy = vi.fn()
    const disappearModifier = disappearFactory?.(spy)
    const directDisappear = onDisappear(spy)
    expect(disappearModifier?.properties.onDisappear).toBe(
      directDisappear.properties.onDisappear,
    )
  })
})
