/**
 * Slider Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createSignal, renderComponent } from '@tachui/core'
import { Slider } from '../src/components/advanced/Slider'

describe('Slider', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('should create Slider component', () => {
    const slider = Slider({
      value: 50,
      in: [0, 100],
    })

    expect(slider).toBeDefined()
    expect(slider.type).toBe('component')
  })

  it('should handle static values', () => {
    const slider = Slider({
      value: 25,
      in: [0, 100],
    })

    expect(slider).toBeDefined()
    expect(typeof slider).toBe('object')
  })

  it('should support step values', () => {
    const slider = Slider({
      value: 50,
      in: [0, 100],
      step: 10,
    })

    expect(slider).toBeDefined()
  })

  it('should support range configuration', () => {
    const slider = Slider({
      value: 50,
      in: [0, 100],
      step: 5,
    })

    expect(slider).toBeDefined()
    expect(typeof slider).toBe('object')
  })
})

describe('Slider interaction', () => {
  const mounted: Array<() => void> = []

  function mount(component: any) {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const dispose = renderComponent(component, host)
    mounted.push(() => {
      dispose()
      host.remove()
    })
    return host
  }

  // Render runs inside a reactive effect, and effects are flushed on a
  // microtask, so a state change only reaches the DOM after a tick.
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  afterEach(() => {
    while (mounted.length > 0) mounted.pop()!()
  })

  it('calls onValueChange when the range input reports a new value', () => {
    const [value, setValue] = createSignal(10)
    const onValueChange = vi.fn((next: number) => setValue(next))
    const host = mount(Slider(value, { onValueChange, min: 0, max: 100 }))

    const input = host.querySelector('input')!
    input.value = '42'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith(42)
    expect(value()).toBe(42)
  })

  it('snaps the reported value to the step', () => {
    const [value] = createSignal(0)
    const onValueChange = vi.fn()
    const host = mount(Slider(value, { onValueChange, min: 0, max: 100, step: 10 }))

    const input = host.querySelector('input')!
    input.value = '47'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(onValueChange).toHaveBeenCalledWith(50)
  })

  it('clamps the reported value to the range', () => {
    const [value] = createSignal(0)
    const onValueChange = vi.fn()
    const host = mount(Slider(value, { onValueChange, min: 0, max: 50 }))

    const input = host.querySelector('input')!
    input.value = '120'
    input.dispatchEvent(new Event('input', { bubbles: true }))

    expect(onValueChange).toHaveBeenCalledWith(50)
  })

  it('does not leave a ref callback on the rendered input', () => {
    const [value] = createSignal(10)
    const host = mount(Slider(value, {}))

    expect(host.querySelector('input')!.hasAttribute('ref')).toBe(false)
  })

  it('renders the track fill for the current value and follows it', async () => {
    const [value, setValue] = createSignal(25)
    const host = mount(Slider(value, { onValueChange: setValue, min: 0, max: 100 }))
    const input = host.querySelector('input') as HTMLInputElement

    expect(input.style.getPropertyValue('--slider-progress')).toBe('25%')

    setValue(75)
    await flush()

    expect(input.style.getPropertyValue('--slider-progress')).toBe('75%')
    expect(input.value).toBe('75')
  })
})
