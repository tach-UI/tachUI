/**
 * Effects Compatibility Layer - Migration Guide
 *
 * Visual effects have been moved to @tachui/effects for better tree-shaking
 * and bundle optimization. This file provides deprecation warnings.
 */

function createDeprecationWarning(effectName: string) {
  return function (..._args: any[]) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        `⚠️  ${effectName} has been moved to @tachui/effects.\n` +
          `   Please install @tachui/effects and update your imports:\n` +
          `   import { ${effectName} } from '@tachui/effects'\n` +
          `   \n` +
          `   Bundle impact: This migration will reduce your core bundle by ~150KB.`
      )
    }

    throw new Error(
      `${effectName} is no longer available in @tachui/core. ` +
        `Please install @tachui/effects and import from there.`
    )
  }
}

// Filters
export const filter = createDeprecationWarning('filter')
export const blur = createDeprecationWarning('blur')
export const brightness = createDeprecationWarning('brightness')
export const contrast = createDeprecationWarning('contrast')
export const saturate = createDeprecationWarning('saturate')
export const grayscale = createDeprecationWarning('grayscale')
export const sepia = createDeprecationWarning('sepia')
export const hueRotate = createDeprecationWarning('hueRotate')
export const invert = createDeprecationWarning('invert')
export const dropShadow = createDeprecationWarning('dropShadow')
export const vintagePhoto = createDeprecationWarning('vintagePhoto')
export const blackAndWhite = createDeprecationWarning('blackAndWhite')
export const vibrant = createDeprecationWarning('vibrant')
export const warmTone = createDeprecationWarning('warmTone')
export const coolTone = createDeprecationWarning('coolTone')
export const faded = createDeprecationWarning('faded')
export const highKey = createDeprecationWarning('highKey')
export const lowKey = createDeprecationWarning('lowKey')
export const softFocus = createDeprecationWarning('softFocus')
export const highContrastMode = createDeprecationWarning('highContrastMode')
export const subtleBlur = createDeprecationWarning('subtleBlur')
export const darkModeInvert = createDeprecationWarning('darkModeInvert')
export const colorInvert = createDeprecationWarning('colorInvert')
export const saturation = createDeprecationWarning('saturation')
export const hueRotation = createDeprecationWarning('hueRotation')

// Transforms
export const transform = createDeprecationWarning('transform')
export const scale = createDeprecationWarning('scale')
export const rotate = createDeprecationWarning('rotate')
export const translate = createDeprecationWarning('translate')
export const skew = createDeprecationWarning('skew')
export const rotateX = createDeprecationWarning('rotateX')
export const rotateY = createDeprecationWarning('rotateY')
export const rotateZ = createDeprecationWarning('rotateZ')
export const perspective = createDeprecationWarning('perspective')
export const advancedTransform = createDeprecationWarning('advancedTransform')
export const matrix = createDeprecationWarning('matrix')
export const matrix3d = createDeprecationWarning('matrix3d')
export const rotate3d = createDeprecationWarning('rotate3d')
export const scale3d = createDeprecationWarning('scale3d')
export const translate3d = createDeprecationWarning('translate3d')
export const scaleX = createDeprecationWarning('scaleX')
export const scaleY = createDeprecationWarning('scaleY')
export const scaleZ = createDeprecationWarning('scaleZ')
export const translateX = createDeprecationWarning('translateX')
export const translateY = createDeprecationWarning('translateY')
export const translateZ = createDeprecationWarning('translateZ')
export const perspectiveOrigin = createDeprecationWarning('perspectiveOrigin')
export const transformStyle = createDeprecationWarning('transformStyle')
export const backfaceVisibility = createDeprecationWarning('backfaceVisibility')
export const scaleEffect = createDeprecationWarning('scaleEffect')
export const offset = createDeprecationWarning('offset')

// Backdrop
export const backdropFilter = createDeprecationWarning('backdropFilter')
export const glassmorphism = createDeprecationWarning('glassmorphism')
export const customGlassmorphism = createDeprecationWarning(
  'customGlassmorphism'
)

// Interactive Effects
export const cursor = createDeprecationWarning('cursor')
export const hoverEffect = createDeprecationWarning('hoverEffect')
export const hover = createDeprecationWarning('hover')
export const hoverWithTransition = createDeprecationWarning(
  'hoverWithTransition'
)
export const conditionalHover = createDeprecationWarning('conditionalHover')
export const interactiveCursor = createDeprecationWarning('interactiveCursor')
export const draggableCursor = createDeprecationWarning('draggableCursor')
export const textCursor = createDeprecationWarning('textCursor')
export const disabledCursor = createDeprecationWarning('disabledCursor')
export const loadingCursor = createDeprecationWarning('loadingCursor')
export const helpCursor = createDeprecationWarning('helpCursor')
export const zoomCursor = createDeprecationWarning('zoomCursor')
export const buttonHover = createDeprecationWarning('buttonHover')
export const cardHover = createDeprecationWarning('cardHover')
export const linkHover = createDeprecationWarning('linkHover')
export const imageHover = createDeprecationWarning('imageHover')

// Type exports - these are now available in @tachui/effects
// Re-export from the effects package would require a dependency, so we omit them
// Applications should import types directly from @tachui/effects
