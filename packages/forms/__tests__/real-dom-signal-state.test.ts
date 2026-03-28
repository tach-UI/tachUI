import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createSignal, DOMRenderer } from '@tachui/core'
import type { ComponentInstance, DOMNode } from '@tachui/core'
import { TextField } from '../src/components/text-input/TextField'
import { Select } from '../src/components/selection/Select'
import { Checkbox } from '../src/components/selection/Checkbox'
import { Slider } from '../src/components/advanced/Slider'

describe('Real DOM signal state integration', () => {
  let container: HTMLElement
  let renderer: DOMRenderer

  beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
    renderer = new DOMRenderer()
  })

  afterEach(() => {
    container.remove()
  })

  const waitForUpdate = async (): Promise<void> => {
    await Promise.resolve()
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()))
  }

  const mountComponent = (component: ComponentInstance): HTMLElement => {
    const rendered = component.render() as DOMNode | DOMNode[]
    const node = Array.isArray(rendered) ? rendered[0] : rendered
    const element = renderer.render(node) as HTMLElement
    container.appendChild(element)
    return element
  }

  it('updates TextField disabled and readOnly from signals in mounted DOM', async () => {
    const [disabled, setDisabled] = createSignal(false)
    const [readOnly, setReadOnly] = createSignal(false)

    mountComponent(
      TextField({
        name: 'signal-textfield',
        disabled,
        readOnly,
      })
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
    const [disabled, setDisabled] = createSignal(false)

    mountComponent(
      Select({
        name: 'signal-select',
        options: [{ value: 'one', label: 'One' }],
        disabled,
      })
    )

    const trigger = container.querySelector(
      '[data-tachui-select-trigger]'
    ) as HTMLElement
    const selectContainer = container.querySelector(
      '[data-tachui-select-container]'
    ) as HTMLElement

    expect(trigger.hasAttribute('data-disabled')).toBe(false)
    expect(selectContainer.getAttribute('data-open')).not.toBe('true')

    setDisabled(true)
    await waitForUpdate()

    expect(trigger.hasAttribute('data-disabled')).toBe(true)
    trigger.click()
    await waitForUpdate()
    expect(selectContainer.getAttribute('data-open')).not.toBe('true')
  })

  it('updates Checkbox disabled state from signal in mounted DOM', async () => {
    const [disabled, setDisabled] = createSignal(false)

    mountComponent(
      Checkbox({
        name: 'signal-checkbox',
        label: 'Signal checkbox',
        disabled,
      })
    )

    const input = container.querySelector(
      '[data-tachui-checkbox-input]'
    ) as HTMLInputElement
    expect(input.disabled).toBe(false)

    setDisabled(true)
    await waitForUpdate()

    expect(input.disabled).toBe(true)
  })

  it('updates Slider disabled state from signal in mounted DOM', async () => {
    const [value] = createSignal(25)
    const [disabled, setDisabled] = createSignal(false)

    const slider = Slider(value, { disabled })
    const rendered = slider.render() as DOMNode | DOMNode[]
    const node = Array.isArray(rendered) ? rendered[0] : rendered
    const element = renderer.render(node) as HTMLElement
    container.appendChild(element)

    const input = container.querySelector('input[type="range"]') as HTMLInputElement
    expect(input.disabled).toBe(false)

    setDisabled(true)
    await waitForUpdate()

    expect(input.disabled).toBe(true)
  })
})
