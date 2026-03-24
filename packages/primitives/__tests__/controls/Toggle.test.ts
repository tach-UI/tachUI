import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Toggle } from '../../src/controls/Toggle'
import { createSignal } from '@tachui/core'
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
    const spans = findElementsByTag(rendered, 'span')
    const label = spans.find(span => typeof span.props?.id === 'string')

    expect(input).toBeDefined()
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
    const spans = findElementsByTag(rendered, 'span')
    const label = spans.find(span => typeof span.props?.id === 'string')

    expect(input).toBeDefined()
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
