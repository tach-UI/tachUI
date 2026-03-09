import { describe, expect, it } from 'vitest'
import { createEffect } from '../../src/reactive'
import { globalModifierRegistry } from '@tachui/registry'
import {
  createModifierApplySpy,
  createReactiveTestComponent,
  createTestRegistry,
  expectUpdates,
  getSubscriberCount,
  simulateIntersection,
} from '../../tools/testing/reactive-test-helpers'

describe('reactive-test-helpers', () => {
  it('createModifierApplySpy tracks initial and re-application calls', async () => {
    const spy = createModifierApplySpy('fontSize')
    const component = createReactiveTestComponent({
      initialValue: 12,
      styleProperty: 'font-size',
      mapValueToStyle: value => `${value}px`,
    })

    const effect = createEffect(() => {
      spy.track(component.signal.get())
    })

    expect(spy.callCount).toBe(1)
    component.signal.set(16)
    await Promise.resolve()
    expect(spy.callCount).toBe(2)
    expect(spy.lastArgs).toEqual([16])
    spy.reset()
    expect(spy.callCount).toBe(0)
    expect(spy.lastArgs).toEqual([])

    effect.dispose()
    component.component.dispose()
  })

  it('createReactiveTestComponent exposes signal, dom, and applied styles', async () => {
    const component = createReactiveTestComponent({
      initialValue: 0.25,
      styleProperty: 'opacity',
    })

    expect(component.dom.style.getPropertyValue('opacity')).toBe('0.25')

    component.signal.set(0.75)
    await Promise.resolve()

    const styles = component.getAppliedStyles()
    expect(styles.opacity).toBe('0.75')

    component.component.dispose()
  })

  it('expectUpdates validates exact DOM mutation counts', async () => {
    const component = createReactiveTestComponent({
      initialValue: 0.2,
      styleProperty: 'opacity',
    })

    await expectUpdates(component.signal, 0.8, 1, [component])
    expect(component.dom.style.getPropertyValue('opacity')).toBe('0.8')

    component.component.dispose()
  })

  it('expectUpdates throws when expected count does not match actual updates', async () => {
    const component = createReactiveTestComponent({
      initialValue: 0.2,
      styleProperty: 'opacity',
    })

    await expect(expectUpdates(component.signal, 0.9, 2, [component])).rejects.toThrow()
    component.component.dispose()
  })

  it('createTestRegistry returns isolated registry instances', () => {
    const registry = createTestRegistry()
    const modifierName = 'testModifierIssue54'

    registry.register(modifierName, () => ({
      type: 'appearance',
      priority: 1,
      properties: {},
      apply: node => node,
    }))

    expect(registry.has(modifierName)).toBe(true)
    expect(globalModifierRegistry.has(modifierName)).toBe(false)
  })

  it('getSubscriberCount drops to zero after effect disposal', () => {
    const component = createReactiveTestComponent({
      initialValue: 10,
      styleProperty: 'z-index',
    })

    const baseline = getSubscriberCount(component.signal)
    expect(baseline).toBeGreaterThanOrEqual(1)

    const effect = createEffect(() => {
      component.signal.get()
    })

    expect(getSubscriberCount(component.signal)).toBe(baseline + 1)
    effect.dispose()
    expect(getSubscriberCount(component.signal)).toBe(baseline)

    component.component.dispose()
    expect(getSubscriberCount(component.signal)).toBe(0)
  })

  it('getSubscriberCount throws for invalid non-signal getters', () => {
    expect(() => getSubscriberCount((() => 42) as unknown as () => number)).toThrow(
      /expected a TachUI signal getter/
    )
  })

  it('simulateIntersection triggers observer callbacks in jsdom', () => {
    const element = document.createElement('div')
    const events: boolean[] = []

    const observer = new IntersectionObserver(entries => {
      events.push(entries[0]?.isIntersecting ?? false)
    })
    observer.observe(element)

    simulateIntersection(element, true)
    simulateIntersection(element, false)

    expect(events).toEqual([true, false])
    observer.disconnect()
  })
})
