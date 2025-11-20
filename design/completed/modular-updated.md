---
cssclasses:
  - full-page
---

# TachUI Modular Architecture - Updated for Current Plugin Structure

## Overview
TachUI's modular architecture allows developers to start with a lightweight core (46KB) and add only the plugins needed for their specific use case. Each plugin is tree-shakeable, ensuring optimal bundle sizes while maintaining SwiftUI-like declarative syntax and iOS-native feel. Below is an updated overview of the current plugin structure, highlighting key features, bundle impact, and ideal use cases.

## Core Plugins

### @tachui/core (Foundation Framework)
**Bundle Size:** ~46KB  
**Key Features:**
- **33 Essential Components:** HStack, VStack, ZStack, Text, Button, Image, Link, and more – all with SwiftUI-compatible APIs.
- **130+ Modifiers:** Comprehensive styling, layout, and interaction modifiers (padding, margin, font, color, asHTML for secure HTML rendering).
- **Reactive System:** Fine-grained signals and computed values with surgical DOM updates – no virtual DOM overhead.
- **Security-First Design:** Built-in XSS protection, content sanitization, and secure HTML rendering with asHTML modifier.
- **Plugin Architecture:** Simplified plugin system for easy extension – register components, modifiers, and assets via a single API.
- **95% SwiftUI Parity:** Identical syntax patterns so iOS developers feel at home immediately.
- **Perfect For:** Landing pages, blogs, portfolios, and any app needing a solid foundation without bloat.

### @tachui/primitives (Basic UI Building Blocks)
**Bundle Size:** ~12KB  
**Key Features:**
- **Core Primitives:** Enhanced Text with typography presets, HTML, Image, ScrollView – all optimized for performance.
- **Typography System:** 10 SwiftUI-inspired presets (LargeTitle, Body, Caption) with automatic font scaling and accessibility.
- **Text Enhancements:** Rich text formatting (bold, italic, underline), line limiting, truncation modes, and selection support.
- **Image Optimization:** Lazy loading, placeholder support, and responsive sizing out of the box.
- **Accessibility Built-In:** Semantic roles, ARIA labels, and screen reader compatibility for all primitives.
- **Perfect For:** Text-heavy content, image galleries, and any app needing reliable basic components.

### @tachui/registry (Component & Modifier Registry)
**Bundle Size:** ~8KB  
**Key Features:**
- **Global Registry:** Centralized management for components, modifiers, and plugins – avoids conflicts and enables tree-shaking.
- **Dynamic Registration:** Register custom components and modifiers at runtime or build time.
- **Type-Safe Lookup:** Compile-time validation for registered items with full TypeScript support.
- **Singleton Pattern:** One instance per app, ensuring consistency across the entire codebase.
- **Validation System:** Built-in checks for duplicate registrations and invalid configurations.
- **Perfect For:** Design systems, component libraries, and apps with custom UI extensions.

## Layout & Navigation Plugins

### @tachui/grid (Advanced Grid System)
**Bundle Size:** ~18KB  
**Key Features:**
- **Responsive Grids:** CSS Grid with SwiftUI-like modifiers (gridColumn, gridRow, spanning).
- **Adaptive Layouts:** Automatic breakpoint handling (base, sm, md, lg, xl) with fluid scaling.
- **Grid Modifiers:** Spanning, alignment, gap control, and nested grid support.
- **Accessibility:** Proper ARIA grid roles and keyboard navigation built-in.
- **Performance:** Virtualized rendering for large grids, with efficient re-renders.
- **Perfect For:** Dashboards, data tables, card layouts, and complex responsive designs.

### @tachui/navigation (Routing & Navigation)
**Bundle Size:** ~25KB  
**Key Features:**
- **SwiftUI NavigationStack:** Identical API to iOS – declarative path-based navigation with type safety.
- **10+ Navigation Components:** NavigationView, TabView, NavigationLink, HierarchicalTabView, and more.
- **Deep Linking:** URL state management with browser history and shareable links.
- **Adaptive Navigation:** Mobile stack vs. desktop tabs/sidebar – automatic based on screen size.
- **Type-Safe Routes:** Compile-time route validation prevents navigation errors.
- **Zero Configuration:** Works immediately with sensible defaults and full customization options.
- **Perfect For:** SPAs, mobile-first apps, dashboards, and multi-page experiences.

