// Import modifiers FIRST to register basic modifiers AND effects (effects merged into modifiers)
import '@tachui/modifiers'
import '@tachui/modifiers/effects'
// Import responsive system to register responsive modifiers
import '@tachui/responsive'
import { mountRoot, setTheme, detectSystemTheme } from '@tachui/core'
import { initializeResponsiveSystem } from '@tachui/responsive'
import { IntroApp } from './components/IntroApp'
import { createIntroAssets } from './assets/intro-assets'
// Import the auto-generated icon set to register it
import './icons/auto-generated'

// Set initial theme properly BEFORE creating assets
const initialTheme = detectSystemTheme()
setTheme(initialTheme)
document.documentElement.classList.add(`${initialTheme}-theme`)

// Initialize responsive system
initializeResponsiveSystem()

// Initialize assets at module load time (like calculator)
createIntroAssets()

// Mount the app using standard TachUI mounting
mountRoot(() => {
  // Create app AFTER assets are guaranteed to be available
  const app = IntroApp()
  return app
})
