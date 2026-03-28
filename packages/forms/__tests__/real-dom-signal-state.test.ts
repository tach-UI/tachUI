import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSignal, DOMRenderer } from '@tachui/core'
import { createRoot } from '@tachui/core/reactive'
import type { ComponentInstance, DOMNode } from '@tachui/core'
import { TextField } from '../src/components/text-input/TextField'
import { Select } from '../src/components/selection/Select'
import { Checkbox } from '../src/components/selection/Checkbox'
import { Slider } from '../src/components/advanced/Slider'

describe('Real DOM signal state integration', () => {
  let container: HTMLElement
  let renderer: DOMRenderer
  let testDisposers: Array<() => void>

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
    testDisposers = []
  })

  afterEach(() => {
    while (testDisposers.length > 0) {
      const dispose = testDisposers.pop()
      dispose?.()
    }
    container.remove()
  })

  const waitForUpdate = async (): Promise<void> => {
    await new Promise<void>(resolve => queueMicrotask(resolve))
    await new Promise<void>(resolve => setTimeout(resolve, 0))
  }

  const mountComponent = (component: ComponentInstance): HTMLElement => {
    const rendered = component.render() as DOMNode | DOMNode[]
    const node = Array.isArray(rendered) ? rendered[0] : rendered
    const element = renderer.render(node) as HTMLElement
    container.appendChild(element)
    return element
  }

  it('updates TextField disabled and readOnly from signals in mounted DOM', async () => {
    const { disabled, setDisabled, readOnly, setReadOnly } = createRoot(
      dispose => {
        testDisposers.push(dispose)
        const [disabled, setDisabled] = createSignal(false)
        const [readOnly, setReadOnly] = createSignal(false)
        mountComponent(
          TextField({
            name: 'signal-textfield',
            disabled,
            readOnly,
          })
        )
        return { disabled, setDisabled, readOnly, setReadOnly }
      }
    )

    const input = container.querySelector('input') as HTMLInputElement
    expect(input.disabled).toBe(false)
    expect(input.readOnly).toBe(false)

    setDisabled(true)
    setReadOnly(true)
    await waitForUpdate()

    expect(input.disabled).toBe(true)
    expect(input.readOnly).toBe(true)
  })

  it('updates Select disabled state from signal in mounted DOM', async () => {
    const { disabled, setDisabled } = createRoot(dispose => {
      testDisposers.push(dispose)
      const [disabled, setDisabled] = createSignal(false)
      mountComponent(
        Select({
          name: 'signal-select',
          options: [{ value: 'one', label: 'One' }],
          disabled,
        })
      )
      return { disabled, setDisabled }
    })

    const trigger = container.querySelector(
      '[data-tachui-select-trigger]'
    ) as HTMLElement
    const selectContainer = container.querySelector(
      '[data-tachui-select-container]'
    ) as HTMLElement

    expect(trigger.hasAttribute('data-disabled')).toBe(false)
    expect(trigger.tabIndex).toBe(0)
    expect(selectContainer.getAttribute('data-open')).not.toBe('true')

    setDisabled(true)
    await waitForUpdate()

    expect(trigger.hasAttribute('data-disabled')).toBe(true)
    expect(trigger.tabIndex).toBe(-1)
    trigger.click()
    await waitForUpdate()
    expect(selectContainer.getAttribute('data-open')).not.toBe('true')
  })

  it('updates Checkbox disabled state from signal in mounted DOM', async () => {
    const { disabled, setDisabled } = createRoot(dispose => {
      testDisposers.push(dispose)
      const [disabled, setDisabled] = createSignal(false)
      mountComponent(
        Checkbox({
          name: 'signal-checkbox',
          label: 'Signal checkbox',
          disabled,
        })
      )
      return { disabled, setDisabled }
    })

    const input = container.querySelector(
      '[data-tachui-checkbox-input]'
    ) as HTMLInputElement
    expect(input.disabled).toBe(false)

    setDisabled(true)
    await waitForUpdate()

    expect(input.disabled).toBe(true)
  })

  it('updates Slider disabled state from signal in mounted DOM', async () => {
    const { disabled, setDisabled } = createRoot(dispose => {
      testDisposers.push(dispose)
      const [value] = createSignal(25)
      const [disabled, setDisabled] = createSignal(false)
      mountComponent(Slider(value, { disabled }))
      return { disabled, setDisabled }
    })

    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input.disabled).toBe(false)

    setDisabled(true)
    await waitForUpdate()

    expect(input.disabled).toBe(true)
  })
})
