---
title: Modifier Catalog (v0.9)
---

# Modifier Catalog (v0.9)

Every modifier listed below comes directly from `design-docs/modifiers-0.9.md`, grouped by package. Columns follow a consistent order: Modifier, Category, Description, Package / Import.

## @tachui/core · 13 modifiers

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `padding` | Layout | Internal spacing (directional variants) | `@tachui/core/modifiers` |
| `margin` | Layout | External spacing | `@tachui/core/modifiers` |
| `frame` | Layout | Dimensions + alignment | `@tachui/core/modifiers` |
| `alignment` | Layout | Content alignment | `@tachui/core/modifiers` |
| `layoutPriority` | Layout | Priority for flexible layouts | `@tachui/core/modifiers` |
| `foregroundColor` | Styling | Foreground/text color | `@tachui/core/modifiers` |
| `backgroundColor` | Styling | Background color (supports gradients) | `@tachui/core/modifiers` |
| `background` | Styling | Material/background styling | `@tachui/core/modifiers` |
| `fontSize` | Typography | Font size with responsive presets | `@tachui/core/modifiers` |
| `fontWeight` | Typography | Font weight control | `@tachui/core/modifiers` |
| `fontFamily` | Typography | Custom/system font families | `@tachui/core/modifiers` |
| `opacity` | Styling | Transparency control | `@tachui/core/modifiers` |
| `cornerRadius` | Styling | Rounded corners | `@tachui/core/modifiers` |
| `border` | Styling | Border width/style/color | `@tachui/core/modifiers` |

## @tachui/modifiers · 100+ modifiers