## Interaction & Forms Plugins

### @tachui/forms (Form System)
**Bundle Size:** ~35KB  
**Key Features:**
- **Smart Form Fields:** TextField, TextArea, Checkbox, Radio, Select with real-time validation.
- **18+ Validation Rules:** Email, phone, credit card (Luhn), required, min/max length – instant feedback.
- **Form State Management:** Automatic dirty tracking, submission handling, and error display.
- **Accessibility-First:** Full ARIA compliance, keyboard navigation, and screen reader announcements.
- **Internationalization:** Built-in support for locale-specific formatting (dates, numbers, currencies).
- **Production-Ready:** Battle-tested input masking, postal codes, and secure form submission.
- **Perfect For:** User registration, e-commerce checkouts, admin panels, and data entry forms.

### @tachui/effects (Visual Effects)
**Bundle Size:** ~22KB  
**Key Features:**
- **CSS Filters & Transforms:** Blur, brightness, contrast, rotate, scale, translate – all reactive.
- **Shadows & Backdrops:** Box shadows, drop shadows, backdrop filters for glassmorphism effects.
- **Advanced Animations:** Smooth transitions, keyframe animations, and GPU-accelerated effects.
- **SwiftUI-Compatible:** Identical modifier APIs (shadow, blur, opacity) with web optimizations.
- **Performance Optimized:** Hardware acceleration where possible, fallback for older browsers.
- **Perfect For:** Modern UIs, animations, glassmorphism designs, and visual feedback systems.

## Data & Content Plugins

### @tachui/data (List & Menu Systems)
**Bundle Size:** ~28KB  
**Key Features:**
- **Dynamic Lists:** List, Menu, MenuItem with virtualization for large datasets.
- **Interactive Menus:** Dropdowns, context menus, nested navigation with keyboard support.
- **Data Binding:** Reactive lists that update automatically when underlying data changes.
- **Accessibility:** Full keyboard navigation, ARIA roles, and focus management.
- **Customization:** Extensive theming and layout options while maintaining consistent behavior.
- **Perfect For:** Navigation menus, data tables, settings panels, and content lists.

### @tachui/symbols (Icon & Symbol System)
**Bundle Size:** ~15KB (plus icons)  
**Key Features:**
- **SF Symbols Compatibility:** Direct mapping from iOS symbols with weight/style variants.
- **3000+ Lucide Icons:** Modern, consistent set with perfect alignment at all sizes.
- **Custom Icon Sets:** Plugin architecture for any SVG library or custom collections.
- **Smooth Animations:** Built-in effects (bounce, spin, pulse) with performance optimization.
- **Tree-Shaking:** Only used icons bundled – automatic optimization for production.
- **Perfect For:** Icon-heavy apps, toolbars, buttons, and design systems.

## Utility & Advanced Plugins

### @tachui/viewport (Responsive & Viewport Management)
**Bundle Size:** ~10KB  
**Key Features:**
- **Breakpoint System:** Automatic detection (xs, sm, md, lg, xl) with reactive modifiers.
- **Viewport Manager:** Scroll position, resize events, and orientation changes.
- **Media Queries:** CSS-in-JS media queries integrated with the modifier system.
- **Safe Area Handling:** iOS-style safe areas for mobile web apps.
- **Performance Monitoring:** Throttled resize/scroll events to prevent jank.
- **Perfect For:** Responsive designs, mobile web apps, and adaptive layouts.

### @tachui/effects (Advanced Visual Effects - Extended)
**Bundle Size:** ~22KB (already covered above, but can be extended with gradients, etc.)

## Getting Started
Install the core and add plugins as needed:
```bash
pnpm add @tachui/core
pnpm add @tachui/navigation  # For routing
pnpm add @tachui/forms       # For forms
```

Each plugin integrates seamlessly with the core system, maintaining SwiftUI syntax while leveraging web performance optimizations. The modular design ensures you only bundle what you need, keeping apps lightweight and fast.