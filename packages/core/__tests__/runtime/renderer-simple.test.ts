/**
 * Simple Renderer Test to verify batching
 */

import { JSDOM } from 'jsdom'
import { beforeEach, describe, expect, it } from 'vitest'
import { DOMRenderer } from '../../src/runtime/renderer'
import type { DOMNode } from '../../src/runtime/types'

describe('Simple Renderer Test', () => {
  let dom: JSDOM
  let renderer: DOMRenderer

  beforeEach(() => {
    // Create a JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
    global.document = dom.window.document
    global.window = dom.window as any

    renderer = new DOMRenderer()
  })

  it('should render a simple element without modifiers', () => {
    const node: DOMNode = {
      type: 'element',
      tag: 'div',
      props: { id: 'test-element' },
      children: [],
    }

    const element = renderer.render(node)

    expect(element).toBeDefined()
    expect((element as Element).tagName).toBe('DIV')
    expect((element as Element).id).toBe('test-element')
  })

  it('should render an element with a modifiers property', () => {
    const nodeWithModifiers = {
      type: 'element' as const,
      tag: 'div',
      props: { id: 'test-with-modifiers' },
      children: [],
      modifiers: [], // Empty modifiers array
    }

    const element = renderer.render(nodeWithModifiers)

    expect(element).toBeDefined()
    expect((element as Element).tagName).toBe('DIV')
    expect((element as Element).id).toBe('test-with-modifiers')

    // Check that the modifier property exists
    expect('modifiers' in nodeWithModifiers).toBe(true)
    expect(nodeWithModifiers.modifiers).toEqual([])
  })
})
