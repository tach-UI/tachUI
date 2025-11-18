import { AppearanceModifier } from '@tachui/core/modifiers'
import type { Signal } from '@tachui/types/reactive'

export function opacity(value: number | Signal<number>) {
  return new AppearanceModifier({ opacity: value })
}

export function cornerRadius(value: number | Signal<number>) {
  return new AppearanceModifier({ cornerRadius: value })
}

export function borderReactive(options: any) {
  return new AppearanceModifier({ border: options })
}

export function blur(value: number | Signal<number>) {
  return new AppearanceModifier({ blur: value })
}

export function brightness(value: number | Signal<number>) {
  return new AppearanceModifier({ brightness: value })
}

export function contrast(value: number | Signal<number>) {
  return new AppearanceModifier({ contrast: value })
}

export function saturation(value: number | Signal<number>) {
  return new AppearanceModifier({ saturation: value })
}

export function hueRotation(value: number | Signal<number>) {
  return new AppearanceModifier({ hueRotation: value })
}

export function grayscale(value: number | Signal<number>) {
  return new AppearanceModifier({ grayscale: value })
}

export function colorInvert(value: number | Signal<number>) {
  return new AppearanceModifier({ colorInvert: value })
}

export function fontFamilyModifier(family: any) {
  return new AppearanceModifier({ font: { family } })
}

export function fontSizeModifier(size: any) {
  return new AppearanceModifier({ font: { size } })
}

export function fontWeightModifier(weight: any) {
  return new AppearanceModifier({ font: { weight } })
}

export function fontStyleModifier(style: any) {
  return new AppearanceModifier({ font: { style } })
}

export function fontPreset(preset: string) {
  return new AppearanceModifier({ font: preset })
}

export function backgroundColorReactive(color: any) {
  return new AppearanceModifier({ backgroundColor: color })
}

export function foregroundColorReactive(color: any) {
  return new AppearanceModifier({ foregroundColor: color })
}
