/**
 * Responsive builder through the internal builder seam
 *
 * The responsive builder appends through `addModifier`, which is on the
 * internal builder rather than the public one. Every path must still apply
 * its modifier to the builder and sync it onto the component's `modifiers`
 * array, and build without duplicating it.
 */

import { describe, it, expect } from 'vitest'
import { createModifierBuilder } from '@tachui/core'
import type { ComponentInstance, Modifier } from '@tachui/core'
import {
  createResponsiveBuilder,
  ResponsiveModifierBuilderImpl,
  withResponsive,
} from '../../../src/modifiers/responsive'

type SyncedComponent = ComponentInstance & { modifiers: Modifier[] }

function modifiableComponent(): SyncedComponent {
  return {
    type: 'component',
    props: {},
    children: [],
    id: 'responsive-seam',
    modifiers: [],
    render: () => ({
      type: 'element',
      element: document.createElement('div'),
    }),
  } as unknown as SyncedComponent
}

function pending(builder: unknown): Modifier[] {
  return (builder as { modifiers: Modifier[] }).modifiers
}

describe('responsive builder through the internal builder seam', () => {
  it('applies and syncs a responsive method modifier', () => {
    const component = modifiableComponent()
    const base = createModifierBuilder(component)

    withResponsive(base).responsivePadding({ base: 8, md: 16 })

    expect(component.modifiers).toHaveLength(1)
    expect(pending(base)).toEqual(component.modifiers)
  })

  it('applies and syncs breakpoint shorthand modifiers', () => {
    const component = modifiableComponent()
    const base = createModifierBuilder(component)
    const responsive = createResponsiveBuilder(base)

    const chained = responsive.md.padding(16).lg.width(320)

    expect(chained).toBeInstanceOf(ResponsiveModifierBuilderImpl)
    expect(component.modifiers).toHaveLength(2)
    expect(pending(base)).toEqual(component.modifiers)
  })

  it('syncs both sides of a paired shorthand', () => {
    const component = modifiableComponent()
    const base = createModifierBuilder(component)

    withResponsive(base).sm.paddingHorizontal(4).sm.marginVertical(2)

    expect(component.modifiers).toHaveLength(4)
    expect(pending(base)).toEqual(component.modifiers)
  })

  it('builds without duplicating the synced modifiers', () => {
    const component = modifiableComponent()
    const base = createModifierBuilder(component)

    const built = withResponsive(base)
      .responsiveWidth({ base: '100%', lg: 480 })
      .md.fontSize(18)
      .build() as SyncedComponent

    expect(built.modifiers).toHaveLength(2)
    expect(built.modifiers).toEqual(component.modifiers)
  })

  it('leaves a component without a modifiers array unsynced', () => {
    const component = modifiableComponent() as Partial<SyncedComponent>
    delete component.modifiers
    const base = createModifierBuilder(component as ComponentInstance)

    withResponsive(base).md.padding(16)

    expect(pending(base)).toHaveLength(1)
    expect('modifiers' in component).toBe(false)
  })
})
