---
cssclasses:
  - full-page
---

# tachUI Framework
A SwiftUI-inspired web framework with complete project structure and production-ready applications

## Important Guidelines
- ALL instructions within this document MUST BE FOLLOWED
- Be brutally honest and direct
- ASK FOR CLARIFICATION if uncertain about anything
- DO NOT edit more code than necessary
- DO NOT WASTE TOKENS
- Do not run dev servers, as the user to
- `pnpm build` must work after every completion
- ALWAYS ask before removing any tests
- Maintain 95%+ test coverage
- Work through issues, not around them unless told otherwise
- The term "SwiftUI" may be used in comments and documentation, but NOT in code or filenames
- Please limit your use of Emojis

## Coding Standards
- Check for existing implementations before writing new code
- Use meaningful variable and function names
- All new code requires passing tests in `__tests__` directories
- Framework code must have appropriate documentation in `apps/docs/`
- Documentation examples must use TypeScript with proper type annotations
- Documentation should be developer-friendly and easy to understand

## Key Locations
- **Design Documents:** /Users/whoughton/Dev/tach-ui/design
- **tachUI Framework:** /Users/whoughton/Dev/tach-ui/tachUI/packages
- **tachUI first-party Plugins:** /Users/whoughton/Dev/tach-ui/tachUI
- **tachUI Demos:** /Users/whoughton/Dev/tach-ui/demos

## Architecture Overview
- **Core Framework** (`@tachui/core`) - Reactive system, components, modifiers, runtime
- **Plugin System** - Forms, navigation, symbols, mobile patterns as separate packages
- **CLI Tool** (`@tachui/cli`) - Developer tools and scaffolding
- **Documentation** - Comprehensive framework documentation and examples

## Development Environment
- **Monorepo** with pnpm workspaces
- **TypeScript** 5.8+ with strict configuration
- **Vite** 7.1.1 for building and development
- **Vitest** 3.2.4 for testing (~29s test runs)
- **pnpm** 10.14.0 for package management
- **GitHub Actions** CI/CD with security scanning and performance monitoring

## Repository Structure

```
├── /Users/whoughton/Dev/tach-ui/              Main framework repository
│   ├── tachUI/                               Core framework packages
│   │   ├── packages/
│   │   │   ├── core/                         Core framework (reactive system, components)
│   │   │   ├── primitives/                   Foundation UI components (VStack, HStack, Text)
│   │   │   ├── modifiers/                    200+ chainable SwiftUI-style modifiers
│   │   │   ├── flow-control/                 Conditional rendering (Show, ForEach, Unless)
│   │   │   ├── data/                         Data display components (List, Menu)
│   │   │   ├── effects/                      Visual effects and transforms
│   │   │   ├── grid/                         CSS Grid layout system
│   │   │   ├── responsive/                   Breakpoint system and responsive utilities
│   │   │   ├── forms/                        Form components and validation
│   │   │   ├── navigation/                   Navigation system (NavigationStack, TabView)
│   │   │   ├── mobile/                       Mobile UI patterns (ActionSheet, Alert)
│   │   │   ├── viewport/                     Window and viewport management
│   │   │   ├── symbols/                      Icon system with Lucide integration
│   │   │   ├── devtools/                     Development utilities and debugging
│   │   │   ├── cli/                          Developer tooling and scaffolding
│   │   │   └── ai-training/                  AI training data and patterns
│   ├── design/                               Design documents and specifications
│   │   ├── _completed/                       Completed design documents
│   │   ├── _archived/                        Archived design documents
│   │   ├── marketing/                        Marketing content and strategies
│   │   └── visual/                           Visual assets and branding
│   └── CLAUDE.md                            This configuration file
├── /Users/whoughton/Dev/tach-ui/demos/       Demo applications
│   ├── calculator/                           Production calculator app
│   └── intro/                                Marketing/intro website
```

## 🎯 Development Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev:core           # Core framework development
pnpm dev:docs           # Documentation development
pnpm dev:cli            # CLI development
pnpm dev:navigation     # Navigation package development
pnpm dev:symbols        # Symbols package development

# Testing and validation
pnpm test              # Full test suite (170 test files)
pnpm test:ci           # CI-specific test configuration
pnpm lint              # Oxlint code quality checks
pnpm type-check        # TypeScript validation
pnpm test:memory-leaks # Memory leak detection

# Building
pnpm build             # Build all packages
pnpm build:core        # Build core framework only
pnpm build:forms       # Build forms package
pnpm build:navigation  # Build navigation package
pnpm build:symbols     # Build symbols package

# Documentation
pnpm docs:dev          # Start documentation dev server
pnpm docs:build        # Build documentation
pnpm docs:api          # Generate API documentation

# Benchmarking
pnpm benchmark:quick   # Quick performance benchmarks
pnpm benchmark         # Full performance analysis
pnpm benchmark:navigation # Navigation-specific benchmarks
```

**Framework Maturity:**
- **Components**: 26+ complete SwiftUI components implemented
- **Test Coverage**: 170 test files, 3,906 passing tests, 95%+ coverage
- **Bundle Size**: Core framework 30.3KB (optimized from 60KB baseline)
- **Performance**: Optimized reactive system, <5% overhead validation
- **Security**: Comprehensive security scanning integrated into CI
- **Memory Management**: Leak detection and monitoring systems in place

**Framework Documentation:**
- **VitePress Documentation**: Comprehensive guides, API reference, and examples
- **Interactive Examples**: Component demos and real-world usage patterns

**Developer Experience:**
- **Modern tooling**: Latest Vite, Vitest, TypeScript, pnpm
- **Comprehensive documentation**: API docs, guides, examples
- **CLI tooling**: Code generation, analysis, migration utilities
- **Modular architecture**: Foundation packages extracted and optimized

#### **Current First-Party Plugins**

**Core Framework:**
- **@tachui/core** - Reactive system, components, modifiers, runtime
- **@tachui/primitives** - Foundation UI components (VStack, HStack, Text, Button)
- **@tachui/modifiers** - 200+ chainable SwiftUI-style modifiers
- **@tachui/flow-control** - Conditional rendering (Show, ForEach, Unless, When)

**Foundation Packages:**
- **@tachui/data** - Data display components (List, Menu components)
- **@tachui/modifiers/effects** - Visual effects, transforms, filters, and backdrop effects
- **@tachui/grid** - CSS Grid layout system with responsive design
- **@tachui/responsive** - Breakpoint system and responsive utilities

**Form & Input:**
- **@tachui/forms** - Form components and validation

**Navigation & UI Patterns:**
- **@tachui/navigation** - Navigation system (NavigationStack, TabView, routing)
- **@tachui/mobile** - Mobile UI patterns (ActionSheet, Alert, ScrollView)
- **@tachui/viewport** - Window and viewport management

**Developer Tools:**
- **@tachui/symbols** - Icon system with Lucide integration and custom symbol support
- **@tachui/devtools** - Development utilities and debugging
- **@tachui/cli** - Developer tooling and scaffolding
- **@tachui/ai-training** - AI training data and patterns for GitHub Copilot/ChatGPT

#### **Modifier System (Complete - 200+ modifiers)**
- **Layout**: `.padding()`, `.margin()`, `.size()`, `.flexbox()`
- **Appearance**: `.backgroundColor()`, `.border()`, `.cornerRadius()`
- **Typography**: `.font()`, `.fontSize()`, `.textAlign()`, `.fontWeight()`
- **Transform**: `.scale()`, `.rotate()`, `.translate()`, `.transform()`
- **Effects**: `.shadow()`, `.blur()`, `.filter()`, visual effects
- **All modifiers**: Extracted to @tachui/modifiers with backwards compatibility

### **Medium-term Goals (2-6 months)**

#### **Navigation Enhancement (High Priority)**
1. **Sheet/Modal Presentation System** - `.sheet()`, `.fullScreenCover()`, `.popover()` modifiers
2. **NavigationSplitView** - Three-column navigation for desktop/tablet applications
3. **Enhanced Search Integration** - `.searchable()` modifier with suggestions
4. **Advanced Toolbar System** - Extended toolbar placement and customization

#### **Developer Experience Enhancement**
1. **Tacho CLI Foundation** - AI-powered development tools and scaffolding
2. **AI Training Data** - Comprehensive patterns for GitHub Copilot and ChatGPT
3. **Performance-First DX** - Real-time performance monitoring and optimization
4. **Error Experience** - Intelligent error messages with AI-powered fix suggestions

#### **Advanced Features**
1. **Missing SwiftUI modifiers** - Complete remaining 15% for full parity
2. **Advanced layout components** - LazyVGrid, LazyHGrid, DisclosureGroup
3. **Gesture system** - Enhanced touch and drag interactions

### **Long-term Vision (6+ months)**

#### **AI-First Ecosystem**
1. **Tacho CLI Ecosystem** - Complete AI-powered development platform
2. **AI Training Optimization** - 95%+ accuracy for AI coding assistants
3. **Community AI Training** - Developer-contributed patterns and examples
4. **Performance AI** - Automated optimization suggestions and fixes

#### **Ecosystem Expansion**
1. **TachCharts** - Comprehensive charting library
2. **Enterprise patterns** - Advanced components for business applications
3. **Mobile optimizations** - Enhanced mobile-first development patterns
4. **SSR/Static generation** - Server-side rendering capabilities

#### **Community & Adoption**
1. **Open source preparation** - License, contribution guidelines, community tools
2. **Performance benchmarking** - Industry-standard performance comparisons
3. **Integration guides** - React, Vue, vanilla JS integration patterns
4. **Cross-platform knowledge transfer** - iOS developers to web development

## 🛠 **Architecture Decisions**

### **Plugin Architecture Benefits**
- **Bundle efficiency**: Core apps can be 60KB vs 150KB+ with all plugins
- **Incremental adoption**: Developers add only needed functionality
- **Maintainability**: Clear separation of concerns and dependencies
- **Performance**: Tree-shaking eliminates unused code automatically

### **Modern Tooling Choices**
- **Vite 7.1.1**: Latest performance improvements and crypto.hash support
- **Vitest 3.2.4**: Coordinated testing framework with excellent TypeScript support
- **pnpm 10.14.0**: Superior monorepo performance and dependency management
- **TypeScript 5.8+**: Latest language features and strictness options

### **Security & Performance**
- **Automated scanning**: Security vulnerabilities detected in CI pipeline
- **Memory monitoring**: Leak detection prevents production memory issues
- **Performance tracking**: Regression detection and benchmark integration
- **Bundle monitoring**: Size tracking prevents unexpected bloat

## 📊 **Quality Metrics**

**Test Coverage**: 95%+ maintained across all packages (3,687 tests, 177 files)
**Build Success**: All 16 packages building consistently  
**Bundle Sizes**: Core ~16KB, Foundation packages extracted (@tachui/modifiers 77KB)
**Performance**: <5% framework overhead, 60fps target maintained, benchmarks operational
**Security**: Zero high-severity vulnerabilities, automated scanning
**Memory**: No detected leaks, comprehensive monitoring validated

## 🎯 **Success Criteria for 1.0 Release**

1. **✅ Foundation architecture complete** - Phase 1 modular packages extracted
2. **🔄 Navigation enhancement complete** - Sheet/modal system, NavigationSplitView (Phase 2)
3. **🔄 Data & Grid extraction complete** - All components properly categorized
4. **✅ Demo applications completed** - Calculator and intro apps in `/Users/whoughton/Dev/tach-ui/demos/`
5. **🔄 Tacho CLI foundation** - AI-powered development tools and scaffolding
6. **🔄 Performance validation** - Benchmarks meet production standards
7. **🔄 AI integration complete** - GitHub Copilot and ChatGPT training data
8. **🔄 Documentation overhaul** - Complete API docs, guides, migration paths

## 📋 **CURRENT TODOS**

### Recently Completed (September 5, 2025)
- ✅ **Navigation Plugin Enhancement Analysis** - COMPLETED (September 5, 2025)
  - Comprehensive analysis of SwiftUI navigation gaps (75% coverage identified)
  - Prioritized sheet/modal presentation system as next high-impact feature
  - NavigationSplitView identified as critical for desktop/tablet applications
- ✅ **CLAUDE.md Update** - COMPLETED (September 5, 2025)
  - Updated repository structure with accurate directory locations
  - Documented all current first-party plugins and their locations
  - Updated goals based on design documents in `/Users/whoughton/Dev/tach-ui/design/`
- ✅ **Demo Applications Inventory** - COMPLETED (September 5, 2025)
  - Calculator app: Production-ready calculator with themes and tape functionality
  - Intro website: Marketing/intro application with modular design showcase

### Current Status (September 5, 2025)
🎉 **FRAMEWORK INFRASTRUCTURE FULLY OPERATIONAL**
- **Test Suite**: 3,687 tests passing across 177 files (~34s runtime)
- **Build System**: All 15 packages building successfully with proper dependency order
- **Code Quality**: 0 lint errors, all type checks passing
- **Active Packages**: All 15 packages (core, primitives, modifiers, flow-control, data, effects, grid, responsive, forms, navigation, mobile, viewport, symbols, devtools, cli, ai-training) operational
- **Demo Applications**: Calculator and intro website available in `/Users/whoughton/Dev/tach-ui/demos/`

### Next Phase Priorities (Phase 2 Development)

#### **Immediate Focus: Navigation Enhancement**
1. **Sheet/Modal Presentation System** - High priority, essential for modern UX
2. **NavigationSplitView Implementation** - Critical for desktop/tablet applications
3. **Enhanced Search Integration** - Common navigation requirement

#### **Developer Experience Foundation**
1. **Tacho CLI Development** - AI-powered development tools
2. **AI Training Data Creation** - Patterns for GitHub Copilot and ChatGPT
3. **Performance Monitoring Integration** - Real-time optimization feedback

#### **Documentation & Examples**
1. **Design Document Review** - Review completed designs in `/Users/whoughton/Dev/tach-ui/design/_completed/`
2. **Demo Application Enhancement** - Expand calculator and intro applications
3. **Migration Guides** - React/Vue to tachUI conversion documentation

