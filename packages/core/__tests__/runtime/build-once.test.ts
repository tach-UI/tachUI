import { describe, expect, it } from 'vitest'

import { createEffect, createSignal } from '../../src/reactive'
import { Layout } from '../../src/components/wrapper'
import { h, renderComponent, text } from '../../src/runtime/renderer'
import type { ComponentInstance } from '../../src/runtime/types'

/**
 * `renderComponent` builds a ModifierBuilder once, before it starts rendering.
 * `build()` clones the base component, so building inside the render effect
 * would hand back a fresh instance on every re-render — discarding the state
 * the component holds, and disposing the effects its constructor opened, since
 * the render effect owns whatever runs inside it.
 */
describe('renderComponent builds a component once', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  interface Record {
    instances: StatefulComponent[]
  }

  /**
   * Stands in for a component that keeps state of its own, renders from that
   * state, and reports it through a callback from a constructor effect — the
   * shape `BasicForm` has. `build()` is what the renderer looks for, and it
   * clones the way the real modifier builder does.
   */
  class StatefulComponent implements ComponentInstance {
    public readonly type = 'component' as const
    public readonly id = 'stateful'
    public mounted = false
    public cleanup: (() => void)[] = []

    public readonly count: () => number
    private readonly setCount: (value: number) => number

    constructor(
      public props: { onCount?: (value: number) => void },
      private readonly record: Record
    ) {
      record.instances.push(this)

      const [count, setCount] = createSignal(0)
      this.count = count
      this.setCount = setCount

      createEffect(() => {
        this.props.onCount?.(this.count())
      })
    }

    increment() {
      this.setCount(this.count() + 1)
    }

    build() {
      return new StatefulComponent(this.props, this.record)
    }

    render() {
      return h('div', {}, text(String(this.count())))
    }
  }

  function mount(onCount?: (value: number) => void) {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const record: Record = { instances: [] }
    const dispose = renderComponent(
      new StatefulComponent({ onCount }, record) as ComponentInstance,
      host
    )

    return {
      host,
      record,
      teardown: () => {
        dispose()
        host.remove()
      },
    }
  }

  it('builds exactly once for a mount', async () => {
    const { host, record, teardown } = mount()
    await flush()

    // The instance under test, and the one `build()` produced at mount.
    expect(record.instances).toHaveLength(2)
    expect(host.textContent).toBe('0')

    teardown()
  })

  it('renders the built instance rather than a fresh clone each time', async () => {
    const { host, record, teardown } = mount()
    await flush()

    const rendered = record.instances[1]
    rendered.increment()
    await flush()

    expect(host.textContent).toBe('1')
    expect(record.instances).toHaveLength(2)

    teardown()
  })

  it("keeps the built instance's constructor effect alive across re-renders", async () => {
    const counted: number[] = []
    const { record, teardown } = mount(value => counted.push(value))
    await flush()

    const rendered = record.instances[1]
    rendered.increment()
    await flush()
    rendered.increment()
    await flush()

    // Two instances, each reporting 0 once at construction, then the built one
    // reporting every step it took. A rebuild per render would lose the steps.
    expect(counted).toEqual([0, 0, 1, 2])

    teardown()
  })
})

/**
 * A layout container builds each child once too, for the same reason
 * `renderComponent` does — its `render()` re-runs whenever the container
 * re-renders, and a child rebuilt there would be a fresh clone each time.
 */
describe('a layout container builds each child once', () => {
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  class StatefulChild implements ComponentInstance {
    public readonly type = 'component' as const
    public readonly id: string
    public mounted = false
    public cleanup: (() => void)[] = []

    public readonly label: () => string
    private readonly setLabel: (value: string) => string

    constructor(
      public props: Record<string, never>,
      private readonly built: StatefulChild[],
      id: string
    ) {
      this.id = id
      built.push(this)

      const [label, setLabel] = createSignal('initial')
      this.label = label
      this.setLabel = setLabel
    }

    rename(value: string) {
      this.setLabel(value)
    }

    build() {
      return new StatefulChild(this.props, this.built, this.id)
    }

    render() {
      return h('span', {}, text(this.label()))
    }
  }

  it("keeps a stack child's state across a re-render of the stack", async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)

    const built: StatefulChild[] = []
    const [heading, setHeading] = createSignal('one')

    const child = new StatefulChild({}, built, 'stateful-child')
    const stack = Layout.VStack({
      children: [child as ComponentInstance, ReactiveHeading(heading)],
    })

    const dispose = renderComponent(stack as ComponentInstance, host)
    await flush()

    // The container under test, plus the one build at mount.
    expect(built).toHaveLength(2)
    const rendered = built[1]

    rendered.rename('renamed')
    await flush()
    expect(host.textContent).toContain('renamed')

    // Re-render the stack for a reason that has nothing to do with the child.
    setHeading('two')
    await flush()

    expect(host.textContent).toContain('two')
    expect(host.textContent).toContain('renamed')
    expect(built).toHaveLength(2)

    dispose()
    host.remove()
  })

  function ReactiveHeading(heading: () => string): ComponentInstance {
    return {
      type: 'component',
      id: 'heading',
      props: {},
      mounted: false,
      cleanup: [],
      render: () => h('h1', {}, text(heading())),
    }
  }
})
