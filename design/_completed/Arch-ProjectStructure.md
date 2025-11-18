---
cssclasses:
  - full-page
---

# tachUI Unified Project Structure

## 🚀 **PHASE 2 WEEK 5 COMPLETE** - August 31, 2025

**Status**: Phase 2 Week 5 Grid Extraction - **✅ COMPLETE**  
**Latest Achievement**: @tachui/grid package successfully extracted with grid-specific modifiers  
**Current Bundle**: Core index.js = 19.3KB (68% reduction) + @tachui/modifiers = 26.5KB + @tachui/grid = TBD  
**Architecture Success**: Essential modifiers in core, clean package separation, no circular dependencies  
**Current Work**: Week 6 - Test migration for modular architecture (85% → 95% target)  
**Next Milestone**: Week 7-8 - Forms unification (52KB savings)  

## Overview

tachUI is currently at version 0.7.1-alpha with a comprehensive SwiftUI-inspired web framework. This document defines the recommended project structure for the 1.0 release, based on analysis of the current 58 components, 200+ modifiers, and plugin architecture optimization opportunities.

**This restructuring is actively being implemented with a proven incremental migration approach that maintains backwards compatibility and test suite integrity.**

## Strategic Goals

1. **Minimal Core Bundle**: Reduce base framework from 60KB to 19.3KB (✅ 68% reduction achieved)
2. **Semantic Packaging**: Group related functionality for better tree-shaking
3. **Developer Experience**: Intuitive package boundaries aligned with use cases
4. **Performance**: Optimal bundle sizes through granular plugin architecture
5. **Maintainability**: Clear separation of concerns and dependencies

## Recommended Package Structure

Based on analysis of components.md, modifiers.md, and Arch-PluginSplit.md, the following structure optimizes for both bundle size and developer experience:

**[@tachui/core](./plugins/Core.md)** - Reactive engine, runtime, essential modifiers (19.3KB) *[restructured]*

### 1.0 Release Plugins

#### Core Foundation (Week 1-2)
- ~~**[@tachui/primitives](./plugins/Primitives.md)** - Basic UI components and controls (45KB) *[restructured]*~~
- **[@tachui/modifiers](./plugins/Modifiers.md)** - Comprehensive modifier system (26.5KB) *[restructured]*
- ~~**[@tachui/flow-control](./plugins/FlowControl.md)** - Conditional rendering and iteration (5.5KB) *[restructured]*~~

#### Essential Features (Week 2-4)
- ~~**[@tachui/forms](./plugins/Forms.md)** - Complete form system (120KB) *[unified]*~~
- ~~**[@tachui/data](./plugins/Data.md)** - Data display and organization (25KB) *[restructured]*~~
- ~~**[@tachui/navigation](./plugins/Navigation.md)** - Navigation patterns and routing (46KB) *[existing]*~~
- ~~**[@tachui/mobile](./plugins/Mobile.md)** - Mobile-specific UI patterns (45KB) *[existing]*~~
- ~~**[@tachui/symbols](./plugins/Symbols.md)** - Icon system with Lucide integration (variable) *[existing]*~~

#### Advanced Features (Week 5-8)
- ~~**[@tachui/grid](./plugins/Grid.md)** - CSS Grid system and advanced layouts (TBD KB) *[restructured]*~~

#### Future Features (Week 8+)
- ~~<font color="#c00000">**[@tachui/grid](./plugins/Grid.md)** - Complete CSS Grid system (30KB) *[extracted from core]*</font>~~
- ~~**[@tachui/effects](./plugins/Effects.md)** - Advanced visual effects and animations (150KB) *[extracted from core]*~~
- ~~**[@tachui/responsive](./plugins/Responsive.md)** - Advanced responsive patterns (120KB) *[extracted from core]~~*
- ~~**[@tachui/viewport](./plugins/Viewport.md)** - Platform detection and adaptation (80KB) *[extracted from core]*~~

#### Developer Tools
- ~~**[@tachui/dev-tools](./plugins/DevTools.md)** - Development and debugging utilities (380KB) *[extracted from core]*~~
- **[@tachui/cli](./plugins/CLI.md)** - Command-line interface and build tools *[existing]*

### Post-1.0 Roadmap Plugins

