# tachUI: SwiftUI-Inspired Web Framework with Reactive Core

We've built a web framework that transposes SwiftUI's declarative paradigm to the browser with zero React dependencies. After 8 months of development, we're at 95%+ test coverage with 2,672 passing tests across 170 test files.

## Technical Architecture

**Reactive System**: Custom signal-based reactivity inspired by SolidJS but designed specifically for SwiftUI patterns. No VDOM - direct DOM manipulation with surgical updates.

**Plugin Architecture**: 
- Core: 60KB (26 components, modifier system, reactive runtime)
- Forms: +87KB (advanced form components with validation)
- Navigation: +46KB (declarative routing and navigation stacks)
- Symbols: Variable size (Lucide integration with tree-shaking)

**Build Pipeline**: Vite 7.1.1 with custom plugins for icon optimization and bundle analysis. TypeScript 5.8+ with strict configuration. All packages built with rollup for optimal tree-shaking.

## Performance Characteristics

Bundle sizes comparable to Preact but with SwiftUI ergonomics:
- Calculator app: 45.6kB total bundle
- Framework overhead: <5% runtime cost
- Memory management: Automatic cleanup with leak detection
- CSS generation: Cached and optimized for repeated modifier applications

## Code Sample

```typescript
VStack({ spacing: 16 })
  .responsive({
    base: { padding: 16 },
    md: { padding: 24 },
    lg: { padding: 32 }
  })
  .children([
    Text("Welcome")
      .font({ size: 24, weight: 'bold' })
      .foregroundColor('#2563eb'),
    
    Button("Get Started")
      .backgroundColor('#3b82f6')
      .cornerRadius(8)
      .onTap(() => navigate('/dashboard'))
  ])
```

## Testing & Quality

Comprehensive testing includes memory leak detection, security scanning (SARIF), performance regression detection, and real-world scenario validation. CI runs 29-second test suite with automated NPM publishing on git tags.

**Interesting Technical Details**:
- Modifier system with dependency injection and priority ordering
- Component concatenation for performance optimization  
- CSS-in-JS generation with vendor prefix handling
- Responsive system with 15 media query types beyond basic breakpoints
- Plugin loading with circular dependency resolution

The reactive scheduler handles updates at 60fps with batching and priority queues. Error boundaries provide automatic recovery with fallback rendering.

GitHub: [Would need actual URL]
Docs: Comprehensive API documentation with TypeScript definitions

Looking for feedback on the modifier composition patterns and reactive system design choices.