/**
 * What the direct mount path releases when it unmounts.
 *
 * `mountComponentTree` is how sheets, popovers, inspectors and split-view
 * regions put their contents on screen, and they mount and unmount repeatedly.
 * Everything the renderer sets up for a reactive prop is registered against the
 * element; releasing it is a matter of disposing the nodes the mount created,
 * which this path did not do — so a component with a reactive prop retained an
 * observer on the caller's signal per mount, for the life of the process.
 */

import { describe, expect, it } from 'vitest'

import { createSignal, getSignalImpl } from '../../src/reactive'
import { h } from '../../src/runtime/renderer'
import { mountComponentTree } from '../../src/runtime/dom-bridge'

describe('unmounting a directly mounted tree', () => {
  it('releases the renderer bindings its props created', () => {
    const [enabled] = createSignal(true)
    const observers = (): number =>
      (getSignalImpl(enabled as never) as unknown as {
        observers: Set<unknown>
      }).observers.size
    const baseline = observers()

    for (let cycle = 0; cycle < 5; cycle += 1) {
      const container = document.createElement('div')
      document.body.appendChild(container)
      const component = {
        type: 'component' as const,
        id: `subject-${cycle}`,
        props: {},
        render: () => h('button', { disabled: enabled }),
      }
      const dispose = mountComponentTree(component as never, container)
      dispose()
      container.remove()
    }

    // Every cycle, not merely the last: an unreleased binding here is not a
    // one-off but one more for every time the surface has been opened.
    expect(observers()).toBe(baseline)
  })
})
