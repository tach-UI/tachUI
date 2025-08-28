/**
 * Theme Management System for TachUI
 *
 * Provides reactive theme management with light/dark mode support.
 */

import { createSignal } from './signal'
import { createComputed, type Computed } from './computed'

export type Theme = 'light' | 'dark' | 'system'

// Global theme signal
const [currentTheme, setCurrentTheme] = createSignal<Theme>('light')

// Function to get the current theme
export function getCurrentTheme(): Theme {
  const theme = currentTheme()
  if (theme === 'system') {
    return detectSystemTheme()
  }
  return theme
}

// Function to set the theme
export function setTheme(theme: Theme): void {
  setCurrentTheme(theme)
}

// Create a single shared computed theme signal
const themeComputed = createComputed(() => {
  const theme = currentTheme()
  if (theme === 'system') {
    return detectSystemTheme()
  }
  return theme
})

// Function to get the reactive theme signal for use in reactive effects
export function getThemeSignal(): Computed<'light' | 'dark'> {
  return themeComputed
}

// Auto-detect system theme
export function detectSystemTheme(): 'light' | 'dark' {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return 'light'
}
