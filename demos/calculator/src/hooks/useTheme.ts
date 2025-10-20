/**
 * Theme Management Hook
 *
 * Provides reactive theme state and forces component updates when theme changes
 * This is a workaround until ColorAssets become fully reactive in TachUI core
 */

import { createSignal } from '@tachui/core/reactive'
import { getCurrentTheme } from '@tachui/core/reactive'

// Global theme state that components can subscribe to
const [themeState, setThemeState] = createSignal(getCurrentTheme())

// Track render counter to force re-renders
const [renderCount, setRenderCount] = createSignal(0)

// Listen for theme changes and update the reactive state
if (typeof document !== 'undefined') {
  document.addEventListener('tachui-theme-changed', (event: CustomEvent) => {
    setThemeState(event.detail.theme)
    // Force all theme-reactive components to re-render
    setRenderCount(prev => prev + 1)
  })
}

/**
 * Hook that provides reactive theme state
 * Components using this will re-render when the theme changes
 */
export function useTheme() {
  return {
    currentTheme: themeState,
    isDark: () => themeState() === 'dark',
    isLight: () => themeState() === 'light'
  }
}

/**
 * Force a component to be theme-reactive by using this in the component
 * This ensures the component re-renders when theme changes by accessing the render counter
 */
export function useThemeReactivity() {
  // Accessing both themeState and renderCount makes the component reactive to theme changes
  const theme = themeState()
  const count = renderCount()
  return { theme, renderCount: count }
}

/**
 * Get theme-adaptive colors directly (bypassing ColorAsset resolution issues)
 */
export function getThemeColors() {
  const isDark = themeState() === 'dark'

  return {
    // Calculator container
    calculatorBackground: isDark ? 'rgba(44, 44, 46, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    calculatorBorder: isDark ? 'rgba(84, 84, 88, 0.3)' : 'rgba(255, 255, 255, 0.3)',
    calculatorShadow: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)',

    // Display
    displayBackground: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    displayText: isDark ? '#f2f2f7' : '#1d1d1f',

    // Number buttons
    numberButtonBackground: isDark ? '#505050' : '#f2f2f7',
    numberButtonForeground: isDark ? '#ffffff' : '#000000',

    // Operator buttons
    operatorButtonBackground: isDark ? '#ff9f0a' : '#ff9500',
    operatorButtonBackgroundActive: isDark ? '#1c1c1e' : '#ffffff',
    operatorButtonForeground: isDark ? '#000000' : '#ffffff',
    operatorButtonForegroundActive: isDark ? '#ff9f0a' : '#ff9500',

    // Function buttons
    functionButtonBackground: isDark ? '#636366' : '#a5a5a5',
    functionButtonForeground: isDark ? '#ffffff' : '#000000'
  }
}