#### High Priority Extensions (1.1-1.2)
- **[@tachui/charts](./plugins/TachCharts.md)** - Comprehensive charting and data visualization library *[Epic-SanPablo]*
  - **Value**: High demand feature, significant competitive advantage
  - **Complexity**: Medium-High (chart rendering, data binding, interactions)
  - **Timeline**: 6-8 weeks post-1.0

- **[@tachui/desktop](./plugins/Desktop.md)** - Desktop-optimized UI patterns and behaviors *[Epic-Horizon]*
  - **Value**: Expands platform coverage, professional applications
  - **Complexity**: Medium (viewport detection, desktop patterns)
  - **Timeline**: 4-6 weeks post-1.0

#### Advanced Features (1.2-1.3)
- **[@tachui/canvas](./plugins/Canvas.md)** - Canvas-based drawing and graphics support *[Epic-Catamount]*
  - **Value**: Enables creative applications, unique positioning
  - **Complexity**: High (canvas API, performance, interactions)
  - **Timeline**: 8-10 weeks post-1.0

- **[@tachui/media-queries](./plugins/MediaQueries.md)** - Hybrid media queries and advanced responsive *[Epic-Windham]*
  - **Value**: Performance optimization, advanced responsive design
  - **Complexity**: High (CSS generation, performance optimization)
  - **Timeline**: 6-8 weeks post-1.0

#### Specialized Tools (1.3+)
- **[@tachui/code](./plugins/Code.md)** - Code display and editing components *[Enh-CodeComponent]*
  - **Value**: Developer-focused applications, documentation tools
  - **Complexity**: Medium (syntax highlighting, editing features)
  - **Timeline**: 4-6 weeks post-1.0

## Implementation Timeline & Current Status

### Phase 1: Foundation (Week 1-4) 🚀 **CRITICAL PATH** - **✅ COMPLETE**
**Dependencies**: Core → Primitives → All other packages

#### ✅ **COMPLETED (August 31, 2025)**
- **Package Structure Created**: @tachui/primitives, @tachui/modifiers, @tachui/flow-control
- **Flow Control Extraction**: Show and ForEach components moved to @tachui/flow-control
- **Primitives Package Complete**: All 13 primitive components extracted to @tachui/primitives
  - ✅ Layout: Spacer, Divider, VStack, HStack, ZStack
  - ✅ Display: Text, Image, HTML (+ H1-H6)
  - ✅ Controls: Button, Link, Toggle, Picker
  - ✅ Forms: BasicForm, BasicInput
- **@tachui/modifiers Package Complete**: All 200+ modifiers extracted successfully
  - ✅ Basic modifiers: PaddingModifier, MarginModifier, SizeModifier
  - ✅ Appearance modifiers: BackgroundModifier, BorderModifier, CornerRadiusModifier
  - ✅ Typography modifiers: TypographyModifier with all font/text functions
  - ✅ Transform modifiers: TransformModifier with 2D/3D transformations
  - ✅ Effects modifiers: ShadowModifier, FilterModifier with visual effects
  - ✅ TypeScript configuration and build pipeline working
  - ✅ Backwards compatibility layer active (modifiers-compat.ts)
- **Quality Assurance**: pnpm type-check clean, all 3,906 tests passing
- **Foundation Established**: Safe incremental migration approach proven at scale
- **Bundle Baseline**: Core index.js = 30.3KB (ready for optimization measurement)

#### ✅ **COMPLETED**  
1. **Week 2**: [@tachui/modifiers](./plugins/Modifiers.md) extraction - **100% Complete**
   - ✅ **DONE**: Package infrastructure and build system
   - ✅ **DONE**: Basic spacing modifiers (padding, margin, size)
   - ✅ **DONE**: Appearance modifiers (background, border, corner radius)
   - ✅ **DONE**: Typography modifiers (font, text styling, alignment)
   - ✅ **DONE**: Transform modifiers (rotation, scale, translation)
   - ✅ **DONE**: Effects modifiers (shadows, filters, blur)
   - ✅ **DONE**: Backwards compatibility layer established
   - ✅ **DONE**: All 3,906 tests passing after extraction

