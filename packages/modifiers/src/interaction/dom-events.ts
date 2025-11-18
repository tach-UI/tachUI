/**
 * DOM Event Interaction Modifiers
 *
 * Lightweight factory helpers that wrap InteractionModifier so that
 * event-based builders inside @tachui/core can remain infrastructure-only.
 */

import type { Signal } from '@tachui/types/reactive'
import { InteractionModifier } from '../base'

type GestureInclusion = Array<'all' | 'subviews' | 'none'>

export function highPriorityGesture(
  gesture: any,
  including?: GestureInclusion
): InteractionModifier {
  return new InteractionModifier({
    highPriorityGesture: { gesture, including },
  })
}

export function simultaneousGesture(
  gesture: any,
  including?: GestureInclusion
): InteractionModifier {
  return new InteractionModifier({
    simultaneousGesture: { gesture, including },
  })
}

export function onTap(handler: (event: MouseEvent) => void): InteractionModifier {
  return new InteractionModifier({ onTap: handler })
}

export function onFocusInteraction(
  callback: (isFocused: boolean) => void
): InteractionModifier {
  return new InteractionModifier({ onFocus: callback })
}

export function onBlurInteraction(
  callback: (isFocused: boolean) => void
): InteractionModifier {
  return new InteractionModifier({ onBlur: callback })
}

export function onScroll(handler: (event: Event) => void): InteractionModifier {
  return new InteractionModifier({ onScroll: handler })
}

export function onKeyDownInteraction(
  handler: (event: KeyboardEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onKeyDown: handler })
}

export function onKeyPressInteraction(
  handler: (event: KeyboardEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onKeyPress: handler })
}

export function onKeyUpInteraction(
  handler: (event: KeyboardEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onKeyUp: handler })
}

export function onDoubleClickInteraction(
  handler: (event: MouseEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onDoubleClick: handler })
}

export function onContextMenuInteraction(
  handler: (event: MouseEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onContextMenu: handler })
}

export function onWheel(handler: (event: WheelEvent) => void): InteractionModifier {
  return new InteractionModifier({ onWheel: handler })
}

export function onInput(handler: (event: InputEvent) => void): InteractionModifier {
  return new InteractionModifier({ onInput: handler })
}

export function onChange(
  handler: (value: any, event?: Event) => void
): InteractionModifier {
  return new InteractionModifier({ onChange: handler })
}

export function onCopy(handler: (event: ClipboardEvent) => void): InteractionModifier {
  return new InteractionModifier({ onCopy: handler })
}

export function onCut(handler: (event: ClipboardEvent) => void): InteractionModifier {
  return new InteractionModifier({ onCut: handler })
}

export function onPaste(handler: (event: ClipboardEvent) => void): InteractionModifier {
  return new InteractionModifier({ onPaste: handler })
}

export function onSelect(handler: (event: Event) => void): InteractionModifier {
  return new InteractionModifier({ onSelect: handler })
}

export function onTouchStart(
  handler: (event: TouchEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onTouchStart: handler })
}

export function onTouchMove(
  handler: (event: TouchEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onTouchMove: handler })
}

export function onTouchEnd(
  handler: (event: TouchEvent) => void
): InteractionModifier {
  return new InteractionModifier({ onTouchEnd: handler })
}

export function onSwipeLeft(handler: () => void): InteractionModifier {
  return new InteractionModifier({ onSwipeLeft: handler })
}

export function onSwipeRight(handler: () => void): InteractionModifier {
  return new InteractionModifier({ onSwipeRight: handler })
}

export function disabled(
  isDisabled: boolean | Signal<boolean> = true
): InteractionModifier {
  return new InteractionModifier({ disabled: isDisabled })
}
