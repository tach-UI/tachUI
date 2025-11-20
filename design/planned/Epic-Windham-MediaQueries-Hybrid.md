---
cssclasses:
  - full-page
---

# MediaQueries: Hybrid SwiftUI Environment Integration (Post-Launch)

- **Epic Name:** Windham - Hybrid SwiftUI Environment Media Query System
- **Status:** 📋 **PLANNED** - Post-launch enhancement feature
- **Priority:** 🔄 **ENHANCEMENT** - Post-1.0 release feature
- **Timeline:** 2-3 weeks implementation (Post CSS-Native implementation)
- **Status:** *On-hold*

---

## Overview

This document outlines the hybrid SwiftUI environment integration features for tachUI's responsive design system. These features are planned for implementation **after** the initial CSS-Native media query system is complete and stable.

The hybrid approach combines the familiar CSS-native responsive design with optional SwiftUI environment patterns, providing iOS developers with familiar size class patterns while maintaining web performance.

---

## SwiftUI Environment Integration

### **Environment Key System**

#### **Size Class Environment Keys**
```typescript
// SwiftUI-style environment keys for responsive design
export const HorizontalSizeClass = createEnvironmentKey<'compact' | 'regular'>('compact')
export const VerticalSizeClass = createEnvironmentKey<'compact' | 'regular'>('compact')
export const ColorScheme = createEnvironmentKey<'light' | 'dark'>('light')
export const DisplayScale = createEnvironmentKey<number>(1)

// Bridge between CSS breakpoints and SwiftUI size classes
function mapBreakpointToSizeClass(breakpoint: string): 'compact' | 'regular' {
  return ['base', 'sm'].includes(breakpoint) ? 'compact' : 'regular'
}

// Automatic environment setup
export function createResponsiveEnvironment() {
  const responsiveSystem = createResponsiveSystem()
  
  const horizontalSizeClass = createComputed(() => 
    mapBreakpointToSizeClass(responsiveSystem.currentBreakpoint())
  )
  
  return {
    [HorizontalSizeClass]: horizontalSizeClass,
    [VerticalSizeClass]: createSignal('regular'), // Could be enhanced for height-based
    [ColorScheme]: createSignal('light'), // Could be enhanced for system preference
    [DisplayScale]: createSignal(window.devicePixelRatio || 1)
  }
}
```

#### **SwiftUI-Style Responsive Components**
```typescript
// SwiftUI environment-aware responsive components
Text("Size Class Responsive")
  .modifier
  .fontSize(createComputed(() => {
    const sizeClass = useEnvironment(HorizontalSizeClass)
    return sizeClass() === 'compact' ? 14 : 18
  }))
  .build()

// Environment-based conditional rendering
Show(
  createComputed(() => useEnvironment(HorizontalSizeClass)() === 'regular'),
  [
    HStack([
      Text("Desktop Layout"),
      Spacer(),
      Button("Action", handleAction)
    ])
  ],
  [
    VStack([
      Text("Mobile Layout"),
      Button("Action", handleAction)
    ])
  ]
)
```

### **Hybrid API Design**

#### **Dual Approach Support**
```typescript
// Both CSS-native and SwiftUI environment approaches work together
Text("Flexible Responsive")
  .modifier
  // CSS-native responsive (primary approach)
  .responsive({
    base: { fontSize: 14, padding: 8 },
    md: { fontSize: 16, padding: 12 },
    lg: { fontSize: 18, padding: 16 }
  })
  
  // SwiftUI environment override (secondary)
  .environmentOverride(HorizontalSizeClass, 'compact', {
    fontSize: 12,
    fontWeight: 'medium'
  })
  .build()

// Environment-specific styling
VStack([...])
  .modifier
  .responsive({
    base: { flexDirection: 'column', gap: 8 },
    lg: { flexDirection: 'row', gap: 16 }
  })
  .environmentStyle(HorizontalSizeClass, {
    compact: { padding: 12 },
    regular: { padding: 20 }
  })
  .build()
```

