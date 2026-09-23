/**
 * Modifiers that exist but are not registered yet
 *
 * The effect modifiers are registered by `@tachui/modifiers/preload/effects`,
 * which nothing imports for you. Without it, the chain used to find no
 * `.shadow` at all, and calling it failed with "shadow is not a function",
 * which names neither the cause nor the fix. For these names the chain
 * instead returns a method that throws saying which import registers it.
 *
 * Core cannot import `@tachui/modifiers`, so the names are listed here. A
 * test in `@tachui/modifiers` checks this list against the names
 * `registerEffectModifiers()` registers, so the two cannot drift.
 */

const EFFECTS_IMPORT = '@tachui/modifiers/preload/effects'

export const effectModifierNames: readonly string[] = [
  // Filters
  'blur',
  'brightness',
  'contrast',
  'filter',
  'saturate',
  'grayscale',
  'sepia',
  'hueRotate',
  'invert',
  'filterDropShadow',
  'vintagePhoto',
  'blackAndWhite',
  'vibrant',
  'warmTone',
  'coolTone',
  'faded',
  'highKey',
  'lowKey',
  'softFocus',
  'highContrastMode',
  'subtleBlur',
  'darkModeInvert',
  'colorInvert',
  'saturation',
  'hueRotation',

  // Transforms
  'transform',
  'scale',
  'rotate',
  'translate',
  'skew',
  'rotateX',
  'rotateY',
  'rotateZ',
  'perspective',
  'advancedTransform',
  'matrix',
  'matrix3d',
  'rotate3d',
  'scale3d',
  'translate3d',
  'scaleX',
  'scaleY',
  'scaleZ',
  'translateX',
  'translateY',
  'translateZ',
  'perspectiveOrigin',
  'transformStyle',
  'backfaceVisibility',

  // Shadows
  'shadows',
  'shadowPreset',
  'shadow',
  'textShadow',
  'dropShadow',
  'insetShadow',
  'elevationShadow',
  'glowEffect',
  'neonEffect',
  'neumorphism',
  'neumorphismPressed',
  'layeredShadow',
  'textShadowSubtle',
  'textShadowStrong',
  'textOutline',
  'textEmbossed',
  'textEngraved',
  'swiftUIShadow',
  'reactiveShadow',
  'animatedShadow',

  // Interaction effects
  'hover',
  'active',
  'focus',
  'pressed',
  'hoverEffect',
  'hoverWithTransition',
  'conditionalHover',
  'interactiveCursor',
  'draggableCursor',
  'textCursor',
  'disabledCursor',
  'loadingCursor',
  'helpCursor',
  'zoomCursor',
  'buttonHover',
  'cardHover',
  'linkHover',
  'imageHover',

  // Backdrop
  'backdropFilter',
  'glassmorphism',
  'customGlassmorphism',
]

const importFor = new Map<string, string>(
  effectModifierNames.map(name => [name, EFFECTS_IMPORT])
)

const unregisteredMethods = new WeakSet<Function>()

/**
 * A method that throws naming the import that registers `name`, or
 * `undefined` if `name` is not a modifier this list knows.
 */
export function unregisteredModifierMethod(
  name: string
): ((...args: unknown[]) => never) | undefined {
  const source = importFor.get(name)
  if (!source) return undefined

  const method = (): never => {
    throw new Error(
      `Modifier '${name}' is not registered. It is registered by ` +
        `${source}: add \`import '${source}'\` before this runs.`
    )
  }
  unregisteredMethods.add(method)
  return method
}

/**
 * Whether `value` is a method from `unregisteredModifierMethod`, which stands
 * in for a modifier that is not there.
 */
export function isUnregisteredModifierMethod(value: unknown): boolean {
  return typeof value === 'function' && unregisteredMethods.has(value)
}
