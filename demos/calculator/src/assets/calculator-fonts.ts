/**
 * Calculator Font Assets
 *
 * Defines custom fonts for the calculator app using TachUI's FontAsset system
 */

import { createGoogleFont, registerAsset } from '@tachui/core/assets'

// Base font - Dosis loaded via TachUI's FontAsset system
export const baseFont = createGoogleFont(
  'Dosis',
  [200, 300, 400, 500, 600, 700, 800],
  'calculatorBaseFont',
  {
    loading: 'eager', // Load when font is actually used
    fontDisplay: 'swap',
    preconnect: true // Enable preconnect for faster loading
  }
)

export const logoFont = createGoogleFont(
  'Madimi One',
  [400],
  'calculatorLogoFont',
  {
    loading: 'eager', // Load when font is actually used
    fontDisplay: 'swap',
    preconnect: true // Enable preconnect for faster loading
  }
)

// Register fonts as global assets - using simplified API
registerAsset(logoFont, "calculatorLogoFont")
registerAsset(baseFont, "calculatorBaseFont")
