---
layout: home

hero:
  name: "TachUI"
  text: "SwiftUI for the Web"
  tagline: Production-ready TypeScript framework with 96% SwiftUI API parity and fine-grained reactivity
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View Components
      link: /sheets/components-reference
    - theme: alt
      text: Live Examples
      link: /examples/

features:
  - title: 🚀 96% SwiftUI Parity
    details: Complete SwiftUI API compatibility with 71 components and 130+ modifiers - familiar patterns, identical syntax
  - title: ⚡ Fine-Grained Reactivity
    details: SolidJS-inspired signals provide surgical DOM updates without virtual DOM overhead for optimal performance
  - title: 📦 Plugin Architecture
    details: Modular design scales from 60KB core to 150KB full-featured - import only what you need
  - title: 🎨 Advanced Styling System
    details: Comprehensive modifier system with visual effects, transforms, animations, and responsive design
  - title: 🧭 Complete Navigation
    details: Stack and tab navigation with routing, deep linking, and desktop multi-window support
  - title: 📝 Rich Form System
    details: 25+ specialized form components with validation, formatting, and accessibility built-in
  - title: 🎯 TypeScript-First
    details: Built with TypeScript from day one with strict type safety and excellent IDE support
  - title: 🔧 Production Ready
    details: Comprehensive testing suite, performance monitoring, and modern tooling with Vite integration
---

## Quick Example

Create reactive UIs with SwiftUI-inspired syntax:

```typescript
import { createSignal, VStack, Text, Button } from '@tachui/core'

const CounterApp = () => {
  const [count, setCount] = createSignal(0)

  return VStack({
    children: [
      Text(() => `Count: ${count()}`)
        .modifier
        .fontSize(24)
        .fontWeight('bold')
        .foregroundColor('#007AFF')
        .build(),

      Button('Increment', () => setCount(count() + 1))
        .modifier
        .backgroundColor('#007AFF')
        .foregroundColor('white')
        .padding(16)
        .cornerRadius(8)
        .scaleEffect(() => count() > 10 ? 1.1 : 1.0)
        .transition({ duration: 200 })
        .build()
    ],
    spacing: 16,
    alignment: 'center'
  })
    .modifier
    .padding(20)
    .frame({ maxWidth: 400 })
    .build()
}
```

## Framework Architecture

TachUI provides a complete UI framework with three powerful packages:

### 🏗️ Core Package (`@tachui/core`) - 60KB
- **39 essential components** - Text, Button, Image, Symbol, VStack, HStack, Grid, LazyVGrid, LazyHGrid, List, ScrollView
- **130+ modifiers** - Layout, styling, interaction, animation, and visual effects
- **Reactive system** - Fine-grained signals with automatic cleanup
- **Desktop support** - Window management and multi-viewport applications

### 🧭 Navigation Package (`@tachui/navigation`) - +25KB
- **9 navigation components** - NavigationStack, TabView, NavigationLink
- **SwiftUI routing** - Path-based navigation with type safety
- **Multi-platform** - Adaptive navigation for mobile and desktop

### 📝 Forms Package (`@tachui/forms`) - +35KB
- **24 specialized components** - EmailField, CreditCardField, DatePicker
- **Advanced validation** - Built-in rules, custom validators, real-time feedback
- **Accessibility** - ARIA compliance and keyboard navigation

## Performance & Bundle Size

TachUI delivers exceptional performance through modern architecture:

### 📊 Performance Metrics
- **Fine-Grained Updates**: Only changed properties trigger DOM updates, not entire components
- **Memory Efficient**: Automatic cleanup and minimal memory footprint
- **Zero Virtual DOM**: Direct DOM manipulation eliminates reconciliation overhead
- **Compile-Time Optimized**: Build-time optimizations eliminate runtime bloat

### 📦 Bundle Scaling
```
Core Only:        ~60KB  → Perfect for landing pages, blogs
Core + Navigation: ~85KB  → Ideal for single-page applications
Core + Forms:     ~95KB  → Great for data-heavy applications
Full Framework:   ~150KB → Complete multi-window desktop apps
```

### 🎯 Real-World Applications
- **Calculator App** (Core only): Production-ready with Apple-style design and reactive calculations

