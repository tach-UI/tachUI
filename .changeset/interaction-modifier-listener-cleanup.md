---
'@tachui/core': patch
'@tachui/modifiers': patch
---

Fix interaction modifier listener leaks (#216): `onHover`, `onContinuousHover`, `onLongPressGesture`, and `InteractionModifier` (`.onTap()`, `.onHover()`, gestures, keyboard, scroll, etc.) now return a `ModifierResult` whose `cleanup` removes every registered DOM event listener — including document-level keyboard shortcut listeners — when the component unmounts. The modifier registry (`applyModifiersSequential`, batch path, and `combineModifiers`) now harvests `ModifierResult` returns and chains their cleanup onto `node.dispose`, which the renderer already drains on teardown. Listener teardown is double-dispose safe.