#### ✅ **COMPLETED**
2. **Week 3**: [@tachui/forms](./plugins/Forms.md) unification - **COMPLETE**
   - ✅ **DONE**: Package structure and build system (5KB baseline bundle)
   - ✅ **DONE**: Comprehensive analysis showing 40% bundle reduction opportunity
   - ✅ **DONE**: TextField component system migrated (14 text input components)
   - ✅ **DONE**: Selection components migrated (8 components: Checkbox, Radio, Select, etc.)
   - ✅ **DONE**: Advanced components migrated (DatePicker, Stepper, Slider)
   - ✅ **DONE**: Complete validation system migrated (20+ built-in rules)
   - ✅ **DONE**: State management and formatters migrated
   - ✅ **DONE**: Bundle size reduced to 98KB (65KB reduction = 40% savings achieved)

### Phase 2: Feature Completion (Week 3-6)
3. **Week 4**: [@tachui/data](./plugins/Data.md) extraction - **✅ COMPLETE**
   - ✅ @tachui/data package created (35.88KB bundle: List 13.93KB + Menu 14.24KB + Section 7.21KB)
   - ✅ Circular dependency resolved by removing ForEach duplication and using @tachui/flow-control
   - ✅ List/Menu/Section components successfully extracted with proper dependencies
   - ✅ All tests passing: Core 124 files (2,568 tests) + Data 3 files (104 tests)
   - ✅ Clean one-way architecture: @tachui/data → @tachui/core + @tachui/flow-control

4. **Week 5**: [@tachui/grid](./plugins/Grid.md) extraction - **✅ COMPLETE**
   - ✅ @tachui/grid package created with Grid, GridResponsive, LazyVGrid, LazyHGrid components
   - ✅ Grid tests moved to @tachui/grid package (170+ tests including animations & accessibility)
   - ✅ Clean one-way dependency: @tachui/grid → @tachui/core
   - ✅ Bundle optimization: Grid system extracted for optional inclusion

5. **Week 6**: [@tachui/responsive](./plugins/Responsive.md) creation
   - Advanced responsive patterns (120KB)
   - Container queries and performance utilities

6. **Week 7**: [@tachui/viewport](./plugins/Viewport.md) + [@tachui/dev-tools](./plugins/DevTools.md)
   - Platform detection and development utilities
   - Final optimizations and testing

### Phase 3: Post-1.0 Extensions (1.1-1.3)
**Prioritized by business value and market demand**

**1.1 Release (High-Impact Extensions)**
- [@tachui/charts](./plugins/TachCharts.md) - Data visualization library
- [@tachui/desktop](./plugins/Desktop.md) - Desktop UI patterns

**1.2 Release (Advanced Features)**
- [@tachui/canvas](./plugins/Canvas.md) - Graphics and drawing
- [@tachui/media-queries](./plugins/MediaQueries.md) - Advanced responsive

**1.3 Release (Specialized Tools)**
- [@tachui/code](./plugins/Code.md) - Code components and editing

## Success Metrics & Current Progress

### Bundle Size Optimization
- **Current Total**: ~410KB (all current packages)
- **1.0 Target**: ~361KB (12% reduction)
- **Core Reduction**: 60KB → 30KB (50% reduction)  
- **Forms Optimization**: 172KB → 120KB (30% reduction)

### Quality Standards - **✅ CURRENT STATUS**
- ✅ **All tests passing** (170 test files, **3,906 tests** - August 30, 2025)
- ✅ **Zero breaking changes** maintained during restructuring
- ✅ **Backwards compatibility** working via re-export layer
- 🔄 **Bundle size targets** - in progress, measurement pending
- 🔄 **Tree-shaking verification** - pending package completion
- ✅ **Performance benchmarks maintained** (6/6 benchmarks passing)

### Restructuring Progress (August 31, 2025)
- ✅ **Package Architecture**: New package structure established
- ✅ **Flow Control Migration**: @tachui/flow-control extracted and working
- ✅ **Primitives Migration**: @tachui/primitives complete with all 13 components
- ✅ **Modifier Migration**: @tachui/modifiers complete with 200+ modifiers extracted
- 🔄 **Forms Unification In Progress**: @tachui/forms package structure created, component migration pending
- ✅ **Test Suite Integrity**: All tests passing with fully restructured architecture
- ✅ **Development Workflow**: Safe incremental migration approach proven at scale
- ✅ **Foundation Packages**: @tachui/primitives, @tachui/modifiers, @tachui/flow-control, @tachui/forms
- 🎯 **Bundle Optimization**: 488KB → 390KB forms consolidation target (pending component migration)
- 🎯 **Phase 3 Ready**: Data package extraction next for continued optimization

