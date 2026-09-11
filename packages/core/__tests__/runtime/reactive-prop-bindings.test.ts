/**
 * Reactive prop bindings across re-renders.
 *
 * A re-render re-applies an element's props, and a prop whose value is
 * reactive gets a fresh effect each time. The render owner disposes the old
 * effect, but the cleanup closure holding it lives on the element until
 * unmount — so an element that re-renders often accumulated one closure per
 * render, each retaining an effect, whatever it subscribed to, and any
 * component rebuilt alongside it.
 */

import { describe, expect, it } from 'vitest'
import v8 from 'node:v8'
import vm from 'node:vm'

import { createMemo, createSignal } from '../../src/reactive'
import { h, renderComponent } from '../../src/runtime/renderer'

/** Forced collection, obtained in-process so no runner flag is needed. */
const collect: () => void = (() => {
  v8.setFlagsFromString('--expose-gc')
  try {
    return vm.runInNewContext('gc') as () => void
  } finally {
    v8.setFlagsFromString('--no-expose-gc')
  }
})()

const settle = (): Promise<unknown> =>
  new Promise(resolve => setTimeout(resolve, 0))

async function collectGarbage(): Promise<void> {
  for (let cycle = 0; cycle < 4; cycle += 1) {
    await settle()
    collect()
  }
}

describe('a reactive prop re-applied by a re-render', () => {
  it('keeps only the binding that is current', async () => {
    const [tick, setTick] = createSignal(0)
    const refs: WeakRef<object>[] = []
    const host = document.createElement('div')
    document.body.appendChild(host)

    const component = {
      type: 'component' as const,
      id: 'subject',
      props: {},
      render: () => {
        const generation = tick()
        const [enabled] = createSignal(true)
        // Reachable only through the props of this generation's element.
        const marker = { generation, ballast: new Uint8Array(1024) }
        refs.push(new WeakRef(marker))
        return h('button', {
          disabled: createMemo(() => {
            void marker
            return !enabled()
          }),
        })
      },
    }

    renderComponent(component as never, host)
    await settle()
    for (let generation = 1; generation <= 6; generation += 1) {
      setTick(generation)
      await settle()
    }
    await collectGarbage()

    // One live binding, not seven. Every superseded generation is released,
    // rather than held on the element until it unmounts.
    const retained = refs.filter(ref => ref.deref() !== undefined)
    expect(refs).toHaveLength(7)
    expect(retained).toHaveLength(1)

    host.remove()
  })
})
