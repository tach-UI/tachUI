/**
 * Event Modifiers Test Suite
 * 
 * Tests for all new event modifiers added in Epic: Butternut Phase 1
 * Critical Event Modifier Gaps implementation
 */

import { JSDOM } from 'jsdom'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Text, VStack, Button, BasicInput, withModifiers } from '../../src/components'
import { InteractionModifier } from '../../src/modifiers/base'
import { createSignal } from '../../src/reactive'
import { createComponent, h } from '../../src/runtime'
import type { ComponentInstance } from '../../src/runtime/types'

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>')
global.window = dom.window as any
global.document = dom.window.document
global.HTMLElement = dom.window.HTMLElement
global.Element = dom.window.Element

// Mock ClipboardEvent for JSDOM
global.ClipboardEvent = class ClipboardEvent extends Event {
  // eslint-disable-next-line no-useless-constructor
  constructor(type: string, eventInitDict?: EventInit) {
    super(type, eventInitDict)
  }
} as any

// Test utilities
const createTestElement = (tagName: string = 'div'): HTMLElement => {
  return document.createElement(tagName)
}

describe('Event Modifiers - Epic: Butternut Phase 1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('InteractionModifier Event Handling', () => {
    let element: HTMLElement
    let mockContext: any

    beforeEach(() => {
      element = createTestElement()
      mockContext = {
        element,
        componentId: 'test-component',
        phase: 'creation'
      }
    })

    it('should handle onFocus events', () => {
      const onFocusHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onFocus: onFocusHandler })
      modifier.apply({} as any, mockContext)
      
      // Simulate focus event
      element.dispatchEvent(new FocusEvent('focus'))
      expect(onFocusHandler).toHaveBeenCalledWith(true)
      
      // Simulate blur event (should also trigger onFocus with false)
      element.dispatchEvent(new FocusEvent('blur'))
      expect(onFocusHandler).toHaveBeenCalledWith(false)
    })

    it('should handle onBlur events separately', () => {
      const onBlurHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onBlur: onBlurHandler })
      modifier.apply({} as any, mockContext)
      
      // Simulate blur event
      element.dispatchEvent(new FocusEvent('blur'))
      expect(onBlurHandler).toHaveBeenCalledWith(false)
    })

    it('should handle onDoubleClick events', () => {
      const onDoubleClickHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onDoubleClick: onDoubleClickHandler })
      modifier.apply({} as any, mockContext)
      
      const dblClickEvent = new MouseEvent('dblclick', { button: 0 })
      element.dispatchEvent(dblClickEvent)
      expect(onDoubleClickHandler).toHaveBeenCalledWith(dblClickEvent)
    })

    it('should handle onContextMenu events', () => {
      const onContextMenuHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onContextMenu: onContextMenuHandler })
      modifier.apply({} as any, mockContext)
      
      const contextEvent = new MouseEvent('contextmenu', { button: 2 })
      element.dispatchEvent(contextEvent)
      expect(onContextMenuHandler).toHaveBeenCalledWith(contextEvent)
    })

    it('should handle onKeyPress events', () => {
      const onKeyPressHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onKeyPress: onKeyPressHandler })
      modifier.apply({} as any, mockContext)
      
      const keyEvent = new KeyboardEvent('keypress', { key: 'Enter' })
      element.dispatchEvent(keyEvent)
      expect(onKeyPressHandler).toHaveBeenCalledWith(keyEvent)
    })

    it('should handle onKeyDown events', () => {
      const onKeyDownHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onKeyDown: onKeyDownHandler })
      modifier.apply({} as any, mockContext)
      
      const keyEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      element.dispatchEvent(keyEvent)
      expect(onKeyDownHandler).toHaveBeenCalledWith(keyEvent)
    })

    it('should handle onKeyUp events', () => {
      const onKeyUpHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onKeyUp: onKeyUpHandler })
      modifier.apply({} as any, mockContext)
      
      const keyEvent = new KeyboardEvent('keyup', { key: 'Space' })
      element.dispatchEvent(keyEvent)
      expect(onKeyUpHandler).toHaveBeenCalledWith(keyEvent)
    })

    it('should handle onScroll events with passive option', () => {
      const onScrollHandler = vi.fn()
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener')
      
      const modifier = new InteractionModifier({ onScroll: onScrollHandler })
      modifier.apply({} as any, mockContext)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'scroll',
        onScrollHandler,
        { passive: true }
      )
      
      const scrollEvent = new Event('scroll')
      element.dispatchEvent(scrollEvent)
      expect(onScrollHandler).toHaveBeenCalledWith(scrollEvent)
    })

    it('should handle onWheel events with non-passive option', () => {
      const onWheelHandler = vi.fn()
      const addEventListenerSpy = vi.spyOn(element, 'addEventListener')
      
      const modifier = new InteractionModifier({ onWheel: onWheelHandler })
      modifier.apply({} as any, mockContext)
      
      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'wheel',
        onWheelHandler,
        { passive: false }
      )
      
      const wheelEvent = new WheelEvent('wheel', { deltaY: 100 })
      element.dispatchEvent(wheelEvent)
      expect(onWheelHandler).toHaveBeenCalledWith(wheelEvent)
    })

    it('should handle onInput events', () => {
      const onInputHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onInput: onInputHandler })
      modifier.apply({} as any, mockContext)
      
      const inputEvent = new InputEvent('input')
      element.dispatchEvent(inputEvent)
      expect(onInputHandler).toHaveBeenCalledWith(inputEvent)
    })

    it('should handle onChange events with value extraction', () => {
      const onChangeHandler = vi.fn()
      const inputElement = document.createElement('input') as HTMLInputElement
      mockContext.element = inputElement
      
      const modifier = new InteractionModifier({ onChange: onChangeHandler })
      modifier.apply({} as any, mockContext)
      
      // Set input value and trigger change event
      inputElement.value = 'test value'
      const changeEvent = new Event('change')
      Object.defineProperty(changeEvent, 'target', {
        value: inputElement,
        writable: false
      })
      inputElement.dispatchEvent(changeEvent)
      
      expect(onChangeHandler).toHaveBeenCalledWith('test value', changeEvent)
    })

    it('should handle onCopy events', () => {
      const onCopyHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onCopy: onCopyHandler })
      modifier.apply({} as any, mockContext)
      
      const copyEvent = new ClipboardEvent('copy')
      element.dispatchEvent(copyEvent)
      expect(onCopyHandler).toHaveBeenCalledWith(copyEvent)
    })

    it('should handle onCut events', () => {
      const onCutHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onCut: onCutHandler })
      modifier.apply({} as any, mockContext)
      
      const cutEvent = new ClipboardEvent('cut')
      element.dispatchEvent(cutEvent)
      expect(onCutHandler).toHaveBeenCalledWith(cutEvent)
    })

    it('should handle onPaste events', () => {
      const onPasteHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onPaste: onPasteHandler })
      modifier.apply({} as any, mockContext)
      
      const pasteEvent = new ClipboardEvent('paste')
      element.dispatchEvent(pasteEvent)
      expect(onPasteHandler).toHaveBeenCalledWith(pasteEvent)
    })

    it('should handle onSelect events', () => {
      const onSelectHandler = vi.fn()
      
      const modifier = new InteractionModifier({ onSelect: onSelectHandler })
      modifier.apply({} as any, mockContext)
      
      const selectEvent = new Event('select')
      element.dispatchEvent(selectEvent)
      expect(onSelectHandler).toHaveBeenCalledWith(selectEvent)
    })

    it('should handle multiple event modifiers on the same element', () => {
      const onFocusHandler = vi.fn()
      const onKeyDownHandler = vi.fn()
      const onInputHandler = vi.fn()
      
      const modifier = new InteractionModifier({ 
        onFocus: onFocusHandler,
        onKeyDown: onKeyDownHandler,
        onInput: onInputHandler 
      })
      modifier.apply({} as any, mockContext)
      
      // Test focus
      element.dispatchEvent(new FocusEvent('focus'))
      expect(onFocusHandler).toHaveBeenCalledWith(true)
      
      // Test keydown
      const keyEvent = new KeyboardEvent('keydown', { key: 'a' })
      element.dispatchEvent(keyEvent)
      expect(onKeyDownHandler).toHaveBeenCalledWith(keyEvent)
      
      // Test input
      const inputEvent = new InputEvent('input')
      element.dispatchEvent(inputEvent)
      expect(onInputHandler).toHaveBeenCalledWith(inputEvent)
    })
  })

  describe('Modifier Builder Integration', () => {
    it('should create InteractionModifier instances for all new event modifiers', () => {
      const onFocusHandler = vi.fn()
      const onBlurHandler = vi.fn()
      const onKeyDownHandler = vi.fn()
      const onScrollHandler = vi.fn()
      
      const component = Text('Test Component')
        .modifier
        .onFocus(onFocusHandler)
        .onBlur(onBlurHandler)
        .onKeyDown(onKeyDownHandler)
        .onScroll(onScrollHandler)
        .build()
      
      expect(component.modifiers).toHaveLength(4)
      expect(component.modifiers[0].type).toBe('interaction')
      expect(component.modifiers[1].type).toBe('interaction')
      expect(component.modifiers[2].type).toBe('interaction')
      expect(component.modifiers[3].type).toBe('interaction')
    })

    it('should provide TypeScript support for all new modifiers', () => {
      // This test ensures the TypeScript interfaces are properly defined
      const component = Button('Test Button', () => {})
        .modifier
        .onFocus((focused: boolean) => console.log(focused))
        .onBlur((focused: boolean) => console.log(focused))
        .onKeyPress((event: KeyboardEvent) => console.log(event.key))
        .onKeyDown((event: KeyboardEvent) => console.log(event.key))
        .onKeyUp((event: KeyboardEvent) => console.log(event.key))
        .onDoubleClick((event: MouseEvent) => console.log(event.button))
        .onContextMenu((event: MouseEvent) => console.log(event.button))
        .onScroll((event: Event) => console.log(event.type))
        .onWheel((event: WheelEvent) => console.log(event.deltaY))
        .onInput((event: InputEvent) => console.log(event.type))
        .onChange((value: any, event?: Event) => console.log(value))
        .onCopy((event: ClipboardEvent) => console.log(event.type))
        .onCut((event: ClipboardEvent) => console.log(event.type))
        .onPaste((event: ClipboardEvent) => console.log(event.type))
        .onSelect((event: Event) => console.log(event.type))
        .build()
      
      expect(component.modifiers).toHaveLength(15)
    })
  })
})