#### **SwiftUI Size Class Integration**
```typescript
// Size class specific modifiers
interface SizeClassModifiers {
  compactWidth(styles: CSSProperties): ModifierChain
  regularWidth(styles: CSSProperties): ModifierChain
  compactHeight(styles: CSSProperties): ModifierChain
  regularHeight(styles: CSSProperties): ModifierChain
  
  // Combined size class modifiers
  compactWidthRegularHeight(styles: CSSProperties): ModifierChain
  regularWidthCompactHeight(styles: CSSProperties): ModifierChain
}

// Usage examples
Button("Adaptive Button", handleClick)
  .modifier
  .backgroundColor('#007AFF')
  .compactWidth({
    width: '100%',
    padding: { vertical: 12, horizontal: 16 }
  })
  .regularWidth({
    width: 'auto',
    padding: { vertical: 8, horizontal: 20 }
  })
  .build()
```

---

## Technical Implementation

### **Environment Provider System**

#### **Responsive Environment Provider**
```typescript
// Enhanced environment provider with responsive capabilities
export function ResponsiveEnvironmentProvider(
  children: ComponentChildren,
  config?: ResponsiveEnvironmentConfig
) {
  const responsiveSystem = createResponsiveSystem()
  
  // Create environment values based on current breakpoint
  const environmentValues = createComputed(() => {
    const currentBreakpoint = responsiveSystem.currentBreakpoint()
    
    return {
      [HorizontalSizeClass]: mapBreakpointToSizeClass(currentBreakpoint),
      [VerticalSizeClass]: mapHeightToSizeClass(responsiveSystem.screenSize().height),
      [ColorScheme]: detectColorScheme(),
      [DisplayScale]: window.devicePixelRatio || 1
    }
  })
  
  return EnvironmentProvider(environmentValues, children)
}

// Automatic responsive environment setup
export function withResponsiveEnvironment<T extends Component>(
  component: T,
  config?: ResponsiveEnvironmentConfig
): T {
  return ResponsiveEnvironmentProvider([component], config) as T
}
```

#### **Size Class Detection Logic**
```typescript
// Advanced size class mapping with customization
interface SizeClassMapping {
  horizontalBreakpoint: number  // Width threshold for compact/regular
  verticalBreakpoint: number    // Height threshold for compact/regular
  customMappings?: {
    [breakpoint: string]: 'compact' | 'regular'
  }
}

function createSizeClassMapper(mapping: SizeClassMapping) {
  return {
    mapBreakpointToHorizontalSizeClass(breakpoint: string, width: number): 'compact' | 'regular' {
      if (mapping.customMappings?.[breakpoint]) {
        return mapping.customMappings[breakpoint]
      }
      
      return width < mapping.horizontalBreakpoint ? 'compact' : 'regular'
    },
    
    mapHeightToVerticalSizeClass(height: number): 'compact' | 'regular' {
      return height < mapping.verticalBreakpoint ? 'compact' : 'regular'
    }
  }
}
```

### **Bridge Between Approaches**

#### **CSS-Native to Environment Bridge**
```typescript
// Bridge system that connects CSS breakpoints to SwiftUI environment
export class ResponsiveBridge {
  private cssBreakpoints: BreakpointConfig
  private environmentMapping: SizeClassMapping
  
  constructor(cssBreakpoints: BreakpointConfig, environmentMapping: SizeClassMapping) {
    this.cssBreakpoints = cssBreakpoints
    this.environmentMapping = environmentMapping
  }
  
  // Convert CSS responsive values to environment-aware values
  bridgeResponsiveValues<T>(
    cssValues: ResponsiveValues<T>,
    environmentOverrides?: EnvironmentOverrides<T>
  ): ComputedResponsiveValue<T> {
    return createComputed(() => {
      const currentBreakpoint = getCurrentBreakpoint()
      const horizontalSizeClass = this.getHorizontalSizeClass(currentBreakpoint)
      
      // Start with CSS-native value
      let value = this.resolveCSSValue(cssValues, currentBreakpoint)
      
      // Apply environment overrides if provided
      if (environmentOverrides?.sizeClass?.[horizontalSizeClass]) {
        value = { ...value, ...environmentOverrides.sizeClass[horizontalSizeClass] }
      }
      
      return value
    })
  }
  
  private getHorizontalSizeClass(breakpoint: string): 'compact' | 'regular' {
    const width = window.innerWidth
    return this.environmentMapping.mapBreakpointToHorizontalSizeClass(breakpoint, width)
  }
}
```

