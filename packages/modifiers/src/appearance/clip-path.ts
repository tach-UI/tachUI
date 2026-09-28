/**
 * clip-path serialization
 *
 * Re-exports only. The serializer lives in `@tachui/core/modifiers`, where
 * this package's `ClipShapeModifier` and the props-based `clipShape` on
 * `AppearanceModifier` both reach it; this path stays for existing imports.
 */

export {
  clipPathFor,
  clipPathForName,
  isShapeInstance,
  type ClipShapeName,
} from '@tachui/core/modifiers'
