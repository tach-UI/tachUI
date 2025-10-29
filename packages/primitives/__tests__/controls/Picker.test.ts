import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Picker } from '../../src/controls/Picker'
import { createSignal } from '@tachui/core'

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

describe('Picker Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const testOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'orange', label: 'Orange' },
  ]

  it('should create picker with options', () => {
    const [selection, setSelection] = createSignal<string>('apple')
    const picker = Picker(selection, testOptions, {
      onSelectionChange: setSelection,
    })

    expect(picker).toBeDefined()
    expect(picker.render).toBeDefined()
  })

  it('should handle selection changes', () => {
    const [selection, _setSelection] = createSignal<string>('apple')
    const onSelectionChange = vi.fn()

    const picker = Picker(selection, testOptions, {
      onSelectionChange,
    })

    const rendered = picker.render()
    expect(rendered).toBeDefined()
  })

  it('should support different variants', () => {
    const [selection, setSelection] = createSignal<string>('apple')

    const dropdownPicker = Picker(selection, testOptions, {
      onSelectionChange: setSelection,
      variant: 'dropdown',
    })

    const wheelPicker = Picker(selection, testOptions, {
      onSelectionChange: setSelection,
      variant: 'wheel',
    })

    const segmentedPicker = Picker(selection, testOptions, {
      onSelectionChange: setSelection,
      variant: 'segmented',
    })

    expect(dropdownPicker).toBeDefined()
    expect(wheelPicker).toBeDefined()
    expect(segmentedPicker).toBeDefined()
  })

  it('should handle multi-selection', () => {
    const [selections, setSelections] = createSignal<string[]>(['apple'])

    const picker = Picker(selections, testOptions, {
      onSelectionChange: setSelections,
      multiple: true,
    })

    const rendered = picker.render()
    expect(rendered).toBeDefined()
  })

  it('should support searchable picker', () => {
    const [selection, setSelection] = createSignal<string>('apple')

    const picker = Picker(selection, testOptions, {
      onSelectionChange: setSelection,
      searchable: true,
      placeholder: 'Search fruits...',
    })

    const rendered = picker.render()
    expect(rendered).toBeDefined()
  })

  it('should apply modifiers correctly', () => {
    const [selection, setSelection] = createSignal<string>('apple')

    const picker = Picker(selection, testOptions, {
      onSelectionChange: setSelection,
    })
      .padding(8)
      .cornerRadius(6)
      .backgroundColor('white')
      .build()

    const rendered = picker.render()
    expect(rendered).toBeDefined()
  })
})
