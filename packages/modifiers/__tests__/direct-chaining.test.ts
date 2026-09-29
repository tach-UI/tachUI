/**
 * Direct chaining without `.modifier`
 *
 * `.modifier` holds the builder object, so a factory-made modifier reached a
 * component only as `X.modifier.modifier(f)`: `X.modifier(f)` throws because
 * the property is not callable. Registered factories now chain by name on the
 * component, and `.applyModifier(f)` applies any factory's instance, including
 * one an application registers itself. `BasicInput`, `Toggle`, `Divider`,
 * `Picker` and `BasicForm` return the full builder shape, as the other
 * primitives already did.
 *
 * The legacy property path is kept, so each direct form is compared with it.
 */

import { JSDOM } from 'jsdom'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  BasicForm,
  BasicInput,
  Button,
  Divider,
  DividerUtils,
  HStack,
  Image,
  ImageUtils,
  Link,
  Picker,
  PickerStyles,
  ScrollView,
  Spacer,
  Text,
  Toggle,
  ToggleStyles,
  ToggleWithLabel,
  VStack,
  ZStack,
} from '@tachui/primitives'
import { createSignal, renderComponent } from '@tachui/core'
import { BaseModifier, ModifierBuilderImpl } from '@tachui/core/modifiers'
import type { ModifierContext } from '@tachui/core/modifiers'
import { globalModifierRegistry } from '@tachui/registry'
import { aria, ariaLabel, cssVariables, onHover } from '../src'
import { task } from '../src/lifecycle'
import '../src/preload/basic'

beforeEach(() => {
  const dom = new JSDOM('<!doctype html><html><body></body></html>', {
    url: 'http://localhost',
  })
  for (const key of [
    'document', 'window', 'Element', 'HTMLElement', 'HTMLInputElement',
    'DocumentFragment', 'Node', 'Event', 'MouseEvent',
  ]) {
    ;(globalThis as any)[key] =
      key === 'document' ? dom.window.document
      : key === 'window' ? dom.window
      : (dom.window as any)[key]
  }
})

/** An application's own modifier, which no package types on the builder. */
class GlowModifier extends BaseModifier<{ color: string }> {
  readonly type = 'glow'
  readonly priority = 50

  apply(_node: unknown, context: ModifierContext) {
    ;(context.element as HTMLElement).setAttribute('data-glow', this.properties.color)
    return undefined
  }
}

const glow = (color: string) => new GlowModifier({ color })

beforeAll(() => {
  if (!globalModifierRegistry.has('glow')) {
    globalModifierRegistry.register('glow', glow)
  }
})

function render(component: unknown) {
  const host = document.createElement('div')
  const dispose = renderComponent(component as any, host)
  return { host, element: host.firstElementChild as HTMLElement, dispose }
}

/** The legacy property path, with its internal-use warning silenced. */
function legacy<T>(apply: () => T): T {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  try {
    return apply()
  } finally {
    warn.mockRestore()
  }
}

function typesOf(component: any): string[] {
  return component.modifiers.map((modifier: any) => modifier.type)
}

function stack() {
  return VStack({ children: [], spacing: 0 })
}

const [text, setText] = createSignal('')
const [selection] = createSignal('a')
const options = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]

/** Every component that supports modifiers, by name. */
const components: Array<[string, () => any]> = [
  ['VStack', () => stack()],
  ['HStack', () => HStack({ children: [] })],
  ['ZStack', () => ZStack({ children: [] })],
  ['Text', () => Text('x', {})],
  ['Button', () => Button('Save', () => {})],
  ['Link', () => Link('Home', '/')],
  ['Image', () => Image('/a.png', { alt: 'a' })],
  ['ImageUtils.progressive', () => ImageUtils.progressive('/lo.png', '/hi.png')],
  ['Spacer', () => Spacer()],
  ['ScrollView', () => ScrollView({ children: [] })],
  ['BasicInput', () => BasicInput({ text, setText, inputType: 'text' })],
  ['BasicForm', () => BasicForm([])],
  ['Toggle', () => Toggle(false)],
  ['ToggleWithLabel', () => ToggleWithLabel('Wi-Fi', false)],
  ['ToggleStyles.Checkbox', () => ToggleStyles.Checkbox(true)],
  ['Divider', () => Divider()],
  ['DividerUtils.thin', () => DividerUtils.thin()],
  ['DividerUtils.vertical', () => DividerUtils.vertical(20)],
  ['Picker', () => Picker(selection, options)],
  ['PickerStyles.Segmented', () => PickerStyles.Segmented(selection, options)],
]

