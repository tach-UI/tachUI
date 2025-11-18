---
cssclasses:
  - full-page
---

# tachUI Complete Modifier Reference

## Overview

tachUI provides **200+ individual modifier functions** across 25+ categories, offering one of the most comprehensive modifier systems available in any web framework. This system provides SwiftUI-level declarative styling capabilities with full TypeScript support and reactive properties.

## Core Layout Modifiers

### Frame & Dimensions
- `.foregroundColor(color)` - Set text/foreground color
- `.frame(width?, height?, options?)` - Set frame dimensions with infinity support
- `.alignment(value)` - Set content alignment
- `.layoutPriority(priority)` - Set layout priority for sizing

### Size & Dimension Modifiers (`size.ts`)
- `.size(options)` - Set multiple dimensions (width, height, min/max)
- `.width(value)` - Set width only
- `.height(value)` - Set height only
- `.maxWidth(value)` - Set maximum width
- `.minWidth(value)` - Set minimum width
- `.maxHeight(value)` - Set maximum height
- `.minHeight(value)` - Set minimum height

### Padding Modifiers (`padding.ts`)
- `.padding(value)` - All sides padding
- `.paddingDetailed(options)` - Set padding with detailed control
- `.paddingSymmetric(horizontal?, vertical?)` - Set horizontal/vertical padding
- `.paddingTop(value)` - Top padding
- `.paddingBottom(value)` - Bottom padding
- `.paddingLeft(value)` - Left padding
- `.paddingRight(value)` - Right padding
- `.paddingLeading(value)` - Leading (start) padding
- `.paddingTrailing(value)` - Trailing (end) padding
- `.paddingHorizontal(value)` - Left and right padding
- `.paddingVertical(value)` - Top and bottom padding

### Margin Modifiers (`margin.ts`)
- `.margin(value)` - All sides margin
- `.marginDetailed(options)` - Set margin with detailed control
- `.marginTop(value)` - Top margin
- `.marginBottom(value)` - Bottom margin
- `.marginLeft(value)` - Left margin
- `.marginRight(value)` - Right margin
- `.marginHorizontal(value)` - Left and right margin
- `.marginVertical(value)` - Top and bottom margin

## Typography & Text Modifiers

### Typography (`typography.ts`)
- `.typography(options)` - Complete typography configuration
- `.fontSize(size)` - Set font size
- `.fontWeight(weight)` - Set font weight
- `.fontFamily(family)` - Set font family
- `.lineHeight(height)` - Set line height
- `.letterSpacing(spacing)` - Set letter spacing
- `.textAlign(alignment)` - Set text alignment
- `.textTransform(transform)` - Set text transform (uppercase, etc.)
- `.textCase(caseType)` - Alias for textTransform
- `.textDecoration(decoration)` - underline, overline, line-through, none
- `.textOverflow(overflow)` - clip, ellipsis, fade
- `.whiteSpace(space)` - nowrap, pre-wrap, etc.
- `.overflow(value)` - visible, hidden, scroll, auto

### Font Modifiers (`font.ts`)
- `.font(options)` - Complete font configuration
- `.system(size, weight?, design?)` - System font
- `.custom(name, size, weight?)` - Custom font

### Advanced Text (`text.ts`)
- `.lineClamp(lines)` - Multi-line text truncation
- `.wordBreak(type)` - Word breaking behavior
- `.overflowWrap(type)` - Word wrapping
- `.hyphens(value)` - Hyphenation control
- `.backgroundClip(value)` - Advanced text effects
- `.gradientText(gradient)` - Text with gradient colors
- `.backgroundImage(image)` - Background image for text

### Text Gradient Presets
- `.blueGradientText()` - Blue gradient preset
- `.rainbowGradientText()` - Rainbow gradient preset
- `.sunsetGradientText()` - Sunset gradient preset
- `.oceanGradientText()` - Ocean gradient preset
- `.natureGradientText()` - Nature gradient preset
- `.goldGradientText()` - Gold gradient preset
- `.silverGradientText()` - Silver gradient preset

## Visual Effects Modifiers

### Appearance
- `.backgroundColor(color)` - Set background color
- `.background(value)` - Set background (supports gradients)
- `.opacity(value)` - Set opacity
- `.dropShadow(x?, y?, radius?, color?)` - Add drop shadow

### Filter Effects (`filters.ts`)
- `.filter(config)` - Custom filter configuration
- `.blur(radius)` - Blur filter
- `.brightness(value)` - Brightness filter
- `.contrast(value)` - Contrast filter
- `.saturate(value)` - Saturation filter
- `.saturation(value)` - Alias for saturate
- `.grayscale(value)` - Grayscale filter
- `.sepia(value)` - Sepia filter
- `.hueRotate(degrees)` - Hue rotation filter
- `.hueRotation(degrees)` - Alias for hueRotate
- `.invert(value)` - Invert filter
- `.dropShadow(x, y, blur, color)` - Drop shadow filter

### Filter Presets
- `.colorInvert()` - Color invert preset
- `.darkModeInvert()` - Dark mode invert preset
- `.vintagePhoto()` - Vintage photo preset
- `.blackAndWhite()` - Black and white preset
- `.vibrant()` - Vibrant colors preset
- `.warmTone()` - Warm tone preset
- `.coolTone()` - Cool tone preset
- `.faded()` - Faded effect preset
- `.highKey()` - High key preset
- `.lowKey()` - Low key preset
- `.softFocus()` - Soft focus preset
- `.highContrastMode()` - High contrast preset
- `.subtleBlur()` - Subtle blur preset

### Transform Modifiers (`transformations.ts`)
- `.transform(config)` - General transform configuration
- `.scale(x, y?)` - Scale transformation
- `.scaleX(value)` - Scale X only
- `.scaleY(value)` - Scale Y only
- `.scaleZ(value)` - Scale Z only
- `.scale3d(x, y, z)` - 3D scale
- `.rotate(angle)` - 2D rotation
- `.rotateX(angle)` - Rotate around X axis
- `.rotateY(angle)` - Rotate around Y axis
- `.rotateZ(angle)` - Rotate around Z axis
- `.rotate3d(x, y, z, angle)` - 3D rotation
- `.translate(x, y)` - 2D translation
- `.translateX(value)` - Translate X only
- `.translateY(value)` - Translate Y only
- `.translateZ(value)` - Translate Z only
- `.translate3d(x, y, z)` - 3D translation
- `.skew(x, y?)` - Skew transformation
- `.perspective(value)` - Set perspective
- `.perspectiveOrigin(value)` - Set perspective origin
- `.transformStyle(style)` - Set transform style
- `.backfaceVisibility(visibility)` - Set backface visibility
- `.matrix(values)` - 2D matrix transformation
- `.matrix3d(values)` - 3D matrix transformation
- `.advancedTransform(config)` - Advanced transform configuration
- `.scaleEffect(value)` - SwiftUI-style scale effect
- `.offset(x, y)` - SwiftUI-style offset

### Shadow Modifiers (`shadows.ts`)
- `.shadow(options)` - Custom shadow configuration
- `.shadows(presets)` - Apply shadow presets
- `.textShadow(options)` - Text shadow
- `.shadowPreset(preset)` - Apply named shadow preset
- `.createShadowPreset(name, config)` - Create custom shadow preset
- `.getShadowPresets()` - Get available presets
- `.getShadowPreset(name)` - Get specific preset

### Backdrop Effects (`backdrop.ts`)
- `.backdropFilter(config)` - Custom backdrop filter
- `.glassmorphism(intensity?)` - Glassmorphism effect
- `.customGlassmorphism(config)` - Custom glassmorphism

## Layout Modifiers

### Border Modifiers (`border.ts`)
- `.border(width, color?, style?)` - All sides border
- `.borderTop(width, color?, style?)` - Top border
- `.borderBottom(width, color?, style?)` - Bottom border
- `.borderLeft(width, color?, style?)` - Left border
- `.borderRight(width, color?, style?)` - Right border
- `.borderLeading(width, color?, style?)` - Leading border
- `.borderTrailing(width, color?, style?)` - Trailing border
- `.borderHorizontal(width, color?, style?)` - Left/right borders
- `.borderVertical(width, color?, style?)` - Top/bottom borders
- `.cornerRadius(value)` - Set corner radius

### Flexbox Layout (`flexbox.ts`)
- `.flexbox(options)` - Complete flexbox configuration
- `.alignItems(alignment)` - Set align-items
- `.justifyContent(justification)` - Set justify-content
- `.flexGrow(value)` - Set flex-grow
- `.flexShrink(value)` - Set flex-shrink
- `.gap(value)` - Set gap between items
- `.flexDirection(direction)` - Set flex direction
- `.flexWrap(wrap)` - Set flex wrap

### Grid Layout (`grid.ts`)
- `.gridColumnSpan(span)` - Grid column span
- `.gridRowSpan(span)` - Grid row span
- `.gridArea(area)` - Grid area assignment
- `.gridCellAlignment(alignment)` - Cell alignment
- `.gridItemConfig(config)` - Complete grid item config
- `.gridCellColumns(columns)` - SwiftUI compatibility alias
- `.gridCellRows(rows)` - SwiftUI compatibility alias
- `.gridCellAnchor(anchor)` - SwiftUI compatibility alias

## Transition & Animation Modifiers

### Transitions (`transitions.ts`)
- `.transition(property?, duration?, easing?, delay?)` - Basic transition
- `.transitions(config)` - Multiple transition configuration

### Transition Presets
- `.fadeTransition(duration?)` - Fade transition preset
- `.transformTransition(duration?)` - Transform transition preset
- `.colorTransition(duration?)` - Color transition preset
- `.layoutTransition(duration?)` - Layout transition preset
- `.buttonTransition()` - Button transition preset
- `.cardTransition()` - Card transition preset
- `.modalTransition()` - Modal transition preset
- `.smoothTransition()` - Smooth transition preset
- `.quickTransition()` - Quick transition preset
- `.slowTransition()` - Slow transition preset

## Interaction Modifiers

### Cursor & Hover (`effects.ts`)
- `.cursor(type)` - Set cursor type
- `.hover(styles)` - Hover styles
- `.hoverEffect(effect)` - SwiftUI-style hover effects
- `.hoverWithTransition(styles, duration?)` - Hover with transition
- `.conditionalHover(condition, styles)` - Conditional hover

### Cursor Presets
- `.interactiveCursor()` - Interactive cursor preset
- `.draggableCursor()` - Draggable cursor preset
- `.textCursor()` - Text cursor preset
- `.disabledCursor()` - Disabled cursor preset
- `.loadingCursor()` - Loading cursor preset
- `.helpCursor()` - Help cursor preset
- `.zoomCursor()` - Zoom cursor preset

### Hover Presets
- `.buttonHover()` - Button hover preset
- `.cardHover()` - Card hover preset
- `.linkHover()` - Link hover preset
- `.imageHover()` - Image hover preset

### Pseudo-elements (`elements.ts`)
- `.before(styles)` - ::before pseudo-element
- `.after(styles)` - ::after pseudo-element
- `.pseudoElements(config)` - Multiple pseudo-elements
- `.iconBefore(icon)` - Icon before content
- `.iconAfter(icon)` - Icon after content
- `.lineBefore(config)` - Line before content
- `.lineAfter(config)` - Line after content
- `.quotes(open, close)` - Add quotation marks
- `.underline(config)` - Custom underline
- `.badge(text, config?)` - Add badge
- `.tooltip(text, config?)` - Add tooltip
- `.cornerRibbon(text, config?)` - Corner ribbon
- `.spinner(config?)` - Loading spinner

### Scroll Behavior (`scroll.ts`)
- `.scroll(options)` - Scroll behavior configuration
- `.scrollBehavior(behavior)` - Set scroll behavior
- `.overscrollBehavior(behavior)` - Set overscroll behavior
- `.overscrollBehaviorX(behavior)` - Set horizontal overscroll
- `.overscrollBehaviorY(behavior)` - Set vertical overscroll
- `.scrollMargin(value)` - Set scroll margin
- `.scrollPadding(value)` - Set scroll padding
- `.scrollSnap(type)` - Set scroll snap behavior

## CSS & Styling Modifiers

### Direct CSS (`css.ts`)
- `.css(styles)` - Apply raw CSS styles
- `.cssProperty(property, value)` - Set single CSS property
- `.cssVariable(name, value)` - Set CSS custom property
- `.cssVendor(property, value)` - Apply vendor-prefixed CSS
- `.cssVariables(variables)` - Set multiple CSS variables

### HTML Attributes (`attributes.ts`)
- `.id(value)` - Set element ID
- `.data(attributes)` - Set data attributes
- `.aria(attributes)` - Set ARIA attributes
- `.tabIndex(value)` - Set tab index
- `.customProperties(properties)` - Set CSS custom properties
- `.customProperty(name, value)` - Set single custom property
- `.themeColors(colors)` - Set theme color variables
- `.designTokens(tokens)` - Set design system tokens

### Utility Modifiers (`utility.ts`)
- `.utility(options)` - General utility configuration
- `.display(value)` - Set display property
- `.position(value)` - Set position property
- `.zIndex(value)` - Set z-index
- `.overflowX(value)` - Set horizontal overflow
- `.overflowY(value)` - Set vertical overflow

### HTML Rendering (`as-html.ts`)
- `.asHTML(options)` - Render as HTML with security

## Responsive System

### Core Responsive Functions
- `.responsive(values)` - Apply responsive values
- `useBreakpoint()` - Hook for current breakpoint
- `useMediaQuery(query)` - Hook for media queries
- `useResponsiveValue(values)` - Hook for responsive values
- `createResponsiveModifier(config)` - Create responsive modifier
- `createMediaQueryModifier(query, styles)` - Create media query modifier
- `createResponsivePropertyModifier(property, values)` - Create responsive property modifier
- `createResponsiveLayoutModifier(config)` - Create responsive layout modifier

### Responsive Patterns
- `ResponsiveGrid.*` - Responsive grid patterns
- `Flex.*` - Responsive flex patterns
- `Container.*` - Responsive container patterns
- `Visibility.*` - Responsive visibility patterns
- `Spacing.*` - Responsive spacing patterns
- `ResponsiveTypography.*` - Responsive typography patterns

## Navigation Modifiers

### Navigation Bar (`navigation/navigation-modifiers.ts`)
- `.navigationTitle(title)` - Set navigation title
- `.navigationBarHidden(hidden?)` - Hide/show navigation bar
- `.navigationBarTitleDisplayMode(mode)` - Set title display mode
- `.navigationBarBackButtonHidden(hidden?)` - Hide back button
- `.navigationBarBackButtonTitle(title)` - Set back button title
- `.navigationBarItems(leading?, trailing?)` - Set navigation items
- `.toolbarBackground(color)` - Set toolbar background
- `.toolbarForegroundColor(color)` - Set toolbar text color

## Symbol Modifiers

### Symbol Variants (`symbols/`)
- `.variant(variant)` - Symbol variant
- `.filled()` - Filled variant
- `.slash()` - Slash variant
- `.circle()` - Circle variant
- `.square()` - Square variant

### Symbol Scaling
- `.symbolScale(scale)` - Symbol scale
- `.scaleSmall()` - Small scale
- `.scaleMedium()` - Medium scale
- `.scaleLarge()` - Large scale

### Symbol Weight
- `.weight(weight)` - Symbol weight
- `.weightThin()` - Thin weight
- `.weightRegular()` - Regular weight
- `.weightBold()` - Bold weight

### Symbol Rendering
- `.renderingMode(mode)` - Rendering mode
- `.monochrome()` - Monochrome rendering
- `.hierarchical()` - Hierarchical rendering
- `.palette(primary, secondary?, tertiary?)` - Palette colors
- `.multicolor()` - Multicolor rendering

### Symbol Effects
- `.symbolEffect(effect, value?)` - Symbol animation effects
- `.bounce()` - Bounce effect
- `.pulse()` - Pulse effect
- `.wiggle()` - Wiggle effect
- `.rotate()` - Rotate effect
- `.breathe()` - Breathe effect

## Utility & System Modifiers

### Component Utilities (`utils.ts`)
- `.classModifier(className)` - Add CSS class
- `.styleModifier(styles)` - Apply inline styles
- `.conditionalModifier(condition, modifier)` - Conditional modifier
- `.stateModifier(state, modifiers)` - State-based modifier
- `.eventModifier(event, handler)` - Event handler modifier
- `.responsiveModifier(values)` - Responsive value modifier
- `.combineModifiers(modifiers)` - Combine multiple modifiers
- `.createCustomModifier(config)` - Create custom modifier

### Registry & System Functions (`registry.ts`)
- `applyModifiers(component, modifiers)` - Apply modifiers to component
- `applyModifiersToNode(node, modifiers, context)` - Apply to DOM node
- `createModifiableComponent(component)` - Make component modifiable
- `createModifierRegistry()` - Create modifier registry
- `updateComponentModifiers(component, modifiers)` - Update component modifiers

## Summary Statistics

- **Total Modifier Functions**: 200+ individual modifier functions
- **Categories**: 25+ major categories of modifiers
- **Core Package**: 180+ modifiers in `@tachui/core`
- **Navigation Package**: 10+ navigation-specific modifiers
- **Symbols Package**: 25+ symbol-specific modifiers
- **Responsive System**: 50+ responsive utilities and patterns

## Usage Examples

### Basic Styling
```typescript
Text("Hello World")
  .fontSize(18)
  .fontWeight('bold')
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('#F0F0F0')
  .cornerRadius(8)
```

### Advanced Effects
```typescript
Button("Click Me")
  .glassmorphism()
  .scaleEffect(1.05)
  .buttonHover()
  .dropShadow(0, 4, 12, 'rgba(0,0,0,0.15)')
  .fadeTransition()
```

### Responsive Design
```typescript
VStack()
  .responsive({
    padding: { mobile: 16, tablet: 24, desktop: 32 },
    gap: { mobile: 8, tablet: 12, desktop: 16 }
  })
  .maxWidth({ mobile: '100%', desktop: 1200 })
```

This comprehensive modifier system provides SwiftUI-level declarative styling capabilities with full TypeScript support, making tachUI one of the most powerful frameworks for modern web development.

## Aliases

True Aliases (Direct Function Calls)

Typography

- .textCase() → .textTransform() ✓ (confirmed)

Filter Effects (SwiftUI Compatibility)

- .colorInvert() → .invert(1)
- .saturation() → .saturate()
- .hueRotation() → .hueRotate()

Grid Layout (SwiftUI Compatibility)

- .gridCellColumns() → .gridColumnSpan()
- .gridCellRows() → .gridRowSpan()
- .gridCellAnchor() → .gridCellAlignment()

CSS Variables

- .cssVariables() → .customProperties()

Preset Aliases (Call with Parameters)

Cursor Presets

- .interactiveCursor() → .cursor('pointer')
- .draggableCursor() → .cursor('grab')
- .textCursor() → .cursor('text')
- .disabledCursor() → .cursor('not-allowed')
- .loadingCursor() → .cursor('wait')
- .helpCursor() → .cursor('help')

Hover Presets

- .buttonHover() → .hoverEffect('lift')
- .cardHover() → .hoverEffect('automatic')
- .linkHover() → .hoverEffect('highlight')
- .imageHover() → .hoverEffect('scale')

Symbol Modifiers (15 aliases)

All symbol convenience methods like .filled() → .variant('filled'), .bounce() → .symbolEffect('bounce'), etc.

Most aliases provide either SwiftUI compatibility or convenience presets with common parameter values.
