import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toggle } from '../../src/components/Toggle'
import { createSignal } from '../../src/reactive'

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
  text: vi.fn((content) => ({
    type: 'text',
    content,
  })),
}))

describe('Toggle Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      .modifier.padding(8)
      .disabled(false)
      .build()

    const rendered = toggle.render()
    expect(rendered).toBeDefined()
  })
})