#### **Environment-Aware Responsive Modifier**
```typescript
// Enhanced responsive modifier with environment support
interface HybridResponsiveModifierChain extends ModifierChain {
  responsive<T>(values: ResponsiveValues<T>): HybridResponsiveModifierChain
  responsiveWithEnvironment<T>(
    cssValues: ResponsiveValues<T>,
    environmentOverrides: EnvironmentOverrides<T>
  ): HybridResponsiveModifierChain
  
  // Environment-specific modifiers
  environmentStyle<T>(
    key: EnvironmentKey<T>,
    styleMap: { [K in T]: CSSProperties }
  ): HybridResponsiveModifierChain
  
  environmentOverride<T>(
    key: EnvironmentKey<T>,
    value: T,
    styles: CSSProperties
  ): HybridResponsiveModifierChain
}
```

---

## SwiftUI Developer Experience

### **Familiar Patterns for iOS Developers**

#### **Size Class Conditional Layouts**
```typescript
// SwiftUI-style size class layouts
function AdaptiveLayout() {
  const horizontalSizeClass = useEnvironment(HorizontalSizeClass)
  
  return Show(
    createComputed(() => horizontalSizeClass() === 'compact'),
    [
      // Compact width layout (mobile)
      VStack([
        Text("Mobile Title").modifier.fontSize(24).build(),
        Text("Mobile content layout").build(),
        Button("Mobile Action", handleAction).modifier.width('100%').build()
      ]).modifier.padding(16).build()
    ],
    [
      // Regular width layout (desktop)
      HStack([
        VStack([
          Text("Desktop Title").modifier.fontSize(32).build(),
          Text("Desktop content layout").build()
        ]).modifier.flex(1).build(),
        Button("Desktop Action", handleAction).modifier.width(200).build()
      ]).modifier.padding(24).build()
    ]
  )
}
```

#### **Environment-Driven Styling**
```typescript
// Environment-aware styling patterns
const useAdaptiveStyles = () => {
  const horizontalSizeClass = useEnvironment(HorizontalSizeClass)
  const colorScheme = useEnvironment(ColorScheme)
  
  return createComputed(() => ({
    container: {
      padding: horizontalSizeClass() === 'compact' ? 16 : 24,
      backgroundColor: colorScheme() === 'dark' ? '#1c1c1e' : '#ffffff'
    },
    text: {
      fontSize: horizontalSizeClass() === 'compact' ? 14 : 16,
      color: colorScheme() === 'dark' ? '#ffffff' : '#000000'
    }
  }))
}

// Usage in components
function AdaptiveCard() {
  const styles = useAdaptiveStyles()
  
  return VStack([
    Text("Adaptive Content")
      .modifier
      .styles(createComputed(() => styles().text))
      .build()
  ])
  .modifier
  .styles(createComputed(() => styles().container))
  .build()
}
```

### **Progressive Enhancement Strategy**