### Application Bundle Examples

**Minimal Application** (Core + Primitives)
```json
{
  "dependencies": {
    "@tachui/core": "^1.0.0",      // 30KB
    "@tachui/primitives": "^1.0.0"  // 45KB
  }
}
// Total: 75KB (includes all basic components)
```

**Basic Interactive Application**
```json
{
  "dependencies": {
    "@tachui/core": "^1.0.0",       // 30KB
    "@tachui/primitives": "^1.0.0",  // 45KB
    "@tachui/modifiers": "^1.0.0"    // 45KB
  }
}
// Total: 120KB
```

**Form-Heavy Application**
```json
{
  "dependencies": {
    "@tachui/core": "^1.0.0",           // 30KB
    "@tachui/primitives": "^1.0.0",      // 45KB
    "@tachui/modifiers": "^1.0.0",       // 45KB
    "@tachui/forms": "^1.0.0",           // 120KB
    "@tachui/flow-control": "^1.0.0"     // 15KB
  }
}
// Total: 255KB (vs current 292KB with split forms)
```

**Full-Featured Application**
```json
{
  "dependencies": {
    "@tachui/core": "^1.0.0",           // 30KB
    "@tachui/primitives": "^1.0.0",      // 45KB
    "@tachui/modifiers": "^1.0.0",       // 45KB
    "@tachui/flow-control": "^1.0.0",    // 15KB
    "@tachui/data": "^1.0.0",            // 25KB
    "@tachui/forms": "^1.0.0",           // 120KB
    "@tachui/navigation": "^1.0.0",      // 46KB
    "@tachui/mobile": "^1.0.0",          // 45KB
    "@tachui/symbols": "^1.0.0"          // Variable
  },
  "devDependencies": {
    "@tachui/dev-tools": "^1.0.0",       // 0KB in production
    "@tachui/cli": "^1.0.0"              // Build tool only
  }
}
// Total: 371KB + symbols (current packages)
```

## Migration Strategy

### Backwards Compatibility
- **Temporary re-exports** in core maintain compatibility during migration
- **Deprecation warnings** guide developers to new import patterns
- **Automated migration tools** via @tachui/cli

### Risk Mitigation
- **Automated bundle size monitoring** prevents regression
- **Comprehensive test coverage** maintained throughout migration
- **Incremental rollout** with feature flags and rollback capability
- **Developer communication** via migration guides and documentation

## Technical Documentation

Each plugin has detailed technical implementation documentation:

### 1.0 Release Plugins
- [Core Infrastructure](./plugins/Core.md) - Reactive runtime and modifier system
- [UI Components](./plugins/Primitives.md) - Basic component migration strategy  
- [Styling System](./plugins/Modifiers.md) - Modifier extraction and organization
- [Flow Control](./plugins/FlowControl.md) - Conditional rendering components
- [Forms System](./plugins/Forms.md) - Package unification and validation
- [Data Display](./plugins/Data.md) - List, section, and menu components
- [Grid System](./plugins/Grid.md) - CSS Grid implementation
- [Visual Effects](./plugins/Effects.md) - Advanced modifiers and animations
- [Responsive Design](./plugins/Responsive.md) - Advanced responsive patterns
- [Platform Support](./plugins/Viewport.md) - Viewport and device detection
- [Developer Experience](./plugins/DevTools.md) - Development and debugging tools

### Post-1.0 Extensions
- [Data Visualization](./plugins/TachCharts.md) - Comprehensive charting library
- [Desktop Patterns](./plugins/Desktop.md) - Desktop-optimized UI components
- [Graphics Support](./plugins/Canvas.md) - Canvas-based drawing and graphics
- [Advanced Responsive](./plugins/MediaQueries.md) - Hybrid media query system
- [Code Components](./plugins/Code.md) - Syntax highlighting and editing

---

## 🛠 **Current Implementation Notes** (August 30, 2025)

### ✅ **Proven Migration Strategy**
- **Incremental Extraction**: Components moved one-by-one with immediate testing
- **Backwards Compatibility**: Re-export layer maintains existing APIs during transition  
- **Test-Driven Migration**: All 3,906 tests continue passing throughout restructuring
- **Zero Downtime**: Development can continue on applications during framework restructuring

