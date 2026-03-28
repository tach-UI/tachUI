import { beforeEach, describe, expect, it } from 'vitest'
import { createSignal, flushSync } from '@tachui/core/reactive'
import type { ModifierContext } from '@tachui/core/modifiers/types'
import type { DOMNode } from '@tachui/core/runtime/types'
import {
  letterSpacing,
  lineHeight,
  textDecoration,
  textTransform,
  wordSpacing,
} from '../../src/typography/typography'

class MockElement {
  style: {
    [key: string]: string
    setProperty: (property: string, value: string) => void
  }

  constructor() {
    this.style = new Proxy({} as any, {
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
      get: (target, prop) => {
        if (prop === 'setProperty') {
          return (property: string, value: string) => {
            target[property] = value
            const camelCase = property.replace(/-([a-z])/g, (_m, letter) =>
              letter.toUpperCase()
            )
            target[camelCase] = value
          }
        }
        return target[prop] || ''
      },
    })
  }
}

describe('Typography Reactive Updates', () => {
  let mockElement: MockElement
  let mockContext: ModifierContext

  beforeEach(() => {
    mockElement = new MockElement()
    mockContext = { element: mockElement as unknown as HTMLElement }
  })

  it('updates lineHeight when signal changes', () => {
    const [height, setHeight] = createSignal(1.4)
    const modifier = lineHeight(height as unknown as number)
    modifier.apply({} as DOMNode, mockContext)

    expect(mockElement.style.lineHeight).toBe('1.4')
    setHeight(2)
    flushSync()
    expect(mockElement.style.lineHeight).toBe('2')
  })

  it('updates letterSpacing when signal changes', () => {
    const [spacing, setSpacing] = createSignal(2)
    const modifier = letterSpacing(spacing as unknown as number)
    modifier.apply({} as DOMNode, mockContext)

    expect(mockElement.style.letterSpacing).toBe('2px')
    setSpacing(6)
    flushSync()
    expect(mockElement.style.letterSpacing).toBe('6px')
  })

  it('updates wordSpacing when signal changes', () => {
    const [spacing, setSpacing] = createSignal(1)
    const modifier = wordSpacing(spacing as unknown as number)
    modifier.apply({} as DOMNode, mockContext)

    expect(mockElement.style.wordSpacing).toBe('1px')
    setSpacing(4)
    flushSync()
    expect(mockElement.style.wordSpacing).toBe('4px')
  })

  it('updates textDecoration when signal changes', () => {
    const [decoration, setDecoration] = createSignal('underline')
    const modifier = textDecoration(decoration as unknown as any)
    modifier.apply({} as DOMNode, mockContext)

    expect(mockElement.style.textDecoration).toBe('underline')
    setDecoration('line-through')
    flushSync()
    expect(mockElement.style.textDecoration).toBe('line-through')
  })

  it('updates textTransform when signal changes', () => {
    const [transform, setTransform] = createSignal('uppercase')
    const modifier = textTransform(transform as unknown as any)
    modifier.apply({} as DOMNode, mockContext)

    expect(mockElement.style.textTransform).toBe('uppercase')
    setTransform('lowercase')
    flushSync()
    expect(mockElement.style.textTransform).toBe('lowercase')
  })
})
