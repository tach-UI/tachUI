---
cssclasses:
  - full-page
---

# tachUI

> **SwiftUI-inspired web framework with fine-grained reactivity**

[![Version](https://img.shields.io/badge/Version-0.8.0--alpha-orange)](https://github.com/tach-UI/tachUI/releases)
[![License](https://img.shields.io/badge/License-MPL--2.0-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/badge/Node-20+-green)](https://nodejs.org/)

**tachUI** brings SwiftUI's declarative syntax to the web with SolidJS-inspired reactivity and direct DOM manipulation for maximum performance. This is our **first public alpha release** - ready for early adopters and contributors.

---

## Alpha Release - Welcome!

**tachUI 0.8.0-alpha** represents a major architectural milestone! This release features complete modular restructuring with 15+ specialized packages and improved performance across the entire framework.

### What's New in 0.8.0 Alpha

- **Modular Architecture:** 15+ specialized packages (@tachui/primitives, @tachui/modifiers, etc.)
- **200+ SwiftUI Modifiers:** Complete modifier system with chainable API
- **Foundation Packages:** Primitives, modifiers, effects, grid, responsive design
- **Advanced Features:** Flow control, navigation, forms, mobile patterns, symbols
- **Build Performance:** Optimized dependency chain and tree-shaking
- **TypeScript-first:** Complete type safety with excellent IntelliSense

### What to know about...

- **Modular Extraction:** We have revamped the entire framework structure for better separation and tree-shaking which should lead to smaller output. This is undergoing real-world integration testing now.
- **Package Ecosystem:** 15 packages including @tachui/grid, @tachui/responsive, @tachui/effects
- **Testing:** We're doing extensive dogfooding with tachUI now as we build out apps to test it from (hopefully) end to end
- **Documentation:** Documentation is there and pretty extensive, but disheveled and somewhat inconsistent, as the restructure winds down, this is our next major task.
- **Impact:** All of this means you can have a great impact if you have feedback now!

### Perfect for Alpha Testing

This alpha is ideal for:

- **SwiftUI developers** exploring web development
- **Early adopters** who want cutting-edge frameworks
- **Performance-focused teams** building fast web applications
- **Contributors** interested in shaping tachUI's future

---

## Quick Start

### Installation

```bash
npm install @tachui/core@0.8.0-alpha
# or
pnpm add @tachui/core@0.8.0-alpha
```

### Your First Component

```typescript
import { Text, Button, VStack, createSignal } from '@tachui/core'

// Create reactive state
const [count, setCount] = createSignal(0)

// Build SwiftUI-style components
const counterApp = VStack({
  children: [
    Text(() => `Count: ${count()}`)
      .modifier.fontSize(24)
      .fontWeight('bold')
      .foregroundColor('#007AFF')
      .build(),

    Button('Increment', () => setCount(count() + 1))
      .modifier.backgroundColor('#007AFF')
      .foregroundColor('white')
      .padding({ horizontal: 24, vertical: 12 })
      .cornerRadius(8)
      .build(),
  ],
  spacing: 16,
  alignment: 'center',
})
```

---

## Framework Architecture

### SwiftUI-Inspired Components

All the familiar SwiftUI components, optimized for web:

#### **Layout Components**

- **VStack, HStack, ZStack** - Flexible layout containers
- **Grid, LazyVGrid, LazyHGrid** - Advanced grid systems
- **ScrollView** - Scrollable content containers with pull-to-refresh
- **Spacer** - Flexible space distribution

#### **Content & Input**

- **Text** - Typography with reactive content and formatting
- **Image** - Progressive loading with content modes
- **Button** - Interactive buttons with states and variants
- **BasicInput** - Text input with validation support
- **Toggle** - Switch controls with reactive binding

#### **Advanced Controls** _(via plugins)_

- **TextField, Slider, Stepper, DatePicker** - Advanced form controls (`@tachui/forms`)
- **NavigationView, NavigationLink, TabView** - Navigation system (`@tachui/navigation`)
- **Alert, ActionSheet** - Mobile-first patterns (`@tachui/mobile-patterns`)
- **Symbol** - Icon system with Lucide integration (`@tachui/symbols`)

#### **Data & Logic**

- **List, ForEach, Section** - Dynamic content rendering
- **Show, Unless, When** - Conditional rendering
- **Form** - Form containers with validation

### SwiftUI Modifier System

Chain modifiers just like SwiftUI:

```typescript
Text('Hello tachUI')
  .modifier.fontSize(18)
  .fontWeight('semibold')
  .foregroundColor('#007AFF')
  .padding(16)
  .backgroundColor('#f0f8ff')
  .cornerRadius(12)
  .shadow({ x: 0, y: 2, radius: 4, color: 'rgba(0,122,255,0.2)' })
  .onTap(() => console.log('Tapped!'))
  .build()
```

**Available Modifiers:**

- **Layout:** `.frame()`, `.padding()`, `.margin()`, `.position()`
- **Appearance:** `.foregroundColor()`, `.backgroundColor()`, `.font()`, `.cornerRadius()`
- **Visual Effects:** `.shadow()`, `.opacity()`, `.clipShape()`, `.backdrop()`
- **Interactions:** `.onTap()`, `.onHover()`, `.disabled()`, `.cursor()`
- **Responsive:** `.responsive()` - breakpoint-based styling

---

### Demonstration Applications

These applications are coming and will be available in a separate repository

- **Calculator App:** Feature-complete calculator
- **Marketing Site:** Responsive intro application

### Framework Packages

**Foundation:**

- **@tachui/core** - Reactive system, modifiers, validation
- **@tachui/primitives** - VStack, HStack, Text, Button, Image, etc.
- **@tachui/modifiers** - 150+ chainable modifiers
- **@tachui/flow-control** - Show, ForEach, conditional rendering

**Advanced Features:**

- **@tachui/forms** - Advanced form components and validation
- **@tachui/navigation** - NavigationView, TabView, routing
- **@tachui/grid** - CSS Grid integration with responsive design
- **@tachui/responsive** - Breakpoint system and responsive utilities
- **@tachui/effects** - Visual effects and filters
- **@tachui/symbols** - Icon system with Lucide integration
- **@tachui/mobile** - Mobile UI patterns (ActionSheet, Alert, ScrollView)
- **@tachui/viewport** - Window and viewport management
- **@tachui/data** - Data display and organization components

**Developer Tools:**

- **@tachui/devtools** - Development utilities and debugging
- **@tachui/cli** - Developer tooling and scaffolding

### Reactivity Performance

tachUI's fine-grained reactivity provides:

- **Surgical DOM updates** - Only affected elements re-render
- **Automatic dependency tracking** - No manual effect management
- **Memory-safe cleanup** - WeakMap-based automatic cleanup
- **Sub-millisecond updates** - Direct DOM manipulation

---

## Development & Contribution

### Getting Started as a Contributor

```bash
# Clone and setup
git clone https://github.com/tach-UI/tachUI.git
cd tachUI

# Install dependencies
pnpm install

# Start development
pnpm dev:core           # Core framework development

# Build everything
pnpm build

# Run tests
pnpm test
```

### Project Structure

```
├── docs/
│   ├── api/               # TypeDoc API documentation destination
│   ├── guide/             # VitePress documentation site
│   └── reference/         # Additional reference documentation
├── packages/
│   ├── core/              # Core framework (reactivity, state management, validation)
│   ├── primitives/        # Foundation UI components (VStack, HStack, Text, Button, Image)
│   ├── modifiers/         # 150+ chainable SwiftUI-style modifiers
│   ├── flow-control/      # Conditional rendering (Show, ForEach, Unless, When)
│   ├── effects/           # Visual effects and filters
│   ├── forms/             # Advanced form components and validation
│   ├── navigation/        # NavigationView, TabView, and routing utilities
│   ├── grid/              # CSS Grid integration with responsive design
│   ├── responsive/        # Breakpoint system and responsive utilities
│   ├── symbols/           # Icon system with Lucide integration
│   ├── mobile/            # Mobile UI patterns (ActionSheet, Alert, ScrollView)
│   ├── viewport/          # Window and viewport management
│   ├── data/              # Data display and organization components
│   ├── devtools/          # Development utilities and debugging
│   └── cli/               # Developer tooling and scaffolding
```

### Contributing Areas

We welcome contributions in:

#### **Component Development** (Beginner-friendly)

- Expand SwiftUI component library
- Add missing SwiftUI modifiers
- Improve accessibility and keyboard navigation

#### **Performance & Bundle Optimization** (Intermediate)

- Reduce bundle sizes through better tree-shaking
- Implement code-splitting for validation layers
- Optimize reactive system performance

#### **Documentation & Examples** (All levels)

- Interactive component examples
- Migration guides from React/Vue
- Video tutorials and walkthroughs

#### **Advanced Features** (Advanced)

- Animation system integration
- Advanced state management patterns
- Developer tooling and browser extensions

---

## Roadmap

Much of this is obviously TBD based on community feedback and reception.

### **Previous Release: 0.7.\*-alpha**

- **55+ SwiftUI components** across core + plugin packages
- **Plugin architecture** with modular design (forms, navigation, symbols, mobile)
- **Production demonstration applications** (Calculator + Marketing site)
- **TypeScript-first developer experience** with complete type safety

### **Current Release: 0.8.\*-alpha**

- ☑️ **Bundle size optimization** - Production-ready bundle sizes
- ☑️ **Advanced state management** - Complete @State, @Binding, @ObservedObject, and @EnvironmentObject patterns
- **Enhanced documentation** - Complete API documentation
- **Compile-time Concatenation** - Moving concatenation code to compile time for bundle optimizing
- ☑️ **Developer tooling** - CLI Improvement coming, but devtools are now split out for a more useful design

### **Beta Release**

- **Animation system** - Web Animations API integration
- **Enterprise features** - Advanced testing and monitoring tools
- **Community ecosystem** - Third-party plugins and components
- **Performance benchmarks** - Comparative performance data

### **1.0 Release**

- **Primary SwiftUI parity** - All common SwiftUI patterns
- **Swift ↔️ tachUI** - Augmented conversion tooling allowing for easy transition
- **Cross-platform capabilities** - Mobile app development patterns (if wanted)
- **Design tools integration** - Visual component builders
- **Stable public API** - Production-ready for large applications

---

## Learning Resources

### Documentation

- **[Getting Started Guide](apps/docs/guide/getting-started.md)** - Your first tachUI application
- **[Component Reference](apps/docs/components/index.md)** - Complete component documentation
- **[SwiftUI Migration](apps/docs/guide/swiftui-compatibility.md)** - Transition from SwiftUI
- **[API Documentation](apps/docs/api/index.md)** - Detailed API reference

### Examples

- **[Calculator App](apps/calculator/)** - Production-ready calculator with themes
- **[Component Examples](apps/examples/)** - Interactive component demonstrations
- **[Real-world Patterns](apps/examples/working-demos/)** - Common application patterns

---

## Community & Support

### Join the tachUI Community

- **GitHub Issues:** Report bugs and request features
- **GitHub Discussions:** Ask questions and share ideas
- **Pull Requests:** Contribute code and improvements
- **Discord:** _Coming soon_ - Real-time community chat

### Getting Help

1. **Check Documentation** - Comprehensive guides in `apps/docs/`
2. **Browse Examples** - Working examples in `apps/examples/`
3. **Report Issues** - GitHub issues with reproduction cases
4. **Join Discussions** - Ask questions in GitHub Discussions

---

## License

**Mozilla Public License 2.0** - see [LICENSE](./LICENSE) for details.

The MPL-2.0 license allows you to use tachUI in both open source and commercial projects while ensuring improvements to the framework itself remain open source.

---

## Acknowledgments

tachUI is inspired by and builds upon:

- **[SwiftUI](https://developer.apple.com/xcode/swiftui/)** - Apple's revolutionary declarative UI framework
- **[SolidJS](https://www.solidjs.com/)** - Fine-grained reactivity that inspired our reactive system
- **[React](https://react.dev/)** - Component patterns and developer experience innovations
- **[Vue](https://vuejs.org/)** - Build tooling and developer experience patterns

Special thanks to the open source community for continuous inspiration and feedback.

---

## Ready to Build with SwiftUI on the Web?

```bash
# Install tachUI Alpha
npm install @tachui/core@0.8.0-alpha

# Create your first SwiftUI-style component
import { createSignal } from '@tachui/core'
import { VStack, Text, Button } from '@tachui/primitives'

# Start building! 🎉
```

**tachUI 0.8.0-alpha** - Modular architecture meets SwiftUI-inspired web development.

[![Get Started](https://img.shields.io/badge/Get%20Started-Documentation-blue?style=for-the-badge)](./apps/docs/guide/getting-started.md) [![View Examples](https://img.shields.io/badge/View%20Examples-Live%20Demos-green?style=for-the-badge)](./apps/examples/) [![Join Community](https://img.shields.io/badge/Contribute-GitHub-purple?style=for-the-badge)](https://github.com/tach-UI/tachUI)
