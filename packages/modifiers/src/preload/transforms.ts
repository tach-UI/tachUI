/**
 * Preload entry for transform-style effects (rotations, scaling, perspective).
 */

import { globalModifierRegistry } from '@tachui/registry'
import {
  advancedTransform,
  backfaceVisibility,
  matrix,
  matrix3d,
  perspective,
  perspectiveOrigin,
  rotate,
  rotate3d,
  rotateX,
  rotateY,
  rotateZ,
  scale,
  scale3d,
  scaleX,
  scaleY,
  scaleZ,
  skew,
  transform,
  transformStyle,
  translate,
  translate3d,
  translateX,
  translateY,
  translateZ,
} from '../effects/transforms'

const transformRegistrations: Array<[string, (...args: any[]) => any]> = [
  ['transform', transform],
  ['scale', scale],
  ['rotate', rotate],
  ['translate', translate],
  ['skew', skew],
  ['rotateX', rotateX],
  ['rotateY', rotateY],
  ['rotateZ', rotateZ],
  ['perspective', perspective],
  ['advancedTransform', advancedTransform],
  ['matrix', matrix],
  ['matrix3d', matrix3d],
  ['rotate3d', rotate3d],
  ['scale3d', scale3d],
  ['translate3d', translate3d],
  ['scaleX', scaleX],
  ['scaleY', scaleY],
  ['scaleZ', scaleZ],
  ['translateX', translateX],
  ['translateY', translateY],
  ['translateZ', translateZ],
  ['perspectiveOrigin', perspectiveOrigin],
  ['transformStyle', transformStyle],
  ['backfaceVisibility', backfaceVisibility],
]

transformRegistrations.forEach(([name, factory]) => {
  if (!globalModifierRegistry.has(name)) {
    globalModifierRegistry.register(name, factory as any)
  }
})

export * from '../effects/transforms'