describe('the previously narrow components', () => {
  it('chains .css() directly on BasicInput and renders', () => {
    const component = BasicInput({ text, setText, inputType: 'text' })
      .css({ display: 'block' })
      .build()

    expect(typesOf(component)).toEqual(['css'])
    const { host } = render(component)
    expect(host.querySelector('input')).not.toBeNull()
    expect(
      (host.querySelector('[style*="display"]') as HTMLElement).style.display
    ).toBe('block')
  })

  it.each(components)('chains built-in modifiers directly on %s', (_name, make) => {
    const component = make().padding(4).foregroundColor('red').build()

    expect(typesOf(component)).toEqual(['padding', 'foreground'])
    const styled = [...render(component).host.querySelectorAll<HTMLElement>('*')]
      .filter(element => element.style.color === 'red')
    expect(styled).toHaveLength(1)
    expect(styled[0].style.padding).toBe('4px')
  })
})

describe('registered factories chain by name', () => {
  it('is not reachable as .modifier(f), which is why this exists', () => {
    expect(() => (stack() as any).modifier(onHover(() => {}))).toThrow(TypeError)
  })

  it('applies .onHover() on the component, as the legacy path does', () => {
    const direct = vi.fn()
    const viaProperty = vi.fn()
    const { element: directElement } = render(stack().onHover(direct).build())
    const { element: legacyElement } = render(
      legacy(() => stack().modifier.modifier(onHover(viaProperty)).build())
    )

    for (const element of [directElement, legacyElement]) {
      element.dispatchEvent(new MouseEvent('mouseenter'))
      element.dispatchEvent(new MouseEvent('mouseleave'))
    }
    expect(direct.mock.calls).toEqual([[true], [false]])
    expect(viaProperty.mock.calls).toEqual(direct.mock.calls)
  })

  it('applies .aria() as the legacy path does', () => {
    const attributes = { label: 'Close', expanded: true }
    const direct = stack().aria(attributes).build()
    const viaProperty = legacy(() => stack().modifier.modifier(aria(attributes)).build())

    expect(typesOf(direct)).toEqual(typesOf(viaProperty))
    const { element } = render(direct)
    const { element: legacyElement } = render(viaProperty)
    expect(element.getAttribute('aria-label')).toBe('Close')
    expect(element.getAttribute('aria-expanded')).toBe('true')
    expect(element.getAttribute('aria-label')).toBe(legacyElement.getAttribute('aria-label'))
    expect(element.getAttribute('aria-expanded')).toBe(legacyElement.getAttribute('aria-expanded'))
  })

  it('applies .ariaLabel() as the legacy path does', () => {
    const direct = stack().ariaLabel('Menu').build()
    const viaProperty = legacy(() => stack().modifier.modifier(ariaLabel('Menu')).build())

    expect(typesOf(direct)).toEqual(typesOf(viaProperty))
    expect(render(direct).element.getAttribute('aria-label')).toBe('Menu')
    expect(render(viaProperty).element.getAttribute('aria-label')).toBe('Menu')
  })

  it('applies .task() as the legacy path does', () => {
    const direct = vi.fn()
    const viaProperty = vi.fn()
    const directComponent = stack().task(direct).build()
    const legacyComponent = legacy(() =>
      stack().modifier.modifier(task({ operation: viaProperty })).build()
    )

    expect(typesOf(directComponent)).toEqual(typesOf(legacyComponent))
    render(directComponent)
    render(legacyComponent)
    expect(direct).toHaveBeenCalledTimes(1)
    expect(viaProperty).toHaveBeenCalledTimes(1)
  })

  it('applies .cssVariables() as the legacy path does', () => {
    const variables = { accent: 'red', gap: 4 }
    const direct = stack().cssVariables(variables).build()
    const viaProperty = legacy(() =>
      stack().modifier.modifier(cssVariables(variables)).build()
    )

    expect(typesOf(direct)).toEqual(typesOf(viaProperty))
    const { element } = render(direct)
    const { element: legacyElement } = render(viaProperty)
    expect(element.style.getPropertyValue('--accent')).toBe('red')
    expect(element.style.cssText).toBe(legacyElement.style.cssText)
  })

  it('returns the component, so the chain continues and can be a child', () => {
    const inner = stack()
    const chained = inner.ariaLabel('x').cssVariables({ tone: 'dark' })

    expect(chained).toBe(inner)
    expect(() => VStack({ children: [chained.build()] })).not.toThrow()
  })
})

describe('.applyModifier()', () => {
  it('is a builder method', () => {
    expect(typeof ModifierBuilderImpl.prototype.applyModifier).toBe('function')
  })

  it('applies an application-registered factory as the legacy path does', () => {
    const direct = stack().applyModifier(glow('gold')).padding(2).build()
    const viaProperty = legacy(() =>
      stack().modifier.modifier(glow('gold')).padding(2).build()
    )

    expect(typesOf(direct)).toEqual(['glow', 'padding'])
    expect(typesOf(viaProperty)).toEqual(typesOf(direct))
    expect(render(direct).element.getAttribute('data-glow')).toBe('gold')
    expect(render(viaProperty).element.getAttribute('data-glow')).toBe('gold')
  })

  it('applies a shipped factory instance as the legacy path does', () => {
    const callback = vi.fn()
    const { element } = render(stack().applyModifier(onHover(callback)).build())

    element.dispatchEvent(new MouseEvent('mouseenter'))
    expect(callback).toHaveBeenLastCalledWith(true)
  })

  it('does not warn, unlike the internal .modifier()', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    try {
      stack().applyModifier(glow('gold')).build()
      stack().modifier.applyModifier(glow('gold')).build()
      expect(warn).not.toHaveBeenCalled()

      legacy(() => stack().modifier.modifier(glow('gold')))
    } finally {
      process.env.NODE_ENV = previous
      warn.mockRestore()
    }
  })

  it('chains on .modifier too, returning the builder', () => {
    const builder = stack().modifier
    expect(builder.applyModifier(glow('gold'))).toBe(builder)
  })
})

describe('on every modifier-supporting component', () => {
  it.each(components)(
    'applies per-factory methods and .applyModifier() on %s',
    (_name, make) => {
      const component = make()
        .ariaLabel('label')
        .cssVariables({ tone: 'dark' })
        .applyModifier(glow('gold'))
        .build()

      expect(typesOf(component)).toEqual(['aria', 'customProperties', 'glow'])
      const { host } = render(component)
      const target = host.querySelector('[data-glow="gold"]') as HTMLElement
      expect(target).not.toBeNull()
      expect(target.getAttribute('aria-label')).toBe('label')
      expect(target.style.getPropertyValue('--tone')).toBe('dark')
    }
  )

  it.each(components)('keeps the legacy .modifier.modifier(f) path on %s', (_name, make) => {
    const component = legacy(() =>
      make().modifier.modifier(glow('gold')).modifier(ariaLabel('label')).build()
    )

    expect(typesOf(component)).toEqual(['glow', 'aria'])
    const target = render(component).host.querySelector('[data-glow="gold"]')
    expect(target?.getAttribute('aria-label')).toBe('label')
  })
})

describe('previously working direct chaining', () => {
  it('still chains built-ins on Text and renders them', () => {
    const component = Text('x', {}).fontSize(12).foregroundColor('red').build()
    const { element } = render(component)

    expect(typesOf(component)).toEqual(['appearance', 'foreground'])
    expect(element.style.fontSize).toBe('12px')
    expect(element.style.color).toBe('red')
  })
})
