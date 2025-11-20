/**
 * Tests for Component Wrapper System
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WrapperOptions } from '../../src/components/wrapper'
import {
  createModifiableComponentFactory,
  createReactiveWrapper,
  Layout,
  withModifierSupport,
  withModifiers,
  wrapComponent,
} from '../../src/components/wrapper'
import { h, text } from '../../src/runtime'
import type { ComponentInstance, ComponentProps } from '../../src/runtime/types'

// Create simple test components for testing the wrapper system
const Text = createReactiveWrapper(
  (props: { children?: string | (() => string) }) => {
    const content =
      typeof props.children === 'function'
        ? props.children()
        : props.children || ''
    return h('span', { class: 'tachui-text' }, text(content))
  }
)

const Button = createReactiveWrapper(
  (props: { children?: string; onClick?: () => void }) =>
    h(
      'button',
      {
        class: 'tachui-button',
        onclick: props.onClick,
      },
      text(props.children || '')
    )
)

// HTML element factories
const HTML = {
  div: (props: any = {}) => {
    const component = createReactiveWrapper(() =>
      h('div', props, props.children ? text(props.children) : undefined)
    )({})
    // Preserve props on the component for testing
    component.props = props
    return component
  },
  span: (props: any = {}) => {
    const component = createReactiveWrapper(() =>
      h('span', props, props.children ? text(props.children) : undefined)
    )({})
    component.props = props
    return component
  },
  p: (props: any = {}) => {
    const component = createReactiveWrapper(() =>
      h('p', props, props.children ? text(props.children) : undefined)
    )({})
    component.props = props
    return component
  },
  button: (props: any = {}) => {
    const component = createReactiveWrapper(() =>
      h(
        'button',
        { ...props, onclick: props.onClick },
        props.children ? text(props.children) : undefined
      )
    )({})
    component.props = props
    return component
  },
  input: (props: any = {}) => {
    const component = createReactiveWrapper(() =>
      h('input', { type: 'text', ...props })
    )({})
    component.props = props
    return component
  },
  img: (props: any = {}) => {
    const component = createReactiveWrapper(() => h('img', props))({})
    component.props = props
    return component
  },
  heading:
    (level: 1 | 2 | 3 | 4 | 5 | 6) =>
    (props: any = {}) => {
      const component = createReactiveWrapper(() =>
        h(`h${level}`, props, props.children ? text(props.children) : undefined)
      )({})
      component.props = props
      return component
    },
}

// Heading shortcuts
const H1 = (props: any = {}) => HTML.heading(1)(props)
const H2 = (props: any = {}) => HTML.heading(2)(props)
const H3 = (props: any = {}) => HTML.heading(3)(props)
const H4 = (props: any = {}) => HTML.heading(4)(props)
const H5 = (props: any = {}) => HTML.heading(5)(props)
const H6 = (props: any = {}) => HTML.heading(6)(props)

// Mock simple component for testing
class TestComponent implements ComponentInstance<ComponentProps> {
  public readonly type = 'component' as const
  public readonly id: string
  public mounted = false
  public cleanup: (() => void)[] = []

  constructor(public props: ComponentProps) {
    this.id = `test-${Math.random()}`
  }

  render() {
    return [h('div', { class: 'test-component' }, text('Test Content'))]
  }
}

// Mock DOM environment
beforeEach(() => {
  global.document = {
    ...global.document,
    createElement: vi.fn((tagName: string) => ({
      tagName: tagName.toUpperCase(),
      style: {},
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      setAttribute: vi.fn(),
      getAttribute: vi.fn(),
    })),
  }
})

describe('withModifiers', () => {
  it('should add modifier support to component', () => {
    const component = new TestComponent({})
    const wrapped = withModifiers(component)

    expect(wrapped).toBeDefined()
    expect(typeof wrapped.modifier).toBe('object')
    expect(typeof wrapped.build).toBe('function')
  })

  it('should preserve original component properties', () => {
    const props = { testProp: 'value' }
    const component = new TestComponent(props)
    const wrapped = withModifiers(component)

    expect(wrapped.type).toBe('component')
    expect(wrapped.props).toEqual(props)
    expect(wrapped.id).toBe(component.id)
  })

  it('should support modifier chaining', () => {
    const component = new TestComponent({})
    const result = withModifiers(component)
      .padding(16)
      .margin(8)
      .backgroundColor('#ffffff')
      .build()

    expect(result).toBeDefined()
  })
})

describe('createReactiveWrapper', () => {
  it('should create reactive wrapper function', () => {
    const renderFn = (props: { content: string }) =>
      h('div', {}, text(props.content))
    const wrapper = createReactiveWrapper(renderFn)

    expect(typeof wrapper).toBe('function')
  })

  it('should create modifiable component from wrapper', () => {
    const renderFn = (props: { content: string }) =>
      h('div', {}, text(props.content))
    const wrapper = createReactiveWrapper(renderFn)
    const component = wrapper({ content: 'Test' })

    expect(component).toBeDefined()
    expect(typeof component.modifier).toBe('object')
  })

  it('should handle wrapper options', () => {
    const renderFn = (props: { content: string }) =>
      h('div', {}, text(props.content))
    const options: WrapperOptions = {
      enableModifiers: true,
      enableReactivity: true,
    }
    const wrapper = createReactiveWrapper(renderFn, options)

    expect(typeof wrapper).toBe('function')
  })

  it('should handle array return from render function', () => {
    const renderFn = (props: { items: string[] }) =>
      props.items.map(item => h('div', {}, text(item)))

    const wrapper = createReactiveWrapper(renderFn)
    const component = wrapper({ items: ['a', 'b', 'c'] })

    expect(component).toBeDefined()
  })
})

describe('HTML', () => {
  describe('div', () => {
    it('should create div element with modifier support', () => {
      const div = HTML.div()

      expect(div).toBeDefined()
      expect(typeof div.modifier).toBe('object')
    })

    it('should accept children prop', () => {
      const div = HTML.div({ children: 'Hello World' })

      expect(div).toBeDefined()
      expect(div.props).toEqual({ children: 'Hello World' })
    })

    it('should support modifier chaining', () => {
      const div = HTML.div()
        .padding(16)
        .backgroundColor('#f0f0f0')
        .build()

      expect(div).toBeDefined()
    })
  })

  describe('span', () => {
    it('should create span element with modifier support', () => {
      const span = HTML.span({ children: 'Span text' })

      expect(span).toBeDefined()
      expect(typeof span.modifier).toBe('object')
    })
  })

  describe('p', () => {
    it('should create paragraph element with modifier support', () => {
      const p = HTML.p({ children: 'Paragraph text' })

      expect(p).toBeDefined()
      expect(typeof p.modifier).toBe('object')
    })
  })

  describe('button', () => {
    it('should create button element with modifier support', () => {
      const button = HTML.button({ children: 'Click me' })

      expect(button).toBeDefined()
      expect(typeof button.modifier).toBe('object')
    })

    it('should handle onClick prop', () => {
      const onClick = vi.fn()
      const button = HTML.button({
        children: 'Click me',
        onClick,
      })

      expect(button).toBeDefined()
    })
  })

  describe('input', () => {
    it('should create input element with modifier support', () => {
      const input = HTML.input()

      expect(input).toBeDefined()
      expect(typeof input.modifier).toBe('object')
    })

    it('should handle input props', () => {
      const onChange = vi.fn()
      const input = HTML.input({
        type: 'email',
        value: 'test@example.com',
        placeholder: 'Enter email',
        onChange,
      })

      expect(input).toBeDefined()
    })

    it('should default to text type', () => {
      const input = HTML.input()
      expect(input).toBeDefined()
    })
  })

  describe('img', () => {
    it('should create image element with modifier support', () => {
      const img = HTML.img({ src: 'test.jpg' })

      expect(img).toBeDefined()
      expect(typeof img.modifier).toBe('object')
    })

    it('should handle image props', () => {
      const img = HTML.img({
        src: 'test.jpg',
        alt: 'Test image',
        width: 100,
        height: 50,
      })

      expect(img).toBeDefined()
      expect(img.props.src).toBe('test.jpg')
    })
  })

  describe('heading', () => {
    it('should create heading element factory', () => {
      const h1Factory = HTML.heading(1)
      const h1 = h1Factory({ children: 'Heading 1' })

      expect(h1).toBeDefined()
      expect(typeof h1.modifier).toBe('object')
    })

    it('should handle different heading levels', () => {
      for (let level = 1; level <= 6; level++) {
        const headingFactory = HTML.heading(level as 1 | 2 | 3 | 4 | 5 | 6)
        const heading = headingFactory({ children: `Heading ${level}` })

        expect(heading).toBeDefined()
      }
    })
  })
})

describe('Heading Shortcuts', () => {
  it('should create H1 element', () => {
    const h1 = H1({ children: 'Main Title' })

    expect(h1).toBeDefined()
    expect(typeof h1.modifier).toBe('object')
  })

  it('should create H2 element', () => {
    const h2 = H2({ children: 'Subtitle' })

    expect(h2).toBeDefined()
    expect(typeof h2.modifier).toBe('object')
  })

  it('should create H3 element', () => {
    const h3 = H3({ children: 'Section Title' })

    expect(h3).toBeDefined()
    expect(typeof h3.modifier).toBe('object')
  })

  it('should create H4 element', () => {
    const h4 = H4({ children: 'Subsection' })

    expect(h4).toBeDefined()
    expect(typeof h4.modifier).toBe('object')
  })

  it('should create H5 element', () => {
    const h5 = H5({ children: 'Minor Heading' })

    expect(h5).toBeDefined()
    expect(typeof h5.modifier).toBe('object')
  })

  it('should create H6 element', () => {
    const h6 = H6({ children: 'Smallest Heading' })

    expect(h6).toBeDefined()
    expect(typeof h6.modifier).toBe('object')
  })
})

describe('Layout Components', () => {
  describe('VStack', () => {
    it('should create vertical stack layout', () => {
      const children = [
        new TestComponent({ id: '1' }),
        new TestComponent({ id: '2' }),
      ]

      const vstack = Layout.VStack({ children })

      expect(vstack).toBeDefined()
      expect(typeof vstack.modifier).toBe('object')
    })

    it('should handle spacing and alignment', () => {
      const vstack = Layout.VStack({
        children: [],
        spacing: 16,
        alignment: 'leading',
      })

      expect(vstack).toBeDefined()
    })

    it('should default to center alignment and zero spacing', () => {
      const vstack = Layout.VStack()

      expect(vstack).toBeDefined()
    })
  })

  describe('HStack', () => {
    it('should create horizontal stack layout', () => {
      const children = [
        new TestComponent({ id: '1' }),
        new TestComponent({ id: '2' }),
      ]

      const hstack = Layout.HStack({ children })

      expect(hstack).toBeDefined()
      expect(typeof hstack.modifier).toBe('object')
    })

    it('should handle spacing and alignment', () => {
      const hstack = Layout.HStack({
        children: [],
        spacing: 8,
        alignment: 'top',
      })

      expect(hstack).toBeDefined()
    })

    it('should align horizontally with leading/trailing values', () => {
      const leadingStack = Layout.HStack({
        children: [],
        alignment: 'leading',
      })
      const [leadingElement] = leadingStack.render()

      expect(leadingElement.props?.style?.justifyContent).toBe('flex-start')
      expect(leadingElement.props?.style?.alignItems).toBe('center')

      const trailingStack = Layout.HStack({
        children: [],
        alignment: 'trailing',
      })
      const [trailingElement] = trailingStack.render()

      expect(trailingElement.props?.style?.justifyContent).toBe('flex-end')
      expect(trailingElement.props?.style?.alignItems).toBe('center')
    })
  })

  describe('ZStack', () => {
    it('should create z-index stack layout', () => {
      const children = [
        new TestComponent({ id: '1' }),
        new TestComponent({ id: '2' }),
      ]

      const zstack = Layout.ZStack({ children })

      expect(zstack).toBeDefined()
      expect(typeof zstack.modifier).toBe('object')
    })

    it('should handle alignment', () => {
      const zstack = Layout.ZStack({
        children: [],
        alignment: 'topLeading',
      })

      expect(zstack).toBeDefined()
    })

    it('should default to center alignment', () => {
      const zstack = Layout.ZStack()

      expect(zstack).toBeDefined()
    })
  })
})

describe('Text Component', () => {
  it('should create text component with string content', () => {
    const text = Text('Hello World')

    expect(text).toBeDefined()
    expect(typeof text.modifier).toBe('object')
  })

  it('should create text component with function content', () => {
    const getText = () => 'Dynamic Text'
    const text = Text(getText)

    expect(text).toBeDefined()
  })

  it('should support modifier chaining', () => {
    const text = Text('Styled Text').padding(16).margin(8).build()

    expect(text).toBeDefined()
  })
})

describe('wrapComponent', () => {
  it('should wrap existing component with modifier support', () => {
    const component = new TestComponent({ testProp: 'value' })
    const wrapped = wrapComponent(component)

    expect(wrapped).toBeDefined()
    expect(typeof wrapped.modifier).toBe('object')
    expect(wrapped.props).toEqual(component.props)
  })

  it('should preserve component identity', () => {
    const component = new TestComponent({})
    const wrapped = wrapComponent(component)

    expect(wrapped.id).toBe(component.id)
    expect(wrapped.type).toBe(component.type)
  })
})

describe('withModifierSupport', () => {
  it('should create enhanced component class with modifier support', () => {
    const EnhancedTestComponent = withModifierSupport(TestComponent)
    const instance = new EnhancedTestComponent({ testProp: 'value' })

    expect(instance).toBeDefined()
    expect(typeof instance.modifier).toBe('object')
    expect(instance.modifiers).toBeDefined()
  })

  it('should preserve original component functionality', () => {
    const EnhancedTestComponent = withModifierSupport(TestComponent)
    const instance = new EnhancedTestComponent({ testProp: 'value' })

    expect(instance.type).toBe('component')
    expect(instance.props).toEqual({ testProp: 'value' })
    expect(typeof instance.render).toBe('function')
  })
})

describe('createModifiableComponentFactory', () => {
  it('should create factory function for modifiable components', () => {
    const renderFn = (props: { content: string }) =>
      h('div', {}, text(props.content))
    const factory = createModifiableComponentFactory(renderFn)

    expect(typeof factory).toBe('function')
  })

  it('should create component with modifier support from factory', () => {
    const renderFn = (props: { content: string }) =>
      h('div', {}, text(props.content))
    const factory = createModifiableComponentFactory(renderFn)
    const component = factory({ content: 'Test Content' })

    expect(component).toBeDefined()
    expect(typeof component.modifier).toBe('object')
    expect(component.props.content).toBe('Test Content')
  })

  it('should handle array return from render function', () => {
    const renderFn = (props: { items: string[] }) =>
      props.items.map(item => h('span', {}, text(item)))

    const factory = createModifiableComponentFactory(renderFn)
    const component = factory({ items: ['a', 'b'] })

    expect(component).toBeDefined()
  })

  it('should support modifier chaining on factory components', () => {
    const renderFn = (props: { content: string }) =>
      h('div', {}, text(props.content))
    const factory = createModifiableComponentFactory(renderFn)
    const component = factory({ content: 'Test' })
      .padding(10)
      .backgroundColor('#eeeeee')
      .build()

    expect(component).toBeDefined()
  })
})

describe('Integration Tests', () => {
  it('should combine multiple wrapper features', () => {
    const children = [
      Text('Title'),
      HTML.p({ children: 'Description' }),
      HTML.button({ children: 'Action', onClick: vi.fn() }),
    ]

    const layout = Layout.VStack({ children, spacing: 16 })
      .padding(20)
      .backgroundColor('#ffffff')
      .build()

    expect(layout).toBeDefined()
  })

  it('should work with nested layouts', () => {
    const header = Layout.HStack({
      children: [H1({ children: 'Title' }), HTML.button({ children: 'Menu' })],
      spacing: 16,
      alignment: 'center',
    })

    const content = Layout.VStack({
      children: [
        header,
        Text('Content goes here'),
        HTML.div({ children: 'Footer' }),
      ],
      spacing: 24,
    })
      .padding(20)
      .margin(10)
      .build()

    expect(content).toBeDefined()
  })

  it('should handle complex element configurations', () => {
    const form = Layout.VStack({
      children: [
        HTML.input({
          type: 'email',
          placeholder: 'Email',
          onChange: vi.fn(),
        }),
        HTML.input({
          type: 'password',
          placeholder: 'Password',
          onChange: vi.fn(),
        }),
        HTML.button({
          children: 'Submit',
          onClick: vi.fn(),
        }),
      ],
      spacing: 12,
    })
      .padding(20)
      .backgroundColor('#f9f9f9')
      .build()

    expect(form).toBeDefined()
  })

  it('should create reusable component patterns', () => {
    // Create a card component factory
    const createCard = createModifiableComponentFactory(
      (props: { title: string; content: string; action?: () => void }) => {
        const children = [H3({ children: props.title }), Text(props.content)]

        if (props.action) {
          children.push(
            HTML.button({
              children: 'Action',
              onClick: props.action,
            })
          )
        }

        return Layout.VStack({ children, spacing: 12 }).render()
      }
    )

    const card = createCard({
      title: 'Card Title',
      content: 'Card content here',
      action: vi.fn(),
    })
      .padding(16)
      .backgroundColor('#ffffff')
      .build()

    expect(card).toBeDefined()
  })
})