### ✅ **Completed Work Stream**
```bash
# Primitive components extraction: COMPLETE
✅ Flow Control: Show, ForEach, When, Unless, For → @tachui/flow-control
✅ Layout: VStack, HStack, ZStack, Spacer, Divider → @tachui/primitives
✅ Display: Text, Image, HTML (+ H1-H6) → @tachui/primitives  
✅ Controls: Button, Link, Toggle, Picker → @tachui/primitives
✅ Forms: BasicForm, BasicInput → @tachui/primitives
```

### ✅ **Completed Work Stream**
```bash
# Modifier extraction to @tachui/modifiers: COMPLETE
✅ Layout Modifiers: padding, margin, frame, flexbox → @tachui/modifiers
✅ Appearance Modifiers: background, foreground, borders → @tachui/modifiers
✅ Typography Modifiers: font, text styling, alignment → @tachui/modifiers
✅ Transform Modifiers: rotation, scale, translation → @tachui/modifiers
✅ Effects Modifiers: shadow, blur, opacity, filters → @tachui/modifiers
```

### ✅ **Completed Work Stream**
```bash
# Forms unification to @tachui/forms: COMPLETE
✅ Package Analysis: 163KB → 98KB reduction achieved (65KB savings = 40% reduction)
✅ Unified Structure: 27 components across 5 modular categories created
✅ TextField Migration: 14 text input components migrated successfully
✅ Selection Components: 8 components migrated (Checkbox, Radio, Select, etc.)
✅ Advanced Components: 3 components migrated (DatePicker, Stepper, Slider)
✅ Validation System: Comprehensive validation engine with 20+ rules migrated
✅ State Management: Complete reactive form state system migrated
✅ Formatters & Parsers: All utility functions migrated
✅ Bundle Optimization: 40% size reduction validated and achieved
```

### ✅ **Successful Work Stream - Data Components Extracted**
```bash
# Data components extraction to @tachui/data: COMPLETE
✅ Package Creation: @tachui/data package created (35.88KB bundle)
✅ List Component: Enhanced List with virtual scrolling extracted (13.93KB)
✅ Menu Component: Dropdown and context menus extracted (14.24KB)
✅ Section Component: Content grouping extracted (7.21KB)
✅ Circular Dependencies: Resolved by using @tachui/flow-control for ForEach
✅ Test Migration: All component tests moved to @tachui/data package
✅ Full Test Coverage: 127 test files passing (124 core + 3 data, 2,672 total tests)
✅ Clean Architecture: One-way dependencies @tachui/data → @tachui/core + @tachui/flow-control
```

### 📊 **Quality Gates Maintained**
- **Test Suite**: 2,672 tests passing (127 test files) - August 31, 2025
- **Performance**: 6/6 benchmarks passing with no regression
- **Memory**: No memory leaks detected in restructured components
- **API Stability**: Zero breaking changes introduced

### ✅ **Week 4 COMPLETE** - **@tachui/data Package Successfully Extracted**
1. **✅ DONE**: Created @tachui/data package (35.88KB total bundle size)
2. **✅ DONE**: Resolved circular dependency by removing ForEach duplication from List.ts
3. **✅ DONE**: List/Menu/Section components successfully extracted to @tachui/data
4. **✅ DONE**: Updated all imports to use proper @tachui/flow-control for ForEach components
5. **✅ DONE**: Moved component tests to @tachui/data package with proper DOM setup
6. **✅ DONE**: All tests passing: 127 total test files (124 core + 3 data) with 2,672 tests
7. **✅ SUCCESS**: Clean one-way dependency architecture achieved
8. **✅ MILESTONE**: Zero components remain in core (List/Menu/Section extraction complete)

### 🎯 **Week 5 NEXT** - **@tachui/grid + @tachui/effects Packages**
1. **📋 READY**: Create @tachui/grid package (extract CSS Grid system from core)
2. **📋 READY**: Create @tachui/effects package (extract visual effects from core)
3. **📋 PLANNED**: Bundle size optimization analysis for Phase 2 cumulative savings

---

**Framework Status**: **PHASE 2 WEEK 4 COMPLETE** - Data extraction successful  
**Achievement**: @tachui/data package created with List/Menu/Section components (35.88KB)  
**Current Status**: Zero data components in core, all 2,672 tests passing (127 files)  
**Strategic Focus**: Proceed with Week 5 @tachui/grid and @tachui/effects extraction