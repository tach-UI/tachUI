import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Section } from '../../src/components/Section'

// Mock console.warn to suppress deprecation warnings in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})

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

describe('Section Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create section with title', () => {
    const section = Section([], { title: 'Personal Information' })

    expect(section).toBeDefined()
    expect(section.render).toBeDefined()
  })

  it('should create section with title and footer', () => {
    const section = Section([], {
      title: 'Settings',
      footer: 'Changes will be saved automatically',
    })

    const rendered = section.render()
    expect(rendered).toBeDefined()
  })

  it('should handle collapsible sections', () => {
    const section = Section([], {
      title: 'Advanced',
      collapsible: true,
      defaultExpanded: false,
    })

    const rendered = section.render()
    expect(rendered).toBeDefined()
  })

  it('should support different variants', () => {
    const plainSection = Section([], { variant: 'plain' })
    const groupedSection = Section([], { variant: 'grouped' })
    const insetSection = Section([], { variant: 'inset' })

    expect(plainSection).toBeDefined()
    expect(groupedSection).toBeDefined()
    expect(insetSection).toBeDefined()
  })

  it('should apply modifiers correctly', () => {
    const section = Section([], { title: 'Test' })
      .modifier.padding(12)
      .margin(8)
      .backgroundColor('#f5f5f5')
      .build()

    const rendered = section.render()
    expect(rendered).toBeDefined()
  })

  it('should handle empty content', () => {
    const section = Section([], { title: 'Empty Section' })

    const rendered = section.render()
    expect(rendered).toBeDefined()
  })
})
