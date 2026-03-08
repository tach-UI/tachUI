/**
 * Keyboard Support Hook
 * 
 * Enables full keyboard navigation and input for calculator
 * Demonstrates event handling and accessibility patterns
 */

import { createEffect, createSignal, onCleanup, createRoot } from '@tachui/core/reactive'
import { type CalculatorButton } from '../logic/calculator-logic'

export interface KeyboardSupportOptions {
  onButtonPress: (button: CalculatorButton) => void
  enabled?: boolean
}

// Keyboard mapping to calculator buttons
const keyMap: Record<string, CalculatorButton> = {
  // Numbers
  '0': '0',
  '1': '1',
  '2': '2',
  '3': '3',
  '4': '4',
  '5': '5',
  '6': '6',
  '7': '7',
  '8': '8',
  '9': '9',
  
  // Operations
  '+': '+',
  '-': '-',
  '*': '×',
  '/': '÷',
  'x': '×', // Alternative multiplication
  '=': '=',
  'Enter': '=',
  
  // Functions
  'Escape': 'AC',
  'c': 'AC',
  'C': 'AC',
  'Clear': 'AC', // Numpad Clear key (Mac keyboards)
  '.': '.',
  'Backspace': '⌫', // Delete last digit
  '%': '%',
  't': 'Tape',
  'T': 'Tape'
}

export function useKeyboardSupport({ onButtonPress, enabled = true }: KeyboardSupportOptions) {
  const [lastPressedKey, setLastPressedKey] = createSignal<string | null>(null)
  
  // Create our own reactive context to avoid the "outside reactive context" warning
  createRoot(() => {
    createEffect(() => {
      if (!enabled) return
      
      const handleKeyDown = (event: KeyboardEvent) => {
        const key = event.key
        const mappedButton = keyMap[key]
        
        if (mappedButton) {
          // Check if the target is a button element (focused button)
          const targetIsButton = event.target instanceof HTMLButtonElement
          
          // If Enter/Space is pressed on a focused button, let it handle the visual feedback
          // but still call onButtonPress for calculator logic
          if ((key === 'Enter' || key === ' ') && targetIsButton) {
            // Don't prevent default - let Button component show visual feedback
            // But still handle the calculator action
            setLastPressedKey(key)
            onButtonPress(mappedButton)
            setTimeout(() => setLastPressedKey(null), 150)
            return
          }
          
          // For all other cases (non-focused buttons or other keys), prevent default and handle normally
          if (key === 'Enter' || key === ' ' || key === 'Escape' || key === '/') {
            event.preventDefault()
          }
          
          setLastPressedKey(key)
          onButtonPress(mappedButton)
          
          // Clear the key highlight after a short delay
          setTimeout(() => setLastPressedKey(null), 150)
        }
      }
      
      // Add event listener to handle keyboard shortcuts (no capture phase to allow Button's native handling)
      document.addEventListener('keydown', handleKeyDown)
      
      // Cleanup function
      onCleanup(() => {
        document.removeEventListener('keydown', handleKeyDown)
      })
    })
  })
  
  return {
    lastPressedKey,
    isKeyPressed: (key: string) => lastPressedKey() === key
  }
}