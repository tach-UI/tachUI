/**
 * Theme Reactivity Tests
 * 
 * Tests that ColorAssets are reactive to theme changes through the modifier system
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ColorAsset } from '../../src/assets/ColorAsset'
import { AppearanceModifier } from '../../src/modifiers/base'
import { setTheme } from '../../src/reactive/theme'
import { createEffect, createRoot } from '../../src/reactive'

describe('ColorAsset Theme Reactivity', () => {
  let mockElement: HTMLElement

  beforeEach(() => {
    // Create mock element
    mockElement = document.createElement('div')
    
    // Reset theme to light
    setTheme('light')
    
    // Clear any existing styles
    mockElement.style.cssText = ''
  })

  it('should reactively update backgroundColor when theme changes', async () => {
    return new Promise<void>((resolve, reject) => {
      createRoot(() => {
        try {
          // Create a ColorAsset
          const colorAsset = ColorAsset.init({
            default: '#ffffff',
            light: '#ffffff',
            dark: '#000000',
            name: 'testColor'
          })
          
          // Create appearance modifier with the asset
          const modifier = new AppearanceModifier({ backgroundColor: colorAsset })
          
          // Apply modifier to element
          const context = {
            element: mockElement,
            componentId: 'test-component'
          }
          
          modifier.apply({ element: mockElement }, context)
          
          // Initial state should be light theme (white)
          setTimeout(() => {
            expect(mockElement.style.backgroundColor).toBe('rgb(255, 255, 255)')
            
            // Change to dark theme
            setTheme('dark')
            
            // After theme change, should be dark theme (black)
            setTimeout(() => {
              const bgColor = mockElement.style.backgroundColor
              expect(bgColor).toBe('rgb(0, 0, 0)')
              resolve()
            }, 10)
          }, 10)
        } catch (error) {
          reject(error)
        }
      })
    })
  })

  it('should reactively update foregroundColor when theme changes', async () => {
    return new Promise<void>((resolve, reject) => {
      createRoot(() => {
        try {
          // Create a ColorAsset for text color
          const textColorAsset = ColorAsset.init({
            default: '#333333',
            light: '#333333',
            dark: '#ffffff',
            name: 'textColor'
          })
          
          // Create appearance modifier with the asset
          const modifier = new AppearanceModifier({ foregroundColor: textColorAsset })
          
          // Apply modifier to element
          const context = {
            element: mockElement,
            componentId: 'test-component'
          }
          
          modifier.apply({ element: mockElement }, context)
          
          // Initial state should be light theme (dark gray)
          setTimeout(() => {
            expect(mockElement.style.color).toBe('rgb(51, 51, 51)')
            
            // Change to dark theme
            setTheme('dark')
            
            // After theme change, should be dark theme (white)
            setTimeout(() => {
              const color = mockElement.style.color
              expect(color).toBe('rgb(255, 255, 255)')
              resolve()
            }, 10)
          }, 10)
        } catch (error) {
          reject(error)
        }
      })
    })
  })

  it('should handle multiple ColorAssets reactively', async () => {
    return new Promise<void>((resolve, reject) => {
      createRoot(() => {
        try {
          // Create multiple ColorAssets
          const bgAsset = ColorAsset.init({
            default: '#f0f0f0',
            light: '#f0f0f0',
            dark: '#1a1a1a',
            name: 'bgColor'
          })
          const textAsset = ColorAsset.init({
            default: '#2c2c2c',
            light: '#2c2c2c',
            dark: '#e0e0e0',
            name: 'textColor'
          })
          
          // Create appearance modifier with both assets
          const modifier = new AppearanceModifier({ 
            backgroundColor: bgAsset,
            foregroundColor: textAsset
          })
          
          // Apply modifier to element
          const context = {
            element: mockElement,
            componentId: 'test-component'
          }
          
          modifier.apply({ element: mockElement }, context)
          
          // Initial state should be light theme
          setTimeout(() => {
            expect(mockElement.style.backgroundColor).toBe('rgb(240, 240, 240)')
            expect(mockElement.style.color).toBe('rgb(44, 44, 44)')
            
            // Change to dark theme
            setTheme('dark')
            
            // After theme change, both should update
            setTimeout(() => {
              expect(mockElement.style.backgroundColor).toBe('rgb(26, 26, 26)')
              expect(mockElement.style.color).toBe('rgb(224, 224, 224)')
              resolve()
            }, 10)
          }, 10)
        } catch (error) {
          reject(error)
        }
      })
    })
  })

  it('should not affect non-Asset color values', () => {
    createRoot(() => {
      // Create appearance modifier with static string color
      const modifier = new AppearanceModifier({ 
        backgroundColor: '#ff0000',
        foregroundColor: 'blue'
      })
      
      // Apply modifier to element
      const context = {
        element: mockElement,
        componentId: 'test-component'
      }
      
      modifier.apply({ element: mockElement }, context)
      
      // Should set static colors immediately
      expect(mockElement.style.backgroundColor).toBe('rgb(255, 0, 0)')
      expect(mockElement.style.color).toBe('blue')
      
      // Changing theme should not affect static colors
      setTheme('dark')
      
      // Colors should remain the same
      expect(mockElement.style.backgroundColor).toBe('rgb(255, 0, 0)')
      expect(mockElement.style.color).toBe('blue')
    })
  })
})