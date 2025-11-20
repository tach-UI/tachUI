---
cssclasses:
  - full-page
---

# Epic: Jiminy - SwiftUI Background Gradients

**Status:** Design Phase  
**Priority:** Medium-High  
**Estimated Duration:** 6-8 weeks  
**Target Release:** 1.4  

---

## Overview

Implement comprehensive SwiftUI-compatible gradient support for tachUI, providing developers with familiar gradient APIs that leverage tachUI's Asset system for theme reactivity. This epic will introduce `.background()` modifiers with full gradient support, hover states, and smooth transitions.

### Goals

- **SwiftUI Compatibility**: Mirror SwiftUI's gradient API while optimizing for web performance
- **Asset Integration**: Full theme reactivity through tachUI's existing Asset system
- **Interaction Support**: Hover states and smooth gradient transitions
- **Performance**: CSS-based implementation with hardware acceleration
- **Developer Experience**: TypeScript support, reactive signals, and intuitive APIs

### Success Metrics

- All SwiftUI gradient types supported with CSS equivalents
- Asset-based gradients that respond to theme changes
- Smooth hover transitions with configurable duration
- Zero performance regression on component rendering
- 100% TypeScript coverage for gradient APIs

---

## Technical Requirements

### Gradient Types to Support

#### SwiftUI-Compatible Gradients
- **LinearGradient**: CSS `linear-gradient()`
- **RadialGradient**: CSS `radial-gradient()` 
- **AngularGradient**: CSS `conic-gradient()`

#### CSS-Specific Extensions
- **EllipticalGradient**: CSS `radial-gradient()` with custom ellipse
- **RepeatingLinearGradient**: CSS `repeating-linear-gradient()`
- **RepeatingRadialGradient**: CSS `repeating-radial-gradient()`
- **ConicGradient**: Enhanced `conic-gradient()` with more controls

### Asset System Integration

- Gradient colors as Assets with light/dark theme support
- Asset-based gradient definitions that switch themes automatically
- Reactive gradient updates when theme changes
- Support for mixed Asset and static colors in same gradient

### State & Interaction Support

- **Hover States**: `.hover()` modifier with gradient transitions
- **Active States**: `.pressed()` modifier support
- **Focus States**: `.focused()` modifier for accessibility
- **Disabled States**: `.disabled()` modifier with visual feedback

---

## API Design

### Core Gradient API

```typescript
// SwiftUI-Compatible Linear Gradient
Button("Gradient Button", action)
  .modifier
  .background(
    LinearGradient({
      colors: [Assets.primaryColor, Assets.secondaryColor, '#FF6B6B'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  )
  .build()

// Radial Gradient with Asset Integration
VStack({ children: [...] })
  .modifier
  .background(
    RadialGradient({
      colors: [Assets.backgroundPrimary, Assets.backgroundSecondary],
      center: 'center',
      startRadius: 10,
      endRadius: 100
    })
  )
  .build()

// Angular/Conic Gradient
Button("Angular", action)
  .modifier
  .background(
    AngularGradient({
      colors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
      center: 'center',
      startAngle: 0,
      endAngle: 360
    })
  )
  .build()
```

### Advanced Gradient Features

```typescript
// CSS-Specific Extensions
Button("Advanced", action)
  .modifier
  .background(
    RepeatingLinearGradient({
      colors: [Assets.accentColor, 'transparent'],
      direction: '45deg',
      colorStops: ['0px', '10px'] // Repeat every 10px
    })
  )
  .build()

// Asset-Based Gradient Definition
const heroGradient = createGradientAsset({
  light: LinearGradient({
    colors: ['#667eea', '#764ba2'],
    startPoint: 'topLeading',
    endPoint: 'bottomTrailing'
  }),
  dark: LinearGradient({
    colors: ['#2c3e50', '#34495e'],
    startPoint: 'topLeading', 
    endPoint: 'bottomTrailing'
  })
})

// Usage with hover states
Button("Hero Button", action)
  .modifier
  .background(heroGradient)
  .hover(
    background: LinearGradient({
      colors: ['#764ba2', '#667eea'], // Reversed gradient
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  )
  .build()
```

### Transition and Animation Support

```typescript
Button("Animated Gradient", action)
  .modifier
  .background(primaryGradient)
  .hover(
    background: secondaryGradient,
    transition: { duration: 300, easing: 'ease-in-out' }
  )
  .pressed(
    background: pressedGradient,
    transition: { duration: 150, easing: 'ease-out' }
  )
  .build()
```

---

## Implementation Architecture

### New Components and Modifiers

#### 1. Gradient Core Types
```typescript
// packages/core/src/gradients/types.ts
export interface GradientColors {
  colors: (string | Asset)[]
  stops?: number[] // Optional color stop positions
}

export interface LinearGradientOptions extends GradientColors {
  startPoint: 'top' | 'topLeading' | 'leading' | 'bottomLeading' | 
             'bottom' | 'bottomTrailing' | 'trailing' | 'topTrailing' | 'center'
  endPoint: string // Same options as startPoint
  angle?: number // Alternative to start/end points
}

export interface RadialGradientOptions extends GradientColors {
  center: 'center' | 'top' | 'bottom' | 'leading' | 'trailing' | [number, number]
  startRadius: number
  endRadius: number
  shape?: 'circle' | 'ellipse'
}

export interface AngularGradientOptions extends GradientColors {
  center: 'center' | 'top' | 'bottom' | 'leading' | 'trailing' | [number, number]
  startAngle: number
  endAngle: number
}
```

#### 2. Gradient Factory Functions
```typescript
// packages/core/src/gradients/index.ts
export function LinearGradient(options: LinearGradientOptions): GradientDefinition
export function RadialGradient(options: RadialGradientOptions): GradientDefinition  
export function AngularGradient(options: AngularGradientOptions): GradientDefinition
export function RepeatingLinearGradient(options: RepeatingLinearGradientOptions): GradientDefinition

// Asset-based gradient creation
export function createGradientAsset(definitions: {
  light: GradientDefinition
  dark: GradientDefinition
  [key: string]: GradientDefinition // Support for custom themes
}): GradientAsset
```

#### 3. Background Modifier
```typescript
// packages/core/src/modifiers/background.ts
export class BackgroundModifier extends BaseModifier<BackgroundOptions> {
  readonly type = 'background'
  readonly priority = 95 // Higher than backgroundColor (90)
  
  apply(node: DOMNode, context: ModifierContext): DOMNode | undefined {
    if (!context.element) return
    
    const styles = this.computeBackgroundStyles(this.properties, context)
    this.applyStyles(context.element, styles)
    
    return undefined
  }
  
  private computeBackgroundStyles(props: BackgroundOptions, context: ModifierContext) {
    // Handle gradients, theme reactivity, and fallbacks
  }
}
```

#### 4. State Modifiers Enhancement
```typescript
// packages/core/src/modifiers/interaction.ts
export class HoverModifier extends BaseModifier<InteractionOptions> {
  // Extended to support gradient transitions
  private handleGradientTransition(
    fromGradient: GradientDefinition,
    toGradient: GradientDefinition, 
    transition: TransitionOptions
  ): void
}
```

### Asset System Extensions

#### Gradient Assets
```typescript
// packages/core/src/assets/gradient.ts
export class GradientAsset extends AssetBase<GradientDefinition> {
  resolve(): string {
    const currentTheme = getCurrentTheme()
    const gradientDef = this.definitions[currentTheme] || this.definitions.light
    return this.gradientToCSS(gradientDef)
  }
  
  private gradientToCSS(gradient: GradientDefinition): string {
    // Convert gradient definition to CSS string
    // Handle Asset color resolution within gradient
  }
}
```

---

## Development Phases

### Phase 1: Foundation (2 weeks)
**Deliverables:**
- Gradient type definitions and core interfaces
- LinearGradient implementation with basic Asset support
- Background modifier with gradient support
- Basic CSS generation and theme reactivity

**Acceptance Criteria:**
- LinearGradient works with static colors and Assets
- Theme switching updates gradient colors automatically
- Background modifier has higher priority than backgroundColor

### Phase 2: Complete Gradient Support (2 weeks)  
**Deliverables:**
- RadialGradient and AngularGradient implementations
- CSS-specific gradient types (repeating, etc.)
- Enhanced color stop support
- Comprehensive Asset integration

**Acceptance Criteria:**
- All gradient types generate correct CSS
- Mixed Asset and static colors work in single gradient
- Color stops and advanced positioning work correctly

### Phase 3: Interaction and State Support (2 weeks)
**Deliverables:**
- Enhanced hover/pressed/focus state modifiers
- Gradient transition animations
- State-specific gradient definitions
- Performance optimizations

**Acceptance Criteria:**
- Smooth gradient transitions on hover/press
- Configurable transition duration and easing
- No performance regression on state changes

### Phase 4: Developer Experience (1-2 weeks)
**Deliverables:**
- Gradient preset utilities and examples
- Enhanced TypeScript support and validation
- Reactive signal integration
- Documentation and examples

**Acceptance Criteria:**
- Comprehensive TypeScript coverage
- Gradient presets for common use cases
- Reactive gradients update with signal changes
- Complete API documentation

---

## Examples and Use Cases

### Calculator Button with Gradient
```typescript
// Enhanced Tape button with gradient
const createTapeButton = () => {
  const tapeGradient = createGradientAsset({
    light: LinearGradient({
      colors: ['#4facfe', '#00f2fe'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    }),
    dark: LinearGradient({
      colors: ['#2c5aa0', '#1e3c72'],
      startPoint: 'topLeading',
      endPoint: 'bottomTrailing'
    })
  })
  
  return Button('Tape', handleTapePress)
    .modifier
    .background(tapeGradient)
    .foregroundColor(Assets.white)
    .hover(
      background: LinearGradient({
        colors: ['#00f2fe', '#4facfe'], // Reversed
        startPoint: 'topLeading',
        endPoint: 'bottomTrailing'
      }),
      transition: { duration: 200 }
    )
    .pressed(
      background: RadialGradient({
        colors: ['#1e3c72', '#2c5aa0'],
        center: 'center',
        startRadius: 0,
        endRadius: 50
      })
    )
    .build()
}
```

### Card Component with Complex Background
```typescript
const HeroCard = ({ children }: { children: ComponentInstance[] }) => {
  const cardGradient = LinearGradient({
    colors: [
      Assets.cardBackgroundPrimary,
      Assets.cardBackgroundSecondary,
      'rgba(255, 255, 255, 0.1)'
    ],
    startPoint: 'top',
    endPoint: 'bottom'
  })
  
  return VStack({ children })
    .modifier
    .background(cardGradient)
    .cornerRadius(16)
    .padding(20)
    .shadow({ x: 0, y: 10, radius: 30, color: 'rgba(0,0,0,0.1)' })
    .hover(
      background: LinearGradient({
        colors: [
          Assets.cardBackgroundSecondary,
          Assets.cardBackgroundPrimary,
          'rgba(255, 255, 255, 0.2)'
        ],
        startPoint: 'top',
        endPoint: 'bottom'
      }),
      transform: { scale: 1.02 },
      transition: { duration: 300 }
    )
    .build()
}
```

---

## Performance Considerations

### Optimization Strategies
- **CSS Custom Properties**: Pre-generate theme-specific gradients as CSS variables
- **Caching**: Cache computed CSS strings for repeated gradient definitions
- **Hardware Acceleration**: Ensure gradients trigger GPU acceleration where beneficial
- **Lazy Evaluation**: Only compute gradient CSS when actually needed

### Performance Benchmarks
- Gradient rendering should add <5ms to component creation time
- Theme switching with gradients should complete within 16ms (60fps)
- Memory usage should not increase significantly with gradient usage

---

## Future Considerations

### Potential Extensions (Post-1.4)
- **Mesh Gradients**: CSS future specification support
- **Gradient Masks**: Integration with CSS mask properties
- **Pattern Backgrounds**: SVG pattern integration
- **Animation Presets**: Pre-built gradient animation effects
- **Custom Easing**: Advanced transition timing functions

### Integration Points
- **Charts**: Gradient support for data visualization
- **Icons**: Gradient fill support for SVG icons
- **Borders**: Gradient border support
- **Text**: Gradient text effects via CSS background-clip

---

## Dependencies and Risks

### Dependencies
- tachUI Asset system (existing)
- CSS custom properties support (universal)
- Hardware acceleration availability (progressive enhancement)

### Risks and Mitigations
- **Performance Impact**: Mitigate with lazy evaluation and caching
- **Cross-browser Compatibility**: Focus on modern browsers, graceful degradation
- **API Complexity**: Start with core features, extend iteratively
- **Asset System Changes**: Design for backward compatibility

---

## Conclusion

Epic: Jiminy will bring tachUI's gradient support to parity with SwiftUI while leveraging web-specific optimizations. The phased approach ensures core functionality is delivered quickly while allowing for comprehensive feature development.

**Next Steps:**
1. Approve technical design and API surface
2. Begin Phase 1 implementation
3. Create comprehensive test suite during development
4. Gather developer feedback during beta testing

**Success Definition**: Developers can create beautiful, theme-reactive gradient backgrounds using familiar SwiftUI syntax while achieving excellent web performance.