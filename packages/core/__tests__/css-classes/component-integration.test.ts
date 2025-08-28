/**
 * CSS Classes Enhancement - Component Integration Tests
 * 
 * Tests that verify CSS classes work correctly with actual tachUI components
 */

import { describe, it, expect } from 'vitest'
import { createSignal, createComputed } from '../../src/reactive'
import { Text } from '../../src/components/Text'
import { Button } from '../../src/components/Button'
import { VStack, HStack, ZStack } from '../../src/components/wrapper'
import { Spacer } from '../../src/components/Spacer'
import { Image } from '../../src/components/Image'
import { BasicInput } from '../../src/components/BasicInput'

describe('CSS Classes Enhancement - Component Integration', () => {
  describe('Text Component Integration', () => {
    it('should render Text with static CSS classes', () => {
      const text = Text('Hello World', { css: 'text-lg font-bold' })
      const elements = text.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-text text-lg font-bold')
    })

    it('should render Text with array CSS classes', () => {
      const text = Text('Hello World', { css: ['text-lg', 'font-bold', 'text-blue-500'] })
      const elements = text.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-text text-lg font-bold text-blue-500')
    })

    it('should render Text with reactive CSS classes', () => {
      const [isActive, setActive] = createSignal(false)
      const dynamicClasses = createComputed(() => 
        isActive() ? 'text-blue-500 font-bold' : 'text-gray-500 font-normal'
      )
      
      const text = Text('Hello World', { css: dynamicClasses })
      const elements = text.render()
      
      expect(elements).toHaveLength(1)
      // Note: Reactive classes will be processed as signals, so we check for the function
      expect(typeof elements[0].props?.className).toBe('function')
    })

    it('should handle Text without CSS classes', () => {
      const text = Text('Hello World')
      const elements = text.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-text')
    })
  })

  describe('Button Component Integration', () => {
    it('should render Button with static CSS classes', () => {
      const button = Button('Click me', undefined, { css: 'btn btn-primary' })
      const elements = button.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-button btn btn-primary')
    })

    it('should render Button with Tailwind classes', () => {
      const button = Button('Click me', undefined, { 
        css: 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded'
      })
      const elements = button.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-button bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded')
    })

    it('should handle Button with reactive CSS classes', () => {
      const [isLoading, setLoading] = createSignal(false)
      const buttonClasses = createComputed(() => 
        isLoading() ? 'btn btn-disabled opacity-50' : 'btn btn-primary'
      )
      
      const button = Button('Submit', undefined, { css: buttonClasses })
      const elements = button.render()
      
      expect(elements).toHaveLength(1)
      expect(typeof elements[0].props?.className).toBe('function')
    })
  })

  describe('Layout Components Integration', () => {
    it('should render VStack with CSS classes', () => {
      const vstack = VStack({ css: 'container mx-auto p-4' })
      const elements = vstack.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-vstack container mx-auto p-4')
    })

    it('should render HStack with CSS classes', () => {
      const hstack = HStack({ css: 'flex items-center justify-between' })
      const elements = hstack.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-hstack flex items-center justify-between')
    })

    it('should render ZStack with CSS classes', () => {
      const zstack = ZStack({ css: 'relative overflow-hidden' })
      const elements = zstack.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-zstack relative overflow-hidden')
    })

    it('should handle nested layout components with different CSS classes', () => {
      const innerText = Text('Content', { css: 'text-center' })
      const hstack = HStack({ 
        css: 'flex items-center',
        children: [innerText]
      })
      const vstack = VStack({ 
        css: 'container mx-auto',
        children: [hstack]
      })
      
      const elements = vstack.render()
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-vstack container mx-auto')
    })
  })

  describe('Other Components Integration', () => {
    it('should render Spacer with CSS classes', () => {
      const spacer = Spacer({ css: 'flex-1 bg-gray-100' })
      const elements = spacer.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-spacer flex-1 bg-gray-100')
    })

    it('should render Image with CSS classes', () => {
      const image = Image('/test.jpg', { css: 'rounded-lg shadow-md' })
      const elements = image.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-image rounded-lg shadow-md')
    })

    it('should render BasicInput with CSS classes', () => {
      const [text, setText] = createSignal('')
      const input = BasicInput({ 
        text, 
        setText, 
        css: 'form-control border-2 rounded'
      })
      const elements = input.render()
      
      expect(elements).toHaveLength(1)
      expect(elements[0].props?.className).toBe('tachui-basic-input form-control border-2 rounded')
    })
  })

  describe('Framework Integration Scenarios', () => {
    it('should support Tailwind CSS utility classes across components', () => {
      const text = Text('Title', { css: 'text-2xl font-bold text-gray-800' })
      const button = Button('Action', undefined, { 
        css: 'bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg'
      })
      const vstack = VStack({ 
        css: 'max-w-md mx-auto bg-white rounded-lg shadow-lg p-6',
        children: [text, button]
      })
      
      const elements = vstack.render()
      expect(elements[0].props?.className).toBe('tachui-vstack max-w-md mx-auto bg-white rounded-lg shadow-lg p-6')
    })

    it('should support Bootstrap classes across components', () => {
      const text = Text('Alert', { css: 'alert-heading' })
      const button = Button('Close', undefined, { 
        css: 'btn btn-secondary btn-sm'
      })
      const hstack = HStack({ 
        css: 'alert alert-info d-flex justify-content-between align-items-center',
        children: [text, button]
      })
      
      const elements = hstack.render()
      expect(elements[0].props?.className).toBe('tachui-hstack alert alert-info d-flex justify-content-between align-items-center')
    })

    it('should support custom design system classes', () => {
      const text = Text('Product Title', { css: 'ds-heading ds-heading--h2 ds-text--primary' })
      const button = Button('Add to Cart', undefined, { 
        css: 'ds-button ds-button--primary ds-button--large'
      })
      const vstack = VStack({ 
        css: 'ds-card ds-card--elevated ds-spacing--large',
        children: [text, button]
      })
      
      const elements = vstack.render()
      expect(elements[0].props?.className).toBe('tachui-vstack ds-card ds-card--elevated ds-spacing--large')
    })
  })

  describe('Complex Integration Scenarios', () => {
    it('should handle mixed static and reactive classes across components', () => {
      const [isVisible, setVisible] = createSignal(true)
      const [theme, setTheme] = createSignal('light')
      
      const dynamicClasses = createComputed(() => 
        isVisible() 
          ? theme() === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'
          : 'hidden'
      )
      
      const text = Text('Dynamic Content', { css: dynamicClasses })
      const vstack = VStack({ 
        css: 'container mx-auto p-4 rounded-lg',
        children: [text]
      })
      
      const elements = vstack.render()
      expect(elements[0].props?.className).toBe('tachui-vstack container mx-auto p-4 rounded-lg')
    })

    it('should handle deeply nested components with various CSS class types', () => {
      const [active, setActive] = createSignal(0)
      
      const tab1 = Text('Tab 1', { 
        css: createComputed(() => 
          active() === 0 ? 'tab-active font-bold' : 'tab-inactive'
        )
      })
      
      const tab2 = Text('Tab 2', { css: ['tab', 'tab-secondary'] })
      
      const tabContainer = HStack({ 
        css: 'tab-container border-b',
        children: [tab1, tab2]
      })
      
      const content = VStack({ 
        css: 'tab-content p-4 bg-gray-50',
        children: [Text('Content Area')]
      })
      
      const root = VStack({ 
        css: 'tab-widget bg-white rounded shadow',
        children: [tabContainer, content]
      })
      
      const elements = root.render()
      expect(elements[0].props?.className).toBe('tachui-vstack tab-widget bg-white rounded shadow')
    })
  })

  describe('Performance and Memory', () => {
    it('should handle many components with CSS classes efficiently', () => {
      const components = Array.from({ length: 100 }, (_, i) => 
        Text(`Item ${i}`, { css: `item item-${i} text-sm` })
      )
      
      const start = performance.now()
      components.forEach(component => component.render())
      const end = performance.now()
      
      expect(end - start).toBeLessThan(100) // Should render quickly
    })

    it('should handle reactive CSS classes updates efficiently', () => {
      const [state, setState] = createSignal(0)
      const components = Array.from({ length: 50 }, (_, i) => 
        Text(`Item ${i}`, { 
          css: createComputed(() => `item-${state()} color-${i % 5}`)
        })
      )
      
      // Initial render
      components.forEach(component => component.render())
      
      // Update state multiple times
      const start = performance.now()
      for (let i = 0; i < 10; i++) {
        setState(i)
        // Reactive updates happen automatically
      }
      const end = performance.now()
      
      expect(end - start).toBeLessThan(50) // Should update efficiently
    })
  })
})