## SwiftUI Developer Experience

Perfect for iOS developers transitioning to web - identical API patterns:

```swift
// SwiftUI
VStack(spacing: 16) {
    Text("Welcome to TachUI")
        .font(.title)
        .fontWeight(.bold)
        .foregroundColor(.blue)

    AsyncImage(url: URL(string: "/hero.jpg")) { image in
        image
            .resizable()
            .aspectRatio(16/9, contentMode: .fit)
            .cornerRadius(12)
    }

    Button("Get Started") {
        handleAction()
    }
    .buttonStyle(.borderedProminent)
}
.padding()
.navigationTitle("Home")
```

```typescript
// TachUI - identical patterns
VStack({
  children: [
    Text('Welcome to TachUI')
      .modifier
      .font({ size: 'title' })
      .fontWeight('bold')
      .foregroundColor('blue')
      .build(),

    Image('/hero.jpg')
      .modifier
      .resizable()
      .aspectRatio(16/9, 'fit')
      .cornerRadius(12)
      .build(),

    Button('Get Started', handleAction)
      .modifier
      .buttonStyle('borderedProminent')
      .build()
  ],
  spacing: 16
})
  .modifier
  .padding()
  .navigationTitle('Home')
  .build()
```

## Advanced Features

### 🎨 Visual Effects & Transforms
Complete CSS filter effects with reactive support:
```typescript
Image('/photo.jpg')
  .modifier
  .blur(() => isLoading() ? 3 : 0)
  .scaleEffect(() => isHovered() ? 1.05 : 1.0)
  .rotationEffect(5, 'center')
  .transition({ duration: 300 })
  .build()
```

### 🖥️ Multi-Window Desktop Apps
Native desktop application patterns:
```typescript
App({
  children: [
    Window({
      id: 'main',
      title: 'My App',
      content: () => MainView()
    }),

    WindowGroup({
      id: 'documents',
      title: 'Document',
      for: Document,
      content: (doc) => DocumentEditor({ document: doc })
    })
  ]
})
```

### 📱 Responsive Design
Mobile-first with desktop adaptation:
```typescript
VStack({ children })
  .modifier
  .padding(() => isMobile() ? 16 : 24)
  .frame({ maxWidth: () => isDesktop() ? 800 : Infinity })
  .build()
```

## Migration & Compatibility

### From React
```typescript
// React
const [count, setCount] = useState(0)
return <div onClick={() => setCount(c => c + 1)}>{count}</div>

// TachUI - nearly identical
const [count, setCount] = createSignal(0)
return Text(() => count()).modifier.onTap(() => setCount(c => c + 1)).build()
```

### From SwiftUI
```swift
// SwiftUI
VStack(spacing: 16) {
    Text("Hello")
        .font(.title)
        .foregroundColor(.blue)
}
.padding()
```

```typescript
// TachUI - identical API
VStack({
  children: [
    Text("Hello")
      .modifier
      .font({ size: 'title' })
      .foregroundColor('blue')
      .build()
  ],
  spacing: 16
})
  .modifier
  .padding()
  .build()
```

## Development Experience

### 🛠️ Modern Tooling
- **Vite Integration**: Lightning-fast dev server and builds
- **TypeScript**: Complete type safety with intelligent autocomplete
- **Testing**: Comprehensive test suite with 95%+ coverage
- **Documentation**: Interactive examples and complete API reference

### 🎯 Quick Start Options
```bash
# Install TachUI CLI globally (once published)
npm install -g @tachui/cli
tacho init my-app

# Or add to existing project
npm install @tachui/core
# yarn add @tachui/core
# pnpm add @tachui/core
```

### 📋 Project Templates
- **basic**: Simple TachUI app with core components
- **full-featured**: Advanced template with @State, navigation, and TodoMVC example

## Ready to Build?

Start building production-ready applications with familiar SwiftUI patterns:

- [Get Started](/guide/getting-started){ .md-button .md-button--primary }
- [View Components](/sheets/components-reference){ .md-button }
- [Live Examples](/examples/){ .md-button }

---

**Latest Release**: v1.4 • **Components**: 71 • **Modifiers**: 130+ • **SwiftUI Parity**: 95% • **Test Coverage**: 95%+
