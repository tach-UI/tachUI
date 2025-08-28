# TachUI Symbols API Reference

Complete API documentation for the TachUI Symbols package.

## Symbol Function

The main function for creating symbol components.

```typescript
function Symbol(
  name: string | Signal<string>,
  props?: Partial<SymbolProps>
): ModifiableComponent<SymbolProps> & { modifier: ModifierBuilder<ModifiableComponent<SymbolProps>> }
```

### Parameters

- **name**: The icon name (string) or reactive icon name (Signal). Must match an icon in the active icon set.
- **props**: Optional configuration object for the symbol.

### Returns

A modifiable component that can be used with TachUI's modifier system.

## SymbolProps Interface

Configuration options for Symbol components.

```typescript
interface SymbolProps extends ComponentProps {
  // Core properties
  name: string | Signal<string>
  iconSet?: string
  
  // Appearance
  variant?: SymbolVariant | Signal<SymbolVariant>
  scale?: SymbolScale | Signal<SymbolScale>
  weight?: SymbolWeight | Signal<SymbolWeight>
  renderingMode?: SymbolRenderingMode | Signal<SymbolRenderingMode>
  
  // Colors (for palette/multicolor modes)
  primaryColor?: string | Signal<string>
  secondaryColor?: string | Signal<string>
  tertiaryColor?: string | Signal<string>
  
  // Animation
  effect?: SymbolEffect | Signal<SymbolEffect>
  effectValue?: number | Signal<number>
  effectSpeed?: number
  effectRepeat?: number | 'infinite'
  
  // Accessibility
  accessibilityLabel?: string
  accessibilityDescription?: string
  isDecorative?: boolean
  
  // Performance
  eager?: boolean
  fallback?: string
}
```

### Core Properties

#### `name`
- **Type**: `string | Signal<string>`
- **Required**: Yes
- **Description**: Icon name from the active icon set
- **Example**: `'heart'`, `'star'`, `() => dynamicIconName()`

#### `iconSet`
- **Type**: `string`
- **Default**: `'lucide'`
- **Description**: Icon set to use for loading the icon
- **Example**: `'lucide'`, `'custom'`

### Appearance Properties

#### `variant`
- **Type**: `SymbolVariant | Signal<SymbolVariant>`
- **Default**: `'none'`
- **Values**: `'none' | 'filled' | 'slash' | 'circle' | 'square'`
- **Description**: Visual variant of the icon
- **Example**: `'filled'`, `() => isActive() ? 'filled' : 'none'`

#### `scale`
- **Type**: `SymbolScale | Signal<SymbolScale>`
- **Default**: `'medium'`
- **Values**: `'small' | 'medium' | 'large'`
- **Description**: Size scale of the icon
- **Sizes**: small (16px), medium (24px), large (32px)
- **Example**: `'large'`, `() => isImportant() ? 'large' : 'medium'`

#### `weight`
- **Type**: `SymbolWeight | Signal<SymbolWeight>`
- **Default**: `'regular'`
- **Values**: `'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'`
- **Description**: Visual weight/thickness of the icon
- **Note**: Lucide icons support limited weights
- **Example**: `'bold'`, `() => isActive() ? 'bold' : 'regular'`

#### `renderingMode`
- **Type**: `SymbolRenderingMode | Signal<SymbolRenderingMode>`
- **Default**: `'monochrome'`
- **Values**: `'monochrome' | 'hierarchical' | 'palette' | 'multicolor'`
- **Description**: How colors are applied to the icon
- **Example**: `'palette'`

### Color Properties

#### `primaryColor`
- **Type**: `string | Signal<string>`
- **Default**: `'currentColor'`
- **Description**: Primary color for the icon
- **Example**: `'#ff0000'`, `() => theme.primaryColor()`

#### `secondaryColor`
- **Type**: `string | Signal<string>`
- **Description**: Secondary color (palette mode only)
- **Example**: `'#00ff00'`

#### `tertiaryColor`
- **Type**: `string | Signal<string>`
- **Description**: Tertiary color (palette mode only)
- **Example**: `'#0000ff'`

### Animation Properties

#### `effect`
- **Type**: `SymbolEffect | Signal<SymbolEffect>`
- **Default**: `'none'`
- **Values**: `'none' | 'bounce' | 'pulse' | 'wiggle' | 'rotate' | 'breathe' | 'shake' | 'heartbeat' | 'glow'`
- **Description**: Animation effect to apply
- **Example**: `'bounce'`, `() => isLoading() ? 'rotate' : 'none'`

#### `effectValue`
- **Type**: `number | Signal<number>`
- **Range**: 0.0 - 1.0
- **Description**: Variable value for animations (future use)
- **Example**: `0.5`, `() => progress()`

#### `effectSpeed`
- **Type**: `number`
- **Default**: `1`
- **Description**: Speed multiplier for animations
- **Example**: `2` (2x speed), `0.5` (half speed)

#### `effectRepeat`
- **Type**: `number | 'infinite'`
- **Default**: `'infinite'`
- **Description**: Number of times the animation should repeat
- **Example**: `3` (repeat 3 times), `'infinite'` (continuous)

### Accessibility Properties

#### `accessibilityLabel`
- **Type**: `string`
- **Description**: Label for screen readers
- **Example**: `'Add to favorites'`

#### `accessibilityDescription`
- **Type**: `string`
- **Description**: Detailed description for screen readers
- **Example**: `'Click to add this item to your favorites list'`

#### `isDecorative`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether the icon is purely decorative (hidden from screen readers)
- **Example**: `true`

### Performance Properties

#### `eager`
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Whether to load the icon immediately (disable lazy loading)
- **Example**: `true`

#### `fallback`
- **Type**: `string`
- **Description**: Fallback icon name if primary icon fails to load
- **Example**: `'heart'`

## Modifier Extensions

TachUI Symbols extends the modifier system with symbol-specific modifiers.

```typescript
interface SymbolModifierBuilder<T> extends ModifierBuilder<T> {
  // Variant shortcuts
  filled(): SymbolModifierBuilder<T>
  slash(): SymbolModifierBuilder<T>
  circle(): SymbolModifierBuilder<T>
  square(): SymbolModifierBuilder<T>
  
  // Scale shortcuts
  scaleSmall(): SymbolModifierBuilder<T>
  scaleMedium(): SymbolModifierBuilder<T>
  scaleLarge(): SymbolModifierBuilder<T>
  
  // Weight shortcuts
  weightThin(): SymbolModifierBuilder<T>
  weightRegular(): SymbolModifierBuilder<T>
  weightBold(): SymbolModifierBuilder<T>
  
  // Rendering mode shortcuts
  monochrome(): SymbolModifierBuilder<T>
  hierarchical(): SymbolModifierBuilder<T>
  palette(primary: string, secondary?: string, tertiary?: string): SymbolModifierBuilder<T>
  multicolor(): SymbolModifierBuilder<T>
  
  // Effect shortcuts
  bounce(): SymbolModifierBuilder<T>
  pulse(): SymbolModifierBuilder<T>
  wiggle(): SymbolModifierBuilder<T>
  rotate(): SymbolModifierBuilder<T>
  breathe(): SymbolModifierBuilder<T>
  shake(): SymbolModifierBuilder<T>
  heartbeat(): SymbolModifierBuilder<T>
  glow(): SymbolModifierBuilder<T>
}
```

### Usage Examples

```typescript
// Using modifier shortcuts
Symbol('heart')
  .modifier
  .filled()
  .scaleLarge()
  .weightBold()
  .palette('#ff0000', '#ff6666')
  .bounce()
  .build()

// Equivalent to:
Symbol('heart', {
  variant: 'filled',
  scale: 'large',
  weight: 'bold',
  renderingMode: 'palette',
  primaryColor: '#ff0000',
  secondaryColor: '#ff6666',
  effect: 'bounce'
})
```

## Utility Classes

### IconLoader

Utilities for loading and caching icons.

```typescript
class IconLoader {
  static async loadIcon(
    name: string, 
    variant?: SymbolVariant,
    iconSetName?: string
  ): Promise<IconDefinition | undefined>
  
  static async preloadIcons(
    names: string[], 
    variant?: SymbolVariant,
    iconSetName?: string
  ): Promise<(IconDefinition | undefined)[]>
  
  static async preloadCriticalIcons(iconSetName?: string): Promise<void>
  
  static async loadIconWithFallback(
    name: string,
    fallbackName: string,
    variant?: SymbolVariant,
    iconSetName?: string
  ): Promise<IconDefinition | undefined>
  
  static isIconCached(name: string, variant?: SymbolVariant, iconSetName?: string): boolean
  static getCachedIcon(name: string, variant?: SymbolVariant, iconSetName?: string): IconDefinition | undefined
  static clearCache(): void
  static getCacheStats(): { cached: number; loading: number; totalSize: number }
}
```