#### **CSS-First with Environment Enhancement**
```typescript
// Start with CSS-native responsive design
const baseComponent = Text("Progressive Enhancement")
  .modifier
  .responsive({
    base: { fontSize: 14, lineHeight: 1.4 },
    md: { fontSize: 16, lineHeight: 1.5 },
    lg: { fontSize: 18, lineHeight: 1.6 }
  })
  .build()

// Enhance with SwiftUI environment for iOS developers
const enhancedComponent = Text("Progressive Enhancement")
  .modifier
  .responsive({
    base: { fontSize: 14, lineHeight: 1.4 },
    md: { fontSize: 16, lineHeight: 1.5 },
    lg: { fontSize: 18, lineHeight: 1.6 }
  })
  // Add environment-specific enhancements
  .environmentStyle(HorizontalSizeClass, {
    compact: { fontWeight: 'medium', letterSpacing: '0.01em' },
    regular: { fontWeight: 'normal', letterSpacing: '0' }
  })
  .environmentStyle(ColorScheme, {
    dark: { color: '#ffffff' },
    light: { color: '#000000' }
  })
  .build()
```

---

## Implementation Plan (Post CSS-Native Launch)

### **Phase 1: Environment Key Foundation (Week 1)**

**Prerequisites**: CSS-Native responsive system must be complete and stable

**Deliverables:**
- SwiftUI environment key system implementation
- Basic size class detection and mapping
- Integration with existing responsive system
- Environment provider setup

**Implementation Steps:**
1. **Day 1-2**: Implement environment key system and size class detection
2. **Day 3-4**: Create responsive environment provider and automatic setup
3. **Day 5-7**: Integration testing with existing CSS-native system

**Success Criteria:**
- ✅ Environment keys work seamlessly with existing responsive system
- ✅ Size class detection is accurate across device types
- ✅ Zero impact on existing CSS-native responsive functionality
- ✅ Performance overhead <5% for environment-enhanced components

### **Phase 2: Hybrid API Development (Week 2)**

**Deliverables:**
- Environment-aware responsive modifiers
- Bridge system between CSS and SwiftUI approaches
- Enhanced modifier chain with environment support
- SwiftUI-style conditional rendering patterns

**Implementation Steps:**
1. **Day 1-3**: Implement hybrid responsive modifier system
2. **Day 4-5**: Create bridge between CSS breakpoints and environment values
3. **Day 6-7**: Develop environment-specific styling patterns

**Success Criteria:**
- ✅ Both CSS-native and environment approaches work together seamlessly
- ✅ Environment overrides work correctly with CSS responsive values
- ✅ SwiftUI developers find familiar and powerful patterns
- ✅ Web developers can ignore environment features without impact

### **Phase 3: Developer Experience & Documentation (Week 3)**

**Deliverables:**
- Comprehensive documentation for hybrid approach
- Migration guide from CSS-only to hybrid implementation
- iOS developer onboarding materials
- Real-world examples demonstrating both approaches

**Implementation Steps:**
1. **Day 1-3**: Complete documentation with practical examples
2. **Day 4-5**: Create migration guides and developer onboarding materials
3. **Day 6-7**: Testing, validation, and example applications

**Success Criteria:**
- ✅ Clear documentation explains when to use each approach
- ✅ Migration path from CSS-only to hybrid approach is straightforward
- ✅ iOS developers can adopt tachUI with familiar patterns
- ✅ Examples demonstrate real-world usage of hybrid capabilities

---

## Benefits of Hybrid Approach

### **For iOS Developers**
- ✅ **Familiar Size Classes**: Horizontal and vertical size class patterns from SwiftUI
- ✅ **Environment-Driven Logic**: Conditional rendering based on environment values
- ✅ **Progressive Enhancement**: Start with CSS, add SwiftUI patterns as needed
- ✅ **Cross-Platform Consistency**: Similar responsive patterns between iOS and web

### **For Web Developers**
- ✅ **Optional Complexity**: Can use CSS-native approach exclusively
- ✅ **Familiar CSS Patterns**: Primary responsive system uses standard web patterns
- ✅ **Performance Optimized**: Environment features are opt-in with minimal overhead
- ✅ **Migration Friendly**: Easy to adopt environment features incrementally

### **For Framework Ecosystem**
- ✅ **Broader Appeal**: Attracts both web and iOS developer communities
- ✅ **Competitive Differentiation**: Unique hybrid approach in web framework space
- ✅ **Future-Proof**: Architecture supports advanced responsive features
- ✅ **Cross-Platform Foundation**: Foundation for potential native mobile expansion

---

## Risk Assessment

### **Technical Risks**

**Added Complexity**
- **Risk**: Hybrid approach adds cognitive overhead for developers
- **Mitigation**: Clear documentation emphasizing CSS-first approach with optional enhancement
- **Monitoring**: Developer feedback and adoption metrics

**Performance Impact**
- **Risk**: Environment system adds runtime overhead
- **Mitigation**: Lazy evaluation, computed values, and opt-in architecture
- **Testing**: Comprehensive performance benchmarks

**API Consistency**
- **Risk**: Dual approaches may lead to inconsistent APIs
- **Mitigation**: Unified modifier chain with consistent patterns across both approaches
- **Validation**: API design review and developer experience testing

### **User Experience Risks**

**Learning Curve**
- **Risk**: Developers may be confused by dual approaches
- **Mitigation**: Progressive disclosure with CSS-first documentation
- **Support**: Clear guidance on when to use each approach

**Migration Complexity**
- **Risk**: Existing CSS-native implementations become outdated
- **Mitigation**: Full backward compatibility with CSS-native as primary approach
- **Tooling**: Automated enhancement suggestions (optional)

---

## Success Metrics

### **Adoption Metrics**
- **Environment Feature Usage**: Percentage of projects using environment features (target: 30%+)
- **iOS Developer Adoption**: Framework adoption among iOS developer community (survey-based)
- **Hybrid Pattern Usage**: Usage of combined CSS + environment patterns (analytics)

### **Technical Metrics**
- **Performance Impact**: Runtime overhead for environment features (target: <5%)
- **Bundle Size Impact**: Additional bundle size for environment features (target: <3KB)
- **API Consistency**: Developer satisfaction with unified API experience (target: >4.5/5)

### **Framework Positioning**
- **Cross-Platform Appeal**: Framework appeal to both web and mobile developers
- **Competitive Differentiation**: Unique positioning in responsive design space
- **Community Growth**: Framework adoption growth in iOS developer community

---

## Future Enhancements

### **Advanced Environment Integration**
- **Dark Mode Support**: Automatic system color scheme detection and integration
- **Accessibility Environment**: Screen reader, reduced motion, and high contrast support
- **Device Environment**: Battery level, network connection, and device capabilities
- **Geographic Environment**: Time zone, locale, and regional preferences

### **Cross-Platform Extensions**
- **React Native Bridge**: Shared responsive patterns between web and mobile
- **Native Mobile Support**: Direct SwiftUI and Jetpack Compose integration
- **Desktop Environment**: Window size classes and desktop-specific patterns
- **Progressive Web App**: Enhanced PWA support with native-like responsive patterns

---

## Conclusion

The Hybrid SwiftUI Environment Integration represents a strategic enhancement to tachUI's responsive design system that can be implemented after the core CSS-Native system is stable. This approach provides:

**Strategic Value:**
- **Broader Developer Appeal**: Attracts iOS developers while maintaining web developer focus
- **Competitive Differentiation**: Unique hybrid approach in web framework landscape
- **Progressive Enhancement**: Optional complexity that doesn't impact core CSS-native users
- **Future-Proof Foundation**: Architecture supports advanced responsive and cross-platform features

**Implementation Strategy:**
- **Post-Launch Feature**: Implement only after CSS-Native system is complete and proven
- **Backward Compatible**: Zero impact on existing CSS-native responsive implementations
- **Incremental Adoption**: Developers can adopt environment features progressively
- **Performance Conscious**: Opt-in architecture minimizes performance impact

**Total Investment**: 3 weeks post-CSS-Native implementation  
**Risk Level**: Low (additive enhancement to proven CSS-native foundation)  
**Strategic Impact**: High (significant competitive differentiation and developer appeal)

This hybrid approach transforms tachUI from a web-focused framework to a truly cross-platform responsive design system while maintaining its performance advantages and web-developer-friendly foundation.