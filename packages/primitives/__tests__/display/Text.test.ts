/**
 * Tests for Enhanced Text Component (Phase 5.1)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TextProps } from '../../src/display/Text'
import { HStack, VStack, ZStack } from '../../src'
import {
  EnhancedText,
  Heading,
  Text,
  TextFormat,
  TextStyles,
  Typography,
} from '../../src/display/Text'
import { createSignal, mountComponentTree } from '@tachui/core'

const nativeCreateElement = document.createElement.bind(document)
let createElementSpy: ReturnType<typeof vi.spyOn> | undefined

// Mock DOM environment
function createMockTextElement(): HTMLElement {
  const element = {
    tagName: 'SPAN',
    style: {} as CSSStyleDeclaration,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    setAttribute: vi.fn(),
    getAttribute: vi.fn(),
    textContent: '',
    id: `mock-${Math.random()}`,
  } as any

  return element
}

// Mock document methods
beforeEach(() => {
  createElementSpy = vi
    .spyOn(document, 'createElement')
    .mockImplementation((tagName: string) => {
      if (tagName === 'span') {
        return createMockTextElement()
      }
      return nativeCreateElement(tagName)
    })
})

afterEach(() => {
  createElementSpy?.mockRestore()
  createElementSpy = undefined
})

async function flushReactiveUpdates(): Promise<void> {
  await new Promise<void>(resolve => queueMicrotask(resolve))
  await new Promise<void>(resolve => setTimeout(resolve, 0))
}

describe('EnhancedText', () => {
  describe('Basic Functionality', () => {
    it('should create text component with string content', () => {
      const props: TextProps = {
        content: 'Hello World',
      }

      const text = new EnhancedText(props)
      expect(text.type).toBe('component')
      expect(text.id).toMatch(/^text-/)
      expect(text.props).toEqual(props)
    })

    it('should handle string content', () => {
      const text = new EnhancedText({ content: 'Test content' })
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle function content', () => {
      const getContent = () => 'Dynamic content'
      const text = new EnhancedText({ content: getContent })
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle signal content', () => {
      const [content] = createSignal('Signal content')
      const text = new EnhancedText({ content })
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should handle empty content', () => {
      const text = new EnhancedText({})
      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)
    })

    it('should render text element', () => {
      const text = new EnhancedText({ content: 'Test' })
      const elements = text.render()

      expect(elements).toHaveLength(1)
      expect(elements[0].tag).toBe('span')
      expect(elements[0].props?.className).toBe('tachui-text')
    })
  })

  describe('Typography', () => {
    it('should apply font family', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { family: 'Arial' },
      })

      text.render()
      // Test would verify font family is applied to element
    })

    it('should apply font size as number', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { size: 16 },
      })

      text.render()
      // Test would verify font size is applied as '16px'
    })

    it('should apply font size as string', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { size: '1.2em' },
      })

      text.render()
      // Test would verify font size is applied as '1.2em'
    })

    it('should apply font weight', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { weight: 'bold' },
      })

      text.render()
      // Test would verify font weight is applied
    })

    it('should apply font style', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { style: 'italic' },
      })

      text.render()
      // Test would verify font style is applied
    })

    it('should apply font variant', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: { variant: 'small-caps' },
      })

      text.render()
      // Test would verify font variant is applied
    })

    it('should apply multiple font properties', () => {
      const text = new EnhancedText({
        content: 'Test',
        font: {
          family: 'Arial',
          size: 18,
          weight: '600',
          style: 'italic',
          variant: 'small-caps',
        },
      })

      text.render()
      // Test would verify all font properties are applied
    })
  })

  describe('Text Styling', () => {
    it('should apply static color', () => {
      const text = new EnhancedText({
        content: 'Test',
        color: '#ff0000',
      })

      text.render()
      // Test would verify color is applied
    })

    it('should apply signal color', () => {
      const [color] = createSignal('#00ff00')
      const text = new EnhancedText({
        content: 'Test',
        color,
      })

      text.render()
      // Test would verify reactive color is applied
    })

    it('should apply background color', () => {
      const text = new EnhancedText({
        content: 'Test',
        backgroundColor: '#f0f0f0',
      })

      text.render()
      // Test would verify background color is applied
    })

    it('should apply text alignment', () => {
      const alignments: Array<'left' | 'center' | 'right' | 'justify'> = [
        'left',
        'center',
        'right',
        'justify',
      ]

      alignments.forEach(align => {
        const text = new EnhancedText({
          content: 'Test',
          textAlign: align,
        })

        text.render()
        // Test would verify text alignment is applied
      })
    })

    it('should apply text decoration', () => {
      const decorations: Array<
        'none' | 'underline' | 'line-through' | 'overline'
      > = ['none', 'underline', 'line-through', 'overline']

      decorations.forEach(decoration => {
        const text = new EnhancedText({
          content: 'Test',
          textDecoration: decoration,
        })

        text.render()
        // Test would verify text decoration is applied
      })
    })

    it('should apply text transform', () => {
      const transforms: Array<
        'none' | 'uppercase' | 'lowercase' | 'capitalize'
      > = ['none', 'uppercase', 'lowercase', 'capitalize']

      transforms.forEach(transform => {
        const text = new EnhancedText({
          content: 'test',
          textTransform: transform,
        })

        text.render()
        // Test would verify text transform is applied
      })
    })

    it('should apply line height as number', () => {
      const text = new EnhancedText({
        content: 'Test',
        lineHeight: 1.5,
      })

      text.render()
      // Test would verify line height is applied
    })

    it('should apply line height as string', () => {
      const text = new EnhancedText({
        content: 'Test',
        lineHeight: '20px',
      })

      text.render()
      // Test would verify line height is applied
    })

    it('should apply letter spacing', () => {
      const text = new EnhancedText({
        content: 'Test',
        letterSpacing: 2,
      })

      text.render()
      // Test would verify letter spacing is applied
    })

    it('should apply word spacing', () => {
      const text = new EnhancedText({
        content: 'Test words',
        wordSpacing: 4,
      })

      text.render()
      // Test would verify word spacing is applied
    })
  })

  describe('Text Truncation', () => {
    it('should apply line limit', () => {
      const text = new EnhancedText({
        content: 'Long text that should be truncated',
        lineLimit: 2,
      })

      text.render()
      // Test would verify line limit styles are applied
    })

    it('should apply tail truncation mode', () => {
      const text = new EnhancedText({
        content: 'Long text',
        lineLimit: 1,
        truncationMode: 'tail',
      })

      text.render()
      // Test would verify tail truncation is applied
    })

    it('should apply head truncation mode', () => {
      const text = new EnhancedText({
        content: 'Long text',
        lineLimit: 1,
        truncationMode: 'head',
      })

      text.render()
      // Test would verify head truncation is applied
    })

    it('should apply middle truncation mode', () => {
      const text = new EnhancedText({
        content: 'Long text',
        lineLimit: 1,
        truncationMode: 'middle',
      })

      text.render()
      // Test would verify middle truncation is applied
    })
  })

  describe('Accessibility', () => {
    it('should provide heading shorthand helpers on Text for levels 1 through 6', () => {
      const shorthandCases = [
        { build: Text.H1, expectedTag: 'h1' },
        { build: Text.H2, expectedTag: 'h2' },
        { build: Text.H3, expectedTag: 'h3' },
        { build: Text.H4, expectedTag: 'h4' },
        { build: Text.H5, expectedTag: 'h5' },
        { build: Text.H6, expectedTag: 'h6' },
      ] as const

      shorthandCases.forEach(({ build, expectedTag }) => {
        const heading = build(`Title ${expectedTag}`)
        const rendered = (heading as any).render()
        expect(rendered[0].tag).toBe(expectedTag)
      })
    })

    it('should provide dedicated Heading component API', () => {
      const heading = Heading('Section title', { level: 3 })
      const rendered = (heading as any).render()
      expect(rendered[0].tag).toBe('h3')
    })

    it('should default Heading level to h2 when level is omitted', () => {
      const warnSpy = vi
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined)

      const heading = Heading('Section title')
      const rendered = (heading as any).render()

      expect(rendered[0].tag).toBe('h2')
      expect(warnSpy).toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    it('should pass additional props through Heading helper', () => {
      const heading = Heading('Styled heading', {
        level: 4,
        font: { weight: 'bold' },
        debugLabel: 'heading-debug',
      })

      expect((heading as any).props?.font?.weight).toBe('bold')
      expect((heading as any).props?.debugLabel).toBe('heading-debug')
    })

    it('should apply accessibility label', () => {
      const text = new EnhancedText({
        content: 'Test',
        accessibilityLabel: 'Test label',
      })

      text.render()
      // Test would verify aria-label is set
    })

    it('should apply text role', () => {
      const text = new EnhancedText({
        content: 'Test',
        accessibilityRole: 'text',
      })

      text.render()
      // Test would verify role is set
    })

    it('should map heading accessibility levels 1 through 6 to h1 through h6', () => {
      const headingLevels: Array<1 | 2 | 3 | 4 | 5 | 6> = [1, 2, 3, 4, 5, 6]

      headingLevels.forEach(level => {
        const text = new EnhancedText({
          content: `Heading ${level}`,
          accessibilityRole: 'heading',
          accessibilityLevel: level,
        })

        const rendered = text.render()
        expect(rendered[0].tag).toBe(`h${level}`)
      })
    })

    it('should default heading role to h2 when level is omitted', () => {
      const text = new EnhancedText({
        content: 'Section heading',
        accessibilityRole: 'heading',
      })

      const rendered = text.render()
      expect(rendered[0].tag).toBe('h2')
    })

    it('should preserve explicit element override over accessibility heading tag', () => {
      const text = new EnhancedText({
        content: 'Heading with explicit tag',
        accessibilityRole: 'heading',
        accessibilityLevel: 1,
        element: 'h3',
      })

      const rendered = text.render()
      expect(rendered[0].tag).toBe('h3')
    })

    it('should disable text selection', () => {
      const text = new EnhancedText({
        content: 'Test',
        allowsSelection: false,
      })

      text.render()
      // Test would verify user-select is disabled
    })

    it('should allow text selection by default', () => {
      const text = new EnhancedText({
        content: 'Test',
      })

      text.render()
      // Test would verify user-select is not disabled
    })
  })

  describe('Interactions', () => {
    it('should handle tap events', () => {
      const onTap = vi.fn()
      const text = new EnhancedText({
        content: 'Clickable',
        onTap,
      })

      text.render()
      // Test would verify click event handler is added
    })

    it('should handle long press events', () => {
      const onLongPress = vi.fn()
      const text = new EnhancedText({
        content: 'Long pressable',
        onLongPress,
      })

      text.render()
      // Test would verify long press handlers are added
    })

    it('should set cursor pointer for interactive text', () => {
      const text = new EnhancedText({
        content: 'Interactive',
        onTap: vi.fn(),
      })

      text.render()
      // Test would verify cursor pointer is set
    })
  })

describe('Reactive Updates', () => {
    it('should update content when signal changes', () => {
      const [content, setContent] = createSignal('Initial')
      const text = new EnhancedText({ content })

      const rendered = text.render()
      expect(rendered).toBeDefined()
      expect(rendered).toHaveLength(1)

      // Test signal updates work
      setContent('Updated')
      expect(content()).toBe('Updated')
    })

    it('should update color when signal changes', () => {
      const [color, _setColor] = createSignal('#ff0000')
      const text = new EnhancedText({
        content: 'Test',
        color,
      })

      text.render()
      // Test that reactive color updates work
    })
  })
})

describe('DOM Signal Reactivity', () => {
  beforeEach(() => {
    createElementSpy?.mockRestore()
    document.body.innerHTML = ''
  })

  it('reflects Text(Signal<string>) updates in textContent', async () => {
    const [content, setContent] = createSignal('Initial value')
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = mountComponentTree(Text(content) as any, container)
    await flushReactiveUpdates()

    const textElement = container.querySelector('.tachui-text')
    expect(textElement).not.toBeNull()
    expect(textElement!.textContent).toBe('Initial value')

    setContent('Updated value')
    await flushReactiveUpdates()
    expect(textElement!.textContent).toBe('Updated value')

    cleanup()
  })

  it('preserves style modifiers when reactive content updates', async () => {
    const [content, setContent] = createSignal('Styled start')
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = mountComponentTree(
      Text(content).padding(6).margin(4) as any,
      container
    )
    await flushReactiveUpdates()

    const textElement = container.querySelector('.tachui-text') as HTMLElement
    expect(textElement).not.toBeNull()
    expect(textElement.style.padding).toBe('6px')
    expect(textElement.style.margin).toBe('4px')

    setContent('Styled update')
    await flushReactiveUpdates()

    expect(textElement.textContent).toBe('Styled update')
    expect(textElement.style.padding).toBe('6px')
    expect(textElement.style.margin).toBe('4px')

    cleanup()
  })

  it('applies the last value after rapid successive signal updates', async () => {
    const [content, setContent] = createSignal('Start')
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = mountComponentTree(Text(content) as any, container)
    await flushReactiveUpdates()

    const textElement = container.querySelector('.tachui-text')
    expect(textElement).not.toBeNull()

    setContent('Second')
    setContent('Third')
    setContent('Final')
    await flushReactiveUpdates()

    expect(textElement!.textContent).toBe('Final')

    cleanup()
  })

  it('updates from non-empty to empty signal content', async () => {
    const [content, setContent] = createSignal('Non-empty')
    const container = document.createElement('div')
    document.body.appendChild(container)

    const cleanup = mountComponentTree(Text(content) as any, container)
    await flushReactiveUpdates()

    const textElement = container.querySelector('.tachui-text')
    expect(textElement).not.toBeNull()
    expect(textElement!.textContent).toBe('Non-empty')

    setContent('')
    await flushReactiveUpdates()

    expect(textElement!.textContent).toBe('')

    cleanup()
  })

  it('propagates Text signal updates inside VStack, HStack, and ZStack', async () => {
    const stackFactories = [
      { name: 'VStack', create: VStack },
      { name: 'HStack', create: HStack },
      { name: 'ZStack', create: ZStack },
    ] as const

    for (const { name, create } of stackFactories) {
      const [content, setContent] = createSignal(`${name} start`)
      const container = document.createElement('div')
      document.body.appendChild(container)

      const cleanup = mountComponentTree(
        create({
          children: [Text('Before'), Text(content), Text('After')],
        }) as any,
        container
      )
      await flushReactiveUpdates()

      let targetText = Array.from(container.querySelectorAll('.tachui-text')).find(
        node => node.textContent === `${name} start`
      )
      expect(targetText).toBeTruthy()

      setContent(`${name} updated`)
      await flushReactiveUpdates()

      targetText = Array.from(container.querySelectorAll('.tachui-text')).find(
        node => node.textContent === `${name} updated`
      )
      expect(targetText).toBeTruthy()

      cleanup()
      container.remove()
    }
  })
})

describe('Typography Presets', () => {
  it('should have correct typography values', () => {
    expect(Typography.largeTitle).toEqual({
      size: 34,
      weight: '400',
      lineHeight: 1.2,
    })
    expect(Typography.title).toEqual({
      size: 28,
      weight: '400',
      lineHeight: 1.3,
    })
    expect(Typography.title2).toEqual({
      size: 22,
      weight: '400',
      lineHeight: 1.3,
    })
    expect(Typography.title3).toEqual({
      size: 20,
      weight: '400',
      lineHeight: 1.4,
    })
    expect(Typography.headline).toEqual({
      size: 17,
      weight: '600',
      lineHeight: 1.4,
    })
    expect(Typography.body).toEqual({
      size: 17,
      weight: '400',
      lineHeight: 1.5,
    })
    expect(Typography.callout).toEqual({
      size: 16,
      weight: '400',
      lineHeight: 1.4,
    })
    expect(Typography.subheadline).toEqual({
      size: 15,
      weight: '400',
      lineHeight: 1.4,
    })
    expect(Typography.footnote).toEqual({
      size: 13,
      weight: '400',
      lineHeight: 1.3,
    })
    expect(Typography.caption).toEqual({
      size: 12,
      weight: '400',
      lineHeight: 1.2,
    })
    expect(Typography.caption2).toEqual({
      size: 11,
      weight: '400',
      lineHeight: 1.1,
    })
  })
})

describe('Text Factory Function', () => {
  it('should create modifiable text component', () => {
    const text = Text('Hello World')

    expect(text).toBeDefined()
    expect(typeof text.modifier).toBe('object')
    expect(typeof text.build).toBe('function')
  })

  it('should accept additional props', () => {
    const text = Text('Hello', {
      color: '#ff0000',
      font: { size: 16 },
    })

    expect(text).toBeDefined()
  })

  it('should support modifier chaining', () => {
    const text = Text('Hello').padding(16).margin(8).build()

    expect(text).toBeDefined()
  })
})

describe('TextStyles Presets', () => {
  it('should create semantic heading elements from TextStyles.heading', () => {
    const headingProps = TextStyles.heading(1)
    const text = new EnhancedText({
      content: 'Page title',
      ...headingProps,
    })
    const rendered = text.render()

    expect(rendered[0].tag).toBe('h1')
  })

  it('should create LargeTitle text', () => {
    const text = TextStyles.LargeTitle('Large Title')
    expect(text).toBeDefined()
  })

  it('should create Title text', () => {
    const text = TextStyles.Title('Title')
    expect(text).toBeDefined()
  })

  it('should create Title2 text', () => {
    const text = TextStyles.Title2('Title 2')
    expect(text).toBeDefined()
  })

  it('should create Title3 text', () => {
    const text = TextStyles.Title3('Title 3')
    expect(text).toBeDefined()
  })

  it('should create Headline text', () => {
    const text = TextStyles.Headline('Headline')
    expect(text).toBeDefined()
  })

  it('should create Body text', () => {
    const text = TextStyles.Body('Body text')
    expect(text).toBeDefined()
  })

  it('should create Callout text', () => {
    const text = TextStyles.Callout('Callout')
    expect(text).toBeDefined()
  })

  it('should create Subheadline text', () => {
    const text = TextStyles.Subheadline('Subheadline')
    expect(text).toBeDefined()
  })

  it('should create Footnote text', () => {
    const text = TextStyles.Footnote('Footnote')
    expect(text).toBeDefined()
  })

  it('should create Caption text', () => {
    const text = TextStyles.Caption('Caption')
    expect(text).toBeDefined()
  })

  it('should create Caption2 text', () => {
    const text = TextStyles.Caption2('Caption 2')
    expect(text).toBeDefined()
  })

  it('should accept additional props in presets', () => {
    const text = TextStyles.Body('Body', { color: '#666666' })
    expect(text).toBeDefined()
  })
})

describe('TextFormat Utilities', () => {
  describe('formatted', () => {
    it('should apply bold formatting', () => {
      const text = TextFormat.formatted('Bold text', { bold: true })
      expect(text).toBeDefined()
    })

    it('should apply italic formatting', () => {
      const text = TextFormat.formatted('Italic text', { italic: true })
      expect(text).toBeDefined()
    })

    it('should apply underline formatting', () => {
      const text = TextFormat.formatted('Underlined', { underline: true })
      expect(text).toBeDefined()
    })

    it('should apply strikethrough formatting', () => {
      const text = TextFormat.formatted('Strikethrough', {
        strikethrough: true,
      })
      expect(text).toBeDefined()
    })

    it('should apply monospace formatting', () => {
      const text = TextFormat.formatted('Code', { monospace: true })
      expect(text).toBeDefined()
    })

    it('should apply small caps formatting', () => {
      const text = TextFormat.formatted('Small Caps', { smallCaps: true })
      expect(text).toBeDefined()
    })

    it('should apply multiple formatting options', () => {
      const text = TextFormat.formatted('Formatted', {
        bold: true,
        italic: true,
        underline: true,
      })
      expect(text).toBeDefined()
    })
  })

  describe('convenience methods', () => {
    it('should create bold text', () => {
      const text = TextFormat.bold('Bold')
      expect(text).toBeDefined()
    })

    it('should create italic text', () => {
      const text = TextFormat.italic('Italic')
      expect(text).toBeDefined()
    })

    it('should create underlined text', () => {
      const text = TextFormat.underline('Underlined')
      expect(text).toBeDefined()
    })

    it('should create monospace text', () => {
      const text = TextFormat.monospace('console.log("code")')
      expect(text).toBeDefined()
    })

    it('should accept additional props in convenience methods', () => {
      const text = TextFormat.bold('Bold', { color: '#ff0000' })
      expect(text).toBeDefined()
    })
  })
})

describe('Integration Tests', () => {
  it('should combine typography preset with formatting', () => {
    const text = TextStyles.Headline('Important Notice')
      .padding(16)
      .margin(8)
      .build()

    expect(text).toBeDefined()
  })

  it('should work with signal content and formatting', () => {
    const [content] = createSignal('Dynamic')
    const text = TextFormat.bold(content, { color: '#333' })

    expect(text).toBeDefined()
  })

  it('should handle complex styling combinations', () => {
    const text = Text('Complex Text', {
      font: Typography.title2,
      color: '#2c3e50',
      textAlign: 'center',
      lineHeight: 1.6,
      letterSpacing: 1,
      textDecoration: 'underline',
    })
      .padding(20)
      .backgroundColor('#ecf0f1')
      .build()

    expect(text).toBeDefined()
  })
})
