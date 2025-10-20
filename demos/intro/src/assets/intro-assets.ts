/**
 * Intro App Color Assets
 *
 * Theme-adaptive color definitions following TachUI patterns
 * Using HSL colors as requested
 */

import { registerAsset, ColorAsset, createGoogleFont } from '@tachui/core/minimal'
import { createGradientAsset, LinearGradient } from '@tachui/core/gradients'

/**
 * Initialize intro app color assets
 */
export function createIntroAssets() {
  // Primary purple gradient colors
  registerAsset(
    ColorAsset.init({
      default: 'hsl(251, 91%, 66%)', // #8b5cf6
      name: 'primaryPurple',
    })
  )

  // Header background
  registerAsset(
    ColorAsset.init({
      default: 'hsla(263, 91%, 12%, 0.9)', // dark purple with transparency
      light: 'hsla(263, 91%, 12%, 0.9)',
      dark: 'hsla(263, 91%, 12%, 0.9)',
      name: 'headerBackground',
    })
  )

  // primaryPurple Variants
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.75)',
      name: 'primaryPurple75',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.6)',
      name: 'primaryPurple60',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.5)',
      name: 'primaryPurple50',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.3)',
      name: 'primaryPurple30',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.2)',
      name: 'primaryPurple20',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.15)',
      name: 'primaryPurple15',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(251, 91%, 66%, 0.1)',
      name: 'primaryPurple10',
    })
  )

  // Background gradient colors
  registerAsset(
    ColorAsset.init({
      default: 'hsl(263, 91%, 12%)',
      name: 'darkPurple',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(263, 91%, 12%, 0.9)',
      name: 'darkPurple90',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(263, 91%, 12%, 0.8)',
      name: 'darkPurple80',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(263, 91%, 12%, 0.7)',
      name: 'darkPurple70',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(263, 91%, 12%, 0.3)',
      name: 'darkPurple30',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(263, 91%, 12%, 0.2)',
      name: 'darkPurple20',
    })
  )

  registerAsset(
    ColorAsset.init({
      default: 'hsl(263, 70%, 50%)', // #6f42c1
      light: 'hsl(263, 70%, 50%)',
      dark: 'hsl(263, 70%, 50%)',
      name: 'secondaryPurple',
    })
  )

  // Text colors
  registerAsset(
    ColorAsset.init({
      default: 'hsl(0, 0%, 100%)', // white
      name: 'textWhite',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(0, 0%, 100%, 0.8)',
      name: 'white80',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(0, 0%, 100%, 0.6)',
      name: 'white60',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(0, 0%, 100%, 0.1)',
      name: 'white10',
    })
  )

  registerAsset(
    ColorAsset.init({
      default: 'hsl(0, 0%, 20%)', // #333
      light: 'hsl(0, 0%, 20%)',
      dark: 'hsl(0, 0%, 80%)',
      name: 'textDark',
    })
  )

  // Accent colors
  registerAsset(
    ColorAsset.init({
      default: 'hsl(35, 100%, 50%)', // orange accent
      name: 'accentOrange',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(35, 100%, 50%, 0.15)', // orange accent
      name: 'accentOrange15',
    })
  )
  registerAsset(
    ColorAsset.init({
      default: 'hsla(35, 100%, 50%, 0.4)', // orange accent
      name: 'accentOrange40',
    })
  )

  // Hero gradient asset
  // linear-gradient( hsla(263, 91%, 12%, 0.7), hsla(263, 91%, 12%, 0.7) );
  registerAsset(
    createGradientAsset({
      light: LinearGradient({
        colors: ['hsl(263, 91%, 12%)', 'hsl(251, 91%, 46%)'],
        startPoint: 'topLeading',
        endPoint: 'bottomTrailing',
      }),
      dark: LinearGradient({
        colors: ['hsl(263, 91%, 12%)', 'hsl(251, 91%, 46%)'],
        startPoint: 'topLeading',
        endPoint: 'bottomTrailing',
      }),
    })
  )

  // Font assets
  const baseFont = createGoogleFont('Dosis', [200, 300, 400, 500, 600, 700, 800], 'baseFont', {
    loading: 'eager', // Load when font is actually used
    fontDisplay: 'swap',
    preconnect: true, // Enable preconnect for faster loading
  })

  // Create FontAsset directly with proper cursive fallbacks
  const logoFont = createGoogleFont('Madimi One', [400], 'logoFont', {
    loading: 'eager',
    fontDisplay: 'swap',
    preconnect: true,
  })

  registerAsset(baseFont, 'baseFont')
  registerAsset(logoFont, 'logoFont')
}
