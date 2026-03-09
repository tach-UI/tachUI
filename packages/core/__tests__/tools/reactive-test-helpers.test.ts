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

    effect.dispose()
    component.component.dispose()
  })

  it('createReactiveTestComponent exposes signal, dom, and applied styles', async () => {
    const component = createReactiveTestComponent({
      initialValue: '#112233',
      styleProperty: 'color',
    })

    expect(component.dom.style.getPropertyValue('color')).toBe('rgb(17, 34, 51)')

    component.signal.set('#445566')
    await Promise.resolve()

    const styles = component.getAppliedStyles()
    expect(styles.color).toBe('rgb(68, 85, 102)')

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

    const effect = createEffect(() => {
      component.signal.get()
    })

    expect(getSubscriberCount(component.signal)).toBe(2)
    effect.dispose()
    expect(getSubscriberCount(component.signal)).toBe(1)

    component.component.dispose()
    expect(getSubscriberCount(component.signal)).toBe(0)
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