### IconSetRegistry

Global registry for managing icon sets.

```typescript
class IconSetRegistry {
  static register(iconSet: IconSet): void
  static get(name?: string): IconSet
  static setDefault(name: string): void
  static has(name: string): boolean
  static list(): string[]
  static clear(): void
}
```

### SymbolAccessibility

Accessibility utilities for symbols.

```typescript
class SymbolAccessibility {
  static generateAccessibilityProps(props: SymbolProps): Record<string, string>
  static generateDescription(props: SymbolProps): string | undefined
  static createDescriptionElement(props: SymbolProps): HTMLElement | null
}
```

### WCAGCompliance

WCAG compliance checking utilities.

```typescript
class WCAGCompliance {
  static checkColorContrast(
    foreground: string, 
    background: string,
    level?: 'AA' | 'AAA'
  ): { passes: boolean; ratio: number }
  
  static ensureMinimumSize(size: number): boolean
  static validateAccessibilityLabel(label?: string): string[]
}
```

### OptimizedSVGRenderer

Performance-optimized SVG rendering.

```typescript
class OptimizedSVGRenderer {
  static render(
    definition: IconDefinition, 
    strategy?: IconRenderingStrategy,
    props?: { size?: number; color?: string }
  ): string
  
  static clearCache(): void
  static getCacheSize(): number
  static preloadIcon(definition: IconDefinition): void
}
```

## Type Definitions

### Core Types

```typescript
type SymbolVariant = 'none' | 'filled' | 'slash' | 'circle' | 'square'
type SymbolScale = 'small' | 'medium' | 'large'
type SymbolWeight = 'ultraLight' | 'thin' | 'light' | 'regular' | 'medium' | 'semibold' | 'bold' | 'heavy' | 'black'
type SymbolRenderingMode = 'monochrome' | 'hierarchical' | 'palette' | 'multicolor'
type SymbolEffect = 'none' | 'bounce' | 'pulse' | 'wiggle' | 'rotate' | 'breathe' | 'shake' | 'heartbeat' | 'glow'

enum IconRenderingStrategy {
  INLINE_SVG = 'inline',
  SVG_USE = 'use',
  SPRITE_SHEET = 'sprite'
}
```

### Interfaces

```typescript
interface IconDefinition {
  name: string
  variant: SymbolVariant
  weight: SymbolWeight
  svg: string
  viewBox: string
  metadata?: IconMetadata
}

interface IconMetadata {
  category?: string
  tags?: string[]
  unicodePoint?: string
  alternativeNames?: string[]
  deprecated?: boolean
  availableVariants?: SymbolVariant[]
  availableWeights?: SymbolWeight[]
}

interface IconSet {
  name: string
  version: string
  icons: Record<string, IconDefinition>
  
  getIcon(name: string, variant?: SymbolVariant): Promise<IconDefinition | undefined>
  hasIcon(name: string, variant?: SymbolVariant): boolean
  listIcons(): string[]
  getIconMetadata(name: string): IconMetadata | undefined
  supportsVariant(name: string, variant: SymbolVariant): boolean
  supportsWeight(name: string, weight: SymbolWeight): boolean
}
```

## Error Handling

### Common Errors

#### Icon Not Found
```typescript
// Returns undefined if icon doesn't exist
const icon = await IconLoader.loadIcon('non-existent-icon')
if (!icon) {
  console.warn('Icon not found')
}

// Use fallback for reliability
const iconWithFallback = Symbol('custom-icon', { fallback: 'heart' })
```

#### Icon Set Not Registered
```typescript
try {
  const iconSet = IconSetRegistry.get('non-existent-set')
} catch (error) {
  console.error('Icon set not found:', error.message)
}
```

#### Loading Errors
```typescript
// Symbol component handles loading errors gracefully
const symbol = Symbol('error-icon') // Shows error state if icon fails to load
```

## Best Practices

### Performance
- Use tree-shaking by importing only needed icons
- Preload critical icons with `IconLoader.preloadCriticalIcons()`
- Cache frequently used icons
- Use `eager: true` for above-the-fold icons

### Accessibility
- Always provide meaningful `accessibilityLabel`
- Use `isDecorative: true` for purely decorative icons
- Ensure 4.5:1 color contrast minimum
- Test with screen readers

### Reactivity
- Use signals for dynamic properties
- Batch reactive updates when possible
- Clean up signal subscriptions properly

### Bundle Size
- Only import symbols you need
- Use fallbacks for reliability
- Monitor bundle size with build tools