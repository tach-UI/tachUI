# CSS Modifier Examples

The CSS modifier provides an escape hatch for using cutting-edge CSS features, experimental properties, and any CSS that doesn't have dedicated TachUI modifiers yet. This guide showcases practical examples of leveraging the CSS modifier for modern web development.

## Basic CSS Modifier Usage

### Single Properties

```typescript
import { Text, VStack, Button } from '@tachui/core'

// Apply single CSS properties
const modernText = Text('Backdrop filtered text')
  .modifier
  .cssProperty('backdrop-filter', 'blur(10px)')
  .cssProperty('scroll-behavior', 'smooth')
  .cssProperty('container-type', 'inline-size')
  .padding(16)
  .backgroundColor('rgba(255, 255, 255, 0.8)')
  .build()

// Multiple properties at once
const advancedCard = VStack({ children: [] })
  .modifier
  .css({
    backdropFilter: 'blur(10px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
    boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
    borderRadius: '16px',
    background: 'rgba(255, 255, 255, 0.1)'
  })
  .build()
```

## Modern CSS Features

### Container Queries

```typescript
// Responsive component using container queries
const containerQueryComponent = VStack({
  children: [
    Text('Container Query Demo')
      .modifier
      .typography({ size: 16, weight: '600' })
      .build()
  ]
})
.modifier
.padding({ all: 16 })
.backgroundColor('#f0f8ff')
.css({
  containerType: 'inline-size',
  containerName: 'card-container',
  
  // Responsive behavior based on container size
  '@container card-container (min-width: 300px)': {
    padding: '24px',
    borderRadius: '12px'
  },
  
  '@container card-container (min-width: 500px)': {
    padding: '32px',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px'
  },
  
  '@container card-container (min-width: 700px)': {
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '24px'
  }
})
.build()
```

### CSS Grid Advanced Features

```typescript
// Modern CSS Grid with advanced features
const advancedGrid = VStack({ children: [] })
  .modifier
  .css({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(clamp(200px, 30vw, 300px), 1fr))',
    gridTemplateRows: 'masonry', // Future CSS feature
    gap: 'clamp(1rem, 3vw, 2rem)',
    gridAutoFlow: 'dense',
    
    // Subgrid support (when available)
    gridTemplateColumns: 'subgrid',
    
    // Aspect ratio for consistent sizing
    aspectRatio: 'auto',
    
    // Container intrinsic sizing
    containIntrinsicSize: 'auto 500px'
  })
  .build()

// Individual grid items with modern placement
const gridItem = VStack({ children: [] })
  .modifier
  .css({
    gridColumn: 'span 2',
    gridRow: 'span auto',
    aspectRatio: '16/9',
    
    // Modern alignment
    placeSelf: 'center',
    justifySelf: 'stretch',
    alignSelf: 'start'
  })
  .build()
```

### Scroll and Animation Features

```typescript
// Advanced scroll behaviors
const scrollContainer = VStack({ children: [] })
  .modifier
  .css({
    // Scroll snapping
    scrollSnapType: 'y mandatory',
    scrollBehavior: 'smooth',
    scrollPadding: '2rem',
    
    // Overscroll behavior
    overscrollBehavior: 'contain',
    overscrollBehaviorY: 'none',
    
    // Scroll timeline (future CSS)
    scrollTimeline: '--scroll-timeline',
    
    // Custom scrollbars
    scrollbarWidth: 'thin',
    scrollbarColor: '#007AFF #f0f0f0'
  })
  .build()

// Scroll snap items
const snapItem = VStack({ children: [] })
  .modifier
  .css({
    scrollSnapAlign: 'start',
    scrollSnapStop: 'always',
    scrollMargin: '1rem'
  })
  .build()

// View transitions (future CSS)
const transitionElement = Text('Smooth transitions')
  .modifier
  .css({
    viewTransitionName: 'main-content',
    containIntrinsicSize: 'auto 200px'
  })
  .build()
```

## CSS Custom Properties and Theming

### Design Token System

```typescript
import { createSignal, createMemo } from '@tachui/core'

// Design token component
function DesignSystemComponent() {
  const [theme, setTheme] = createSignal<'light' | 'dark' | 'auto'>('light')
  
  // Design tokens as CSS variables
  const designTokens = VStack({ children: [] })
    .modifier
    .cssVariable('color-primary', '#007AFF')
    .cssVariable('color-secondary', '#34C759')
    .cssVariable('color-danger', '#FF3B30')
    .cssVariable('color-warning', '#FF9500')
    
    .cssVariable('space-xs', '4px')
    .cssVariable('space-sm', '8px')
    .cssVariable('space-md', '16px')
    .cssVariable('space-lg', '24px')
    .cssVariable('space-xl', '32px')
    
    .cssVariable('radius-sm', '4px')
    .cssVariable('radius-md', '8px')
    .cssVariable('radius-lg', '12px')
    .cssVariable('radius-xl', '16px')
    
    .cssVariable('font-xs', '12px')
    .cssVariable('font-sm', '14px')
    .cssVariable('font-md', '16px')
    .cssVariable('font-lg', '18px')
    .cssVariable('font-xl', '24px')
    
    // Theme-aware variables
    .cssVariable('bg-primary', () => {\n      const t = theme()\n      return t === 'dark' ? '#1a1a1a' : t === 'light' ? '#ffffff' : 'Canvas'\n    })\n    .cssVariable('text-primary', () => {\n      const t = theme()\n      return t === 'dark' ? '#ffffff' : t === 'light' ? '#1a1a1a' : 'CanvasText'\n    })\n    .build()\n  \n  return designTokens\n}\n\n// Usage with design tokens\nconst tokenBasedCard = VStack({\n  children: [\n    Text('Design Token Example')\n      .modifier\n      .css({\n        fontSize: 'var(--font-lg)',\n        color: 'var(--text-primary)',\n        marginBottom: 'var(--space-md)'\n      })\n      .build()\n  ]\n})\n.modifier\n.css({\n  backgroundColor: 'var(--bg-primary)',\n  padding: 'var(--space-lg)',\n  borderRadius: 'var(--radius-lg)',\n  border: '1px solid var(--color-primary)',\n  color: 'var(--text-primary)'\n})\n.build()\n```\n\n### Dynamic Theming\n\n```typescript\n// Advanced theming with CSS custom properties\nfunction ThemeProvider(props: { children: any[] }) {\n  const [colorScheme, setColorScheme] = createSignal<'light' | 'dark'>('light')\n  const [accentColor, setAccentColor] = createSignal('#007AFF')\n  const [density, setDensity] = createSignal<'compact' | 'normal' | 'comfortable'>('normal')\n  \n  const themeVariables = createMemo(() => {\n    const scheme = colorScheme()\n    const accent = accentColor()\n    const d = density()\n    \n    return {\n      // Color scheme\n      '--color-bg-primary': scheme === 'dark' ? '#1a1a1a' : '#ffffff',\n      '--color-bg-secondary': scheme === 'dark' ? '#2d2d2d' : '#f8f9fa',\n      '--color-text-primary': scheme === 'dark' ? '#ffffff' : '#1a1a1a',\n      '--color-text-secondary': scheme === 'dark' ? '#a0a0a0' : '#666666',\n      \n      // Accent colors\n      '--color-accent': accent,\n      '--color-accent-light': `${accent}20`, // 20% opacity\n      '--color-accent-dark': adjustColor(accent, -20),\n      \n      // Density-based spacing\n      '--space-component': d === 'compact' ? '8px' : d === 'normal' ? '12px' : '16px',\n      '--space-section': d === 'compact' ? '16px' : d === 'normal' ? '24px' : '32px',\n      \n      // Animation preferences\n      '--duration-fast': '150ms',\n      '--duration-normal': '300ms',\n      '--duration-slow': '500ms',\n      '--easing-standard': 'cubic-bezier(0.4, 0.0, 0.2, 1)'\n    }\n  })\n  \n  return VStack({ children: props.children })\n    .modifier\n    .css(() => themeVariables())\n    .css({\n      // System preference support\n      '@media (prefers-color-scheme: dark)': {\n        '--color-bg-primary': '#1a1a1a',\n        '--color-text-primary': '#ffffff'\n      },\n      \n      '@media (prefers-reduced-motion: reduce)': {\n        '--duration-fast': '0ms',\n        '--duration-normal': '0ms',\n        '--duration-slow': '0ms'\n      },\n      \n      '@media (prefers-contrast: high)': {\n        '--color-text-primary': scheme === 'dark' ? '#ffffff' : '#000000'\n      }\n    })\n    .build()\n}\n\nfunction adjustColor(color: string, amount: number): string {\n  // Color adjustment utility (implementation would adjust lightness)\n  return color // Simplified for example\n}\n```\n\n## Browser Compatibility and Vendor Prefixes\n\n### Cross-Browser Support\n\n```typescript\n// Component with comprehensive browser support\nconst crossBrowserCard = VStack({ children: [] })\n  .modifier\n  .css({\n    // Standard properties\n    backdropFilter: 'blur(10px)',\n    maskImage: 'linear-gradient(black, transparent)',\n    clipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)',\n    \n    // Webkit prefixes\n    WebkitBackdropFilter: 'blur(10px)',\n    WebkitMaskImage: 'linear-gradient(black, transparent)',\n    WebkitClipPath: 'polygon(0 0, 100% 0, 100% 90%, 0 100%)',\n    \n    // Mozilla prefixes\n    MozUserSelect: 'none',\n    MozAppearance: 'none',\n    \n    // Microsoft prefixes\n    msFilter: 'blur(5px)',\n    msTransform: 'scale(1.1)',\n    \n    // Fallbacks\n    background: 'rgba(255, 255, 255, 0.9)', // Fallback for backdrop-filter\n    border: '1px solid #e0e0e0' // Fallback for advanced borders\n  })\n  .build()\n\n// Feature detection with CSS\nconst featureDetectionCard = VStack({ children: [] })\n  .modifier\n  .css({\n    // Default styles\n    background: '#f0f0f0',\n    \n    // Enhanced styles with feature detection\n    '@supports (backdrop-filter: blur(10px))': {\n      background: 'rgba(255, 255, 255, 0.1)',\n      backdropFilter: 'blur(10px)'\n    },\n    \n    '@supports (display: grid)': {\n      display: 'grid',\n      gridTemplateColumns: '1fr 1fr'\n    },\n    \n    '@supports not (display: grid)': {\n      display: 'flex',\n      flexWrap: 'wrap'\n    },\n    \n    '@supports (aspect-ratio: 1)': {\n      aspectRatio: '16/9'\n    },\n    \n    '@supports not (aspect-ratio: 1)': {\n      '&::before': {\n        content: '\"\"',\n        display: 'block',\n        paddingTop: '56.25%' // 16:9 aspect ratio fallback\n      }\n    }\n  })\n  .build()\n```\n\n## Performance and Optimization\n\n### GPU Acceleration and Performance\n\n```typescript\n// Performance-optimized component\nconst performantCard = VStack({ children: [] })\n  .modifier\n  .css({\n    // GPU acceleration\n    willChange: 'transform, opacity',\n    transform: 'translateZ(0)', // Force GPU layer\n    \n    // Containment for performance\n    contain: 'layout style paint',\n    contentVisibility: 'auto',\n    containIntrinsicSize: 'auto 200px',\n    \n    // Efficient transitions\n    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',\n    \n    // Optimized rendering\n    backfaceVisibility: 'hidden',\n    perspective: '1000px',\n    \n    // Intersection observer optimization\n    '&[data-intersecting=\"false\"]': {\n      contentVisibility: 'hidden'\n    }\n  })\n  .build()\n\n// Critical path optimization\nconst criticalPathCard = VStack({ children: [] })\n  .modifier\n  .css({\n    // Above-the-fold optimization\n    '&[data-critical=\"true\"]': {\n      contentVisibility: 'visible',\n      contain: 'none'\n    },\n    \n    // Below-the-fold optimization\n    '&[data-critical=\"false\"]': {\n      contentVisibility: 'auto',\n      contain: 'layout style paint',\n      containIntrinsicSize: 'auto 300px'\n    }\n  })\n  .build()\n```\n\n## Accessibility and User Preferences\n\n### Accessibility-First Styling\n\n```typescript\n// Comprehensive accessibility support\nconst accessibleComponent = VStack({ children: [] })\n  .modifier\n  .css({\n    // High contrast support\n    '@media (prefers-contrast: high)': {\n      borderWidth: '2px',\n      borderStyle: 'solid',\n      outline: '2px solid transparent',\n      outlineOffset: '2px'\n    },\n    \n    // Reduced motion support\n    '@media (prefers-reduced-motion: reduce)': {\n      animation: 'none',\n      transition: 'none',\n      transform: 'none'\n    },\n    \n    // Dark mode support\n    '@media (prefers-color-scheme: dark)': {\n      backgroundColor: '#1a1a1a',\n      color: '#ffffff',\n      borderColor: '#404040'\n    },\n    \n    // Focus management\n    '&:focus-visible': {\n      outline: '2px solid #007AFF',\n      outlineOffset: '2px',\n      borderRadius: '4px'\n    },\n    \n    // Screen reader optimization\n    '@media (prefers-reduced-data: reduce)': {\n      backgroundImage: 'none',\n      boxShadow: 'none'\n    },\n    \n    // Print styles\n    '@media print': {\n      backgroundColor: 'white !important',\n      color: 'black !important',\n      boxShadow: 'none !important'\n    }\n  })\n  .build()\n```\n\n## Migration and Future-Proofing\n\n### Graceful Enhancement\n\n```typescript\n// Progressive enhancement pattern\nconst progressiveCard = VStack({ children: [] })\n  .modifier\n  // Base TachUI modifiers (always work)\n  .padding({ all: 16 })\n  .backgroundColor('#ffffff')\n  .cornerRadius(8)\n  .border(1, '#e0e0e0')\n  \n  // Enhanced styles with CSS modifier\n  .css({\n    // Modern enhancements\n    containerType: 'inline-size',\n    backdropFilter: 'blur(10px)',\n    \n    // Future CSS features (gracefully ignored if unsupported)\n    anchorName: '--card-anchor',\n    scrollTimeline: '--card-scroll',\n    viewTransitionName: 'card-transition'\n  })\n  .build()\n\n// Migration helper for new CSS features\nfunction withModernCSS(baseModifier: any, modernStyles: Record<string, any>) {\n  return baseModifier.css({\n    ...modernStyles,\n    \n    // Feature detection wrapper\n    '@supports not (backdrop-filter: blur(1px))': {\n      // Fallback styles for older browsers\n      background: 'rgba(255, 255, 255, 0.95)',\n      border: '1px solid rgba(0, 0, 0, 0.1)'\n    }\n  })\n}\n\n// Usage\nconst futureProofCard = withModernCSS(\n  Text('Future-proof styling')\n    .modifier\n    .padding({ all: 20 }),\n  {\n    backdropFilter: 'blur(10px)',\n    containerType: 'inline-size',\n    aspectRatio: '16/9'\n  }\n).build()\n```\n\n## Best Practices Summary\n\n### When to Use CSS Modifier\n\n✅ **Good use cases:**\n- Experimental CSS features not yet in TachUI\n- Browser-specific properties and vendor prefixes\n- Complex CSS Grid layouts\n- Modern CSS features (container queries, backdrop filters)\n- CSS custom properties for theming\n- Performance optimizations (containment, will-change)\n- Accessibility enhancements\n\n❌ **Avoid for:**\n- Properties covered by existing TachUI modifiers\n- Simple styling that can be done with specific modifiers\n- Styles that don't need the flexibility of raw CSS\n\n### Performance Tips\n\n1. **Group related properties** in single `.css()` calls\n2. **Use CSS containment** for performance isolation\n3. **Leverage CSS custom properties** for theming\n4. **Implement progressive enhancement** with feature detection\n5. **Consider accessibility** in all custom CSS\n\nThe CSS modifier bridges the gap between TachUI's declarative API and the full power of modern CSS, ensuring your applications can leverage cutting-edge web technologies while maintaining the clean, SwiftUI-inspired development experience.