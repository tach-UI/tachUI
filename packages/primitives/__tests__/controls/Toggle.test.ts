import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Toggle } from '../../src/controls/Toggle'
import { createSignal, renderComponent } from '@tachui/core'
import { configureCore } from '@tachui/core'

function findElementByTag(node: any, tag: string): any | null {
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findElementByTag(item, tag)
      if (found) return found
    }
    return null
  }

  if (!node || typeof node !== 'object') return null
  if (node.tag === tag) return node
  if (!Array.isArray(node.children)) return null

  for (const child of node.children) {
    const found = findElementByTag(child, tag)
    if (found) return found
  }

  return null
}

function findElementsByTag(node: any, tag: string, output: any[] = []): any[] {
  if (Array.isArray(node)) {
    for (const item of node) {
      findElementsByTag(item, tag, output)
    }
    return output
  }

  if (!node || typeof node !== 'object') return output
  if (node.tag === tag) output.push(node)
  if (!Array.isArray(node.children)) return output

  for (const child of node.children) {
    findElementsByTag(child, tag, output)
  }

  return output
}

vi.mock('../../runtime/renderer', () => ({
  DOMRenderer: vi.fn().mockImplementation(() => ({
    render: vi.fn(),
    cleanup: vi.fn(),
  })),
  h: vi.fn((tag, props, ...children) => ({
    type: 'element',
    tag,
    props: props || {},
    children: children.flat().filter(Boolean),
  })),
  text: vi.fn(content => ({
    type: 'text',
    content,
  })),
}))

describe('Toggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    configureCore({ proxyModifiers: true })
  })

  it('should create toggle with default props', () => {
    const [isOn, setIsOn] = createSignal(false)
    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
    })

    expect(toggle).toBeDefined()
    expect(toggle.render).toBeDefined()
  })

  it('should handle toggle changes', () => {
    const [isOn, _setIsOn] = createSignal(false)
    const onToggle = vi.fn()

    const toggle = Toggle(isOn, {
      onToggle,
    })

    const rendered = toggle.render()
    expect(rendered).toBeDefined()
  })

  it('should support different variants', () => {
    const [isOn, setIsOn] = createSignal(false)

    const switchToggle = Toggle(isOn, {
      onToggle: setIsOn,
      variant: 'switch',
    })

    const checkboxToggle = Toggle(isOn, {
      onToggle: setIsOn,
      variant: 'checkbox',
    })

    const buttonToggle = Toggle(isOn, {
      onToggle: setIsOn,
      variant: 'button',
    })

    expect(switchToggle).toBeDefined()
    expect(checkboxToggle).toBeDefined()
    expect(buttonToggle).toBeDefined()
  })

  it('should support label positioning', () => {
    const [isOn, setIsOn] = createSignal(false)

    const leadingToggle = Toggle(isOn, {
      onToggle: setIsOn,
      label: 'Enable notifications',
      labelPosition: 'leading',
    })

    const trailingToggle = Toggle(isOn, {
      onToggle: setIsOn,
      label: 'Enable notifications',
      labelPosition: 'trailing',
    })

    expect(leadingToggle).toBeDefined()
    expect(trailingToggle).toBeDefined()
  })

  it('should associate switch input with visible label text via aria-labelledby', () => {
    const [isOn, setIsOn] = createSignal(false)
    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
      label: 'Enable notifications',
      variant: 'switch',
    })

    const rendered = toggle.render()
    const input = findElementByTag(rendered, 'input')
    const labelElement = findElementByTag(rendered, 'label')
    const spans = findElementsByTag(rendered, 'span')
    const label = spans.find(span => typeof span.props?.id === 'string')

    expect(input).toBeDefined()
    expect(labelElement).toBeDefined()
    expect(labelElement?.props?.for).toBe(input.props?.id)
    expect(label).toBeDefined()
    expect(input.props?.id).toMatch(/-input$/)
    expect(label?.props?.id).toMatch(/-label$/)
    expect(input.props?.['aria-labelledby']).toBe(label?.props?.id)
  })

  it('should associate checkbox input with visible label text via aria-labelledby', () => {
    const [isOn, setIsOn] = createSignal(true)
    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
      label: 'Accept terms',
      variant: 'checkbox',
    })

    const rendered = toggle.render()
    const input = findElementByTag(rendered, 'input')
    const labelElement = findElementByTag(rendered, 'label')
    const spans = findElementsByTag(rendered, 'span')
    const label = spans.find(span => typeof span.props?.id === 'string')

    expect(input).toBeDefined()
    expect(labelElement).toBeDefined()
    expect(labelElement?.props?.for).toBe(input.props?.id)
    expect(label).toBeDefined()
    expect(input.props?.['aria-labelledby']).toBe(label?.props?.id)
  })

  it('should prefer explicit accessibilityLabel over aria-labelledby', () => {
    const [isOn, setIsOn] = createSignal(false)
    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
      label: 'Visible label',
      accessibilityLabel: 'Programmatic label',
      variant: 'switch',
    })

    const rendered = toggle.render()
    const input = findElementByTag(rendered, 'input')

    expect(input.props?.['aria-label']).toBe('Programmatic label')
    expect(input.props?.['aria-labelledby']).toBeUndefined()
  })

  it('should not set naming attributes when both label and accessibilityLabel are absent', () => {
    const [isOn, setIsOn] = createSignal(false)
    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
      variant: 'switch',
    })

    const rendered = toggle.render()
    const input = findElementByTag(rendered, 'input')

    expect(input.props?.['aria-label']).toBeUndefined()
    expect(input.props?.['aria-labelledby']).toBeUndefined()
  })

  it('should support disabled state', () => {
    const [isOn, setIsOn] = createSignal(false)

    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
      disabled: true,
    })

    const rendered = toggle.render()
    expect(rendered).toBeDefined()
  })

  it('should support custom colors', () => {
    const [isOn, setIsOn] = createSignal(true)

    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
      color: '#34C759',
      offColor: '#FF3B30',
    })

    const rendered = toggle.render()
    expect(rendered).toBeDefined()
  })

  it('should apply modifiers correctly', () => {
    const [isOn, setIsOn] = createSignal(false)

    const toggle = Toggle(isOn, {
      onToggle: setIsOn,
    })
      .padding(8)
      .disabled(false)
      .build()

    const rendered = toggle.render()
    expect(rendered).toBeDefined()
  })
})

describe('Toggle interaction', () => {
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

  // Render happens inside a reactive effect, and effects are flushed on a
  // microtask, so a state change only reaches the DOM after a tick.
  const flush = () => new Promise(resolve => setTimeout(resolve, 0))

  beforeEach(() => {
    configureCore({ proxyModifiers: true })
  })

  afterEach(() => {
    while (mounted.length > 0) mounted.pop()!()
  })

  it('calls onToggle when the hidden checkbox is clicked', () => {
    const [isOn, setIsOn] = createSignal(false)
    const onToggle = vi.fn((value: boolean) => setIsOn(value))
    const host = mount(Toggle(isOn, { onToggle }))

    host.querySelector('input')!.click()

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(onToggle).toHaveBeenCalledWith(true)
    expect(isOn()).toBe(true)
  })

  it('calls onToggle once when the wrapping label is clicked', () => {
    const [isOn, setIsOn] = createSignal(false)
    const onToggle = vi.fn((value: boolean) => setIsOn(value))
    const host = mount(Toggle(isOn, { onToggle, label: 'Enable notifications' }))

    host.querySelector('label')!.click()

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(isOn()).toBe(true)
  })

  it('calls onToggle for a synthetic change event', () => {
    const [isOn] = createSignal(false)
    const onToggle = vi.fn()
    const host = mount(Toggle(isOn, { onToggle }))

    host
      .querySelector('input')!
      .dispatchEvent(new Event('change', { bubbles: true }))

    expect(onToggle).toHaveBeenCalledWith(true)
  })

  it('toggles back off from an on state', () => {
    const [isOn, setIsOn] = createSignal(true)
    const onToggle = vi.fn((value: boolean) => setIsOn(value))
    const host = mount(Toggle(isOn, { onToggle }))

    host.querySelector('input')!.click()

    expect(onToggle).toHaveBeenCalledWith(false)
    expect(isOn()).toBe(false)
  })

  it('calls onToggle for the checkbox variant', () => {
    const [isOn, setIsOn] = createSignal(false)
    const onToggle = vi.fn((value: boolean) => setIsOn(value))
    const host = mount(Toggle(isOn, { onToggle, variant: 'checkbox' }))

    host.querySelector('input')!.click()

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(isOn()).toBe(true)
  })

  it('calls onToggle for the button variant', () => {
    const [isOn, setIsOn] = createSignal(false)
    const onToggle = vi.fn((value: boolean) => setIsOn(value))
    const host = mount(Toggle(isOn, { onToggle, variant: 'button' }))

    host.querySelector('button')!.click()

    expect(onToggle).toHaveBeenCalledTimes(1)
    expect(isOn()).toBe(true)
  })

  it('does not call onToggle while disabled', () => {
    const [isOn] = createSignal(false)
    const onToggle = vi.fn()
    const host = mount(Toggle(isOn, { onToggle, disabled: true }))

    host
      .querySelector('input')!
      .dispatchEvent(new Event('change', { bubbles: true }))

    expect(onToggle).not.toHaveBeenCalled()
  })

  it('does not leave a ref callback on the rendered input', () => {
    const [isOn] = createSignal(false)
    const host = mount(Toggle(isOn, {}))

    expect(host.querySelector('input')!.hasAttribute('ref')).toBe(false)
  })

  it('reflects an external state change in the input and the track', async () => {
    const [isOn, setIsOn] = createSignal(false)
    const host = mount(Toggle(isOn, { onToggle: setIsOn, color: '#34c759' }))
    const track = host.querySelector('input')!
      .nextElementSibling as HTMLElement

    expect(host.querySelector('input')!.checked).toBe(false)
    expect(track.style.backgroundColor).toBe('rgb(226, 232, 240)')

    setIsOn(true)
    await flush()

    expect(host.querySelector('input')!.checked).toBe(true)
    expect(track.style.backgroundColor).toBe('rgb(52, 199, 89)')
  })

  it('restores the hidden checkbox when the state does not follow the click', () => {
    const [isOn] = createSignal(false)
    const onToggle = vi.fn()
    const host = mount(Toggle(isOn, { onToggle }))
    const input = host.querySelector('input')!

    input.click()

    expect(onToggle).toHaveBeenCalledWith(true)
    expect(input.checked).toBe(false)
  })
})
