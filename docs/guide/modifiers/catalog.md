---
title: Modifier Catalog
---

# Modifier Catalog

This page inventories every fluent modifier we export today so you can confirm coverage before the package-specific docs and TypeDoc pages are migrated. Modifiers are grouped by package; list items use the same `.modifierName` syntax you use in code.

> Update this file whenever you add, rename, or remove a modifier so the homepage statistics stay honest.

## @tachui/core (infrastructure)

`@tachui/core` hosts the modifier infrastructure (builder, registry, factories, padding/margin/frame helpers) used internally by the higher-level packages. End-users should continue importing concrete modifiers from `@tachui/modifiers` or `@tachui/effects`. If you are extending the framework itself, see `packages/core/src/modifiers/`.

## @tachui/modifiers

| Category | Modifiers |
| --- | --- |
| Layout basics | `.padding`, `.paddingTop`, `.paddingBottom`, `.paddingLeft`, `.paddingRight`, `.paddingLeading`, `.paddingTrailing`, `.paddingHorizontal`, `.paddingVertical`, `.margin`, `.marginTop`, `.marginBottom`, `.marginLeft`, `.marginRight`, `.marginLeading`, `.marginTrailing`, `.marginHorizontal`, `.marginVertical`, `.size`, `.width`, `.height`, `.maxWidth`, `.maxHeight`, `.minWidth`, `.minHeight` |
| Advanced layout | `.aspectRatio`, `.fixedSize`, `.offset`, `.overlay`, `.position`, `.scaleEffect`, `.zIndex` |
| Flexbox | `.flexGrow`, `.flexShrink`, `.alignItems`, `.justifyContent`, `.flexDirection`, `.flexWrap`, `.gap` |
| Appearance | `.backgroundColor`, `.border`, `.borderTop`, `.borderBottom`, `.borderLeft`, `.borderRight`, `.clipShape`, `.clipped`, `.foregroundColor`, `.gradientText` |
| Typography | `.typography`, `.textAlign`, `.font`, `.lineClamp`, `.wordBreak`, `.letterSpacing`, `.lineHeight`, `.textDecoration`, `.textOverflow`, `.textTransform`, `.textCase`, `.whiteSpace`, `.overflow`, `.hyphens`, `.overflowWrap` |
| Interaction & events | `.allowsHitTesting`, `.focusable`, `.activatable`, `.editable`, `.focused`, `.keyboardShortcut`, `.onHover`, `.onMouseEnter`, `.onMouseLeave`, `.onMouseDown`, `.onMouseUp`, `.onDoubleClick`, `.onContextMenu`, `.onKeyDown`, `.onKeyUp`, `.onKeyPress`, `.onFocus`, `.onBlur`, `.onContinuousHover`, `.onLongPressGesture`, `.scroll`, `.scrollBehavior`, `.overscrollBehavior`, `.overscrollBehaviorX`, `.overscrollBehaviorY`, `.scrollMargin`, `.scrollPadding`, `.scrollSnap` |
| Utility | `.css`, `.cssProperty`, `.cssVariable`, `.utility`, `.cursor`, `.display`, `.overflowX`, `.overflowY`, `.outline`, `.outlineOffset`, `.transition` |
| Attributes | `.aria`, `.customProperties`, `.customProperty`, `.cssVariables`, `.id`, `.elementId`, `.viewId`, `.data`, `.tabIndex` |
| Elements / decorations | `.before`, `.after`, `.pseudoElements`, `.iconBefore`, `.iconAfter`, `.lineBefore`, `.lineAfter`, `.quotes`, `.underline`, `.badge`, `.tooltip`, `.cornerRibbon`, `.spinner` |
| Effects | `.hover` |

## @tachui/responsive

Responsive helpers live in the dedicated package so they can depend on breakpoint metadata without pulling in the entire modifier registry.

| Category | Modifiers |
| --- | --- |
| Responsive helpers | `.responsive`, `.hidden`, `.visible`, `.breakpoint` |

## @tachui/effects

Visual effects live in their own package so teams can opt in only when needed. These modifiers register through the shared registry just like the core modifiers above.

| Category | Modifiers |
| --- | --- |
| Shadows | `.shadow`, `.shadows`, `.insetShadow`, `.shadowPreset`, `.elevationShadow`, `.glowEffect`, `.neonEffect`, `.neumorphism`, `.neumorphismPressed`, `.layeredShadow`, `.textShadow`, `.textShadowSubtle`, `.textShadowStrong`, `.textOutline`, `.textEmbossed`, `.textEngraved`, `.swiftUIShadow`, `.reactiveShadow`, `.animatedShadow` |
| Filters | `.blur`, `.brightness`, `.contrast`, `.filter`, `.saturate`, `.grayscale`, `.sepia`, `.hueRotate`, `.invert`, `.dropShadow`, `.vintagePhoto`, `.blackAndWhite`, `.vibrant`, `.warmTone`, `.coolTone`, `.faded`, `.highKey`, `.lowKey`, `.softFocus`, `.highContrastMode`, `.subtleBlur`, `.darkModeInvert`, `.colorInvert`, `.saturation`, `.hueRotation` |
| Transforms | `.transform`, `.scale`, `.rotate`, `.translate`, `.skew`, `.rotateX`, `.rotateY`, `.rotateZ`, `.perspective`, `.advancedTransform`, `.matrix`, `.matrix3d`, `.rotate3d`, `.scale3d`, `.translate3d`, `.scaleX`, `.scaleY`, `.scaleZ`, `.translateX`, `.translateY`, `.translateZ`, `.perspectiveOrigin`, `.transformStyle`, `.backfaceVisibility`, `.offset` |
| Interactive effects | `.hover`, `.cursor`, `.hoverEffect`, `.hoverWithTransition`, `.conditionalHover`, `.interactiveCursor`, `.draggableCursor`, `.textCursor`, `.disabledCursor`, `.loadingCursor`, `.helpCursor`, `.zoomCursor`, `.buttonHover`, `.cardHover`, `.linkHover`, `.imageHover` |
| Backdrop / glass | `.backdropFilter`, `.glassmorphism`, `.customGlassmorphism` |

## Linking plan

During Phase 2 each modifier name above will link directly to:

1. The corresponding package README section (`/packages/modifiers`, `/packages/responsive`, etc.).
2. Generated TypeDoc output under `/api/modifiers`.
3. Playground snippets in the Showcase section.

Until then, reference the package READMEs for full signatures and examples. If you notice a missing modifier in this table, update it as part of the same pull request where the code change lands.