### Basic layout

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`, `paddingLeading`, `paddingTrailing`, `paddingHorizontal`, `paddingVertical` | Layout | Internal spacing helpers | `@tachui/modifiers/basic` |
| `margin`, `marginTop`, `marginBottom`, `marginLeft`, `marginRight`, `marginLeading`, `marginTrailing`, `marginHorizontal`, `marginVertical` | Layout | External spacing helpers | `@tachui/modifiers/basic` |
| `size`, `width`, `height`, `maxWidth`, `maxHeight`, `minWidth`, `minHeight` | Layout | Size constraints | `@tachui/modifiers/basic` |

### Advanced layout

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `aspectRatio`, `fixedSize` | Layout | Aspect ratio & fixed sizing | `@tachui/modifiers/layout` |
| `offset`, `overlay`, `position`, `scaleEffect`, `zIndex` | Layout | Positioning / transforms | `@tachui/modifiers/layout` |
| `flexGrow`, `flexShrink`, `alignItems`, `justifyContent`, `flexDirection`, `flexWrap`, `gap` | Layout | Flex/grid helpers | `@tachui/modifiers/layout` |

### Appearance

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `backgroundColor`, `border`, `clipShape`, `clipped`, `foregroundColor`, `gradientText` | Appearance | Visual styling helpers | `@tachui/modifiers/appearance` |

### Typography

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `typography`, `textAlign`, `font`, `lineClamp`, `wordBreak`, `letterSpacing`, `lineHeight`, `textDecoration`, `textOverflow`, `textTransform`, `textCase`, `whiteSpace`, `overflow`, `hyphens`, `overflowWrap` | Typography | Text formatting helpers | `@tachui/modifiers/typography` |

### Interaction & events

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `allowsHitTesting`, `focusable`, `activatable`, `editable`, `focused`, `keyboardShortcut` | Interaction | Interaction state helpers | `@tachui/modifiers/interaction` |
| `onHover`, `onMouseEnter`, `onMouseLeave`, `onMouseDown`, `onMouseUp`, `onDoubleClick`, `onContextMenu`, `onKeyDown`, `onKeyUp`, `onKeyPress`, `onFocus`, `onBlur`, `onContinuousHover`, `onLongPressGesture` | Interaction | Event handlers | `@tachui/modifiers/interaction` |
| `scroll`, `scrollBehavior`, `overscrollBehavior`, `overscrollBehaviorX`, `overscrollBehaviorY`, `scrollMargin`, `scrollPadding`, `scrollSnap` | Interaction | Scroll utilities | `@tachui/modifiers/interaction` |

### Utility & attributes

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `css`, `cssProperty`, `cssVariable`, `utility`, `cursor`, `display`, `overflowX`, `overflowY`, `outline`, `outlineOffset`, `transition` | Utility | Direct CSS hooks | `@tachui/modifiers/utility` |
| `aria`, `customProperties`, `customProperty`, `cssVariables`, `id`, `data`, `tabIndex` | Attributes | ARIA / data attributes | `@tachui/modifiers/attributes` |
| `before`, `after`, `pseudoElements`, `iconBefore`, `iconAfter`, `lineBefore`, `lineAfter`, `quotes`, `underline`, `badge`, `tooltip`, `cornerRibbon`, `spinner` | Elements | Pseudo-element helpers | `@tachui/modifiers/elements` |

## @tachui/effects · 75+ modifiers

### Shadows

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `shadow`, `shadows`, `insetShadow`, `shadowPreset`, `elevationShadow`, `glowEffect`, `neonEffect`, `neumorphism`, `neumorphismPressed`, `layeredShadow`, `textShadow`, `textShadowSubtle`, `textShadowStrong`, `textOutline`, `textEmbossed`, `textEngraved`, `swiftUIShadow`, `reactiveShadow`, `animatedShadow` | Shadow | Elevation/lighting effects | `@tachui/effects/shadows` |

### Filters

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `blur`, `brightness`, `contrast`, `filter`, `saturate`, `grayscale`, `sepia`, `hueRotate`, `invert`, `dropShadow`, `vintagePhoto`, `blackAndWhite`, `vibrant`, `warmTone`, `coolTone`, `faded`, `highKey`, `lowKey`, `softFocus`, `highContrastMode`, `subtleBlur`, `darkModeInvert`, `colorInvert`, `saturation`, `hueRotation` | Filter | CSS filter effects | `@tachui/effects/filters` |

### Transforms

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `transform`, `scale`, `rotate`, `translate`, `skew`, `rotateX`, `rotateY`, `rotateZ`, `scale3d`, `translate3d`, `perspective`, `advancedTransform`, `matrix`, `matrix3d`, `rotate3d`, `scaleX`, `scaleY`, `scaleZ`, `translateX`, `translateY`, `translateZ`, `perspectiveOrigin`, `transformStyle`, `backfaceVisibility`, `offset` | Transform | 2D/3D transforms | `@tachui/effects/transforms` |

### Interactive cursors / hover

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `hover`, `cursor`, `hoverEffect`, `hoverWithTransition`, `conditionalHover`, `interactiveCursor`, `draggableCursor`, `textCursor`, `disabledCursor`, `loadingCursor`, `helpCursor`, `zoomCursor`, `buttonHover`, `cardHover`, `linkHover`, `imageHover` | Interaction | Cursor + hover FX | `@tachui/effects/effects` |

### Backdrop / glass

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `backdropFilter`, `glassmorphism`, `customGlassmorphism` | Backdrop | Frosted glass effects | `@tachui/effects/backdrop` |

## @tachui/grid

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `gridColumnSpan`, `gridRowSpan`, `gridArea`, `gridCellAlignment`, `gridItemConfig` | Grid | Grid item layout helpers | `@tachui/grid` |
| `gridCellColumns`, `gridCellRows`, `gridCellAnchor` | Grid | SwiftUI compatibility shims | `@tachui/grid` |

## @tachui/navigation

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `navigationTitle`, `navigationBarTitleDisplayMode`, `navigationBarHidden`, `navigationBarBackButtonHidden` | Navigation | Navigation bar configuration | `@tachui/navigation` |
| `navigationBarItems`, `toolbarBackground`, `toolbarForegroundColor` | Navigation | Toolbar customization | `@tachui/navigation` |

## @tachui/mobile

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `refreshable` | Mobile | Pull-to-refresh | `@tachui/mobile` |
| `onLongPress`, `onTapGesture` | Mobile | Touch gestures | `@tachui/mobile` |

## @tachui/viewport

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `onAppear`, `onDisappear` | Lifecycle | Window/scene lifecycle callbacks | `@tachui/viewport` |

## @tachui/responsive

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `responsiveWidth`, `responsiveHeight`, `responsivePadding`, `responsiveMargin`, `responsiveFontSize` | Responsive | Breakpoint-aware sizing | `@tachui/responsive` |
| `responsiveVisibility`, `responsiveStack`, `containerQuery`, `adaptiveText`, `touchTarget` | Responsive | Adaptive layouts/accessibility | `@tachui/responsive` |

## @tachui/forms

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `placeholder`, `required`, `validation` | Forms | Input placeholder + validation helpers | `@tachui/forms/modifiers` |

## @tachui/symbols

| Modifier | Category | Description | Package / Import |
| --- | --- | --- | --- |
| `symbolConfiguration`, `symbolRenderingMode`, `symbolScale`, `symbolVariant`, `symbolEffect` | Symbols | SF Symbols configuration + effects | `@tachui/symbols` |

## Notes

- As we migrate the docs, each modifier above will link to its README section, TypeDoc page, and a Showcase snippet.
- When modifiers move between packages or new ones land, update both `design-docs/modifiers-0.9.md` and this catalog so the public stats remain accurate.
