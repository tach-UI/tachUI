/**
 * The internal builder methods at runtime
 *
 * `addModifier` and `.modifier()` left the public builder type, not the
 * runtime builder. Both still append, `.modifier()` still warns in
 * development, and `addModifier` stays silent: discouraging it is the type's
 * job alone.
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createModifierBuilder } from '../../src/modifiers'
import type { InternalModifierBuilder, Modifier } from '../../src/modifiers'
import type { ComponentInstance } from '../../src/runtime/types'

type SyncedComponent = ComponentInstance & { modifiers: Modifier[] }

function internalBuilder(component: ComponentInstance) {
  return createModifierBuilder(
    component
  ) as InternalModifierBuilder<ComponentInstance>
}

function modifiableComponent(): SyncedComponent {
  return {
    type: 'component',
    props: {},
    id: 'internal-builder',
    modifiers: [],
    render: () => [],
  } as unknown as SyncedComponent
}

const layoutModifier = (): Modifier =>
  ({
    type: 'layout',
    priority: 100,
    properties: { padding: 12 },
    apply: (node: unknown) => node,
  }) as unknown as Modifier

describe('internal modifier builder at runtime', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it('addModifier appends, syncs the component and warns about nothing', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = modifiableComponent()
    const builder = internalBuilder(component)
    const modifier = layoutModifier()

    expect(builder.addModifier(modifier)).toBeUndefined()

    expect(component.modifiers).toEqual([modifier])
    expect((builder as any).modifiers).toEqual([modifier])
    expect(warn).not.toHaveBeenCalled()
  })

  it('modifier() appends, continues the chain and warns in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const component = modifiableComponent()
    const builder = internalBuilder(component)
    const modifier = layoutModifier()

    expect(builder.modifier(modifier)).toBe(builder)

    expect((builder as any).modifiers).toEqual([modifier])
    expect(component.modifiers).toEqual([])
    expect(warn).toHaveBeenCalledTimes(1)
    expect(warn.mock.calls[0][0]).toContain('component.padding(16)')
  })

  it('modifier() is silent outside development', () => {
    vi.stubEnv('NODE_ENV', 'production')
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const builder = internalBuilder(modifiableComponent())

    builder.modifier(layoutModifier())

    expect(warn).not.toHaveBeenCalled()
  })
})
