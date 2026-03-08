import { VStack, HStack, Text } from '@tachui/primitives';
import { Assets } from '@tachui/core';
import type { ComponentInstance } from '@tachui/core/runtime/types';
import { ModularStack } from './ModularStack';
export function Modular(): ComponentInstance {
    // Foundation Layer - Essential packages every app uses
    const foundationPackages = [
        { name: '@tachui/core (Framework Foundation)', size: '~46KB', entries: [
                ['Reactive Runtime', 'Fine-grained signals with surgical DOM updates, no virtual DOM overhead'],
                ['33 Core Components', 'HStack, VStack, ZStack, Text, Button, Image, Link and essential UI building blocks'],
                ['Security-first', 'Built-in XSS protection, content sanitization, and secure HTML rendering'],
                ['86% Mature', 'Production-ready architecture with comprehensive test coverage'],
                ['Perfect for:', 'Foundation of all tachUI applications']
            ] },
        { name: '@tachui/primitives (UI Components)', size: '~30KB', entries: [
                ['22 Essential Components', 'Layout (Stack, Spacer, Divider), Display (ScrollView), Controls (Button, Picker)'],
                ['Enhanced ScrollView', 'Pull-to-refresh, virtual scrolling, smooth programmatic scrolling'],
                ['Production-ready', 'Battle-tested layouts with alignment, spacing, and responsive support'],
                ['Tree-shakeable', 'Import only what you need, automatic dead code elimination'],
                ['Perfect for:', 'Building rich, interactive user interfaces']
            ] },
        { name: '@tachui/modifiers (Styling System)', size: '~65KB', entries: [
                ['258 Total Modifiers', '170 basic (layout, appearance, typography) + 88 effects (filters, shadows, transforms)'],
                ['Segmented Imports', 'Import basic, effects, or specific categories independently for optimal bundles'],
                ['SwiftUI Compatible', 'Identical modifier names and behavior for iOS developer familiarity'],
                ['Registry-based', 'Dynamic registration with lazy loading for maximum flexibility'],
                ['Perfect for:', 'Comprehensive styling needs across all components']
            ] },
    ];

    // Application Features - Build complete user experiences
    const featurePackages = [
        { name: '@tachui/navigation (Routing & Navigation)', size: '~25KB', entries: [
                ['10+ Components', 'NavigationStack, TabView, NavigationLink with SwiftUI-identical patterns'],
                ['Deep Linking', 'URL state management with browser history integration'],
                ['Adaptive Navigation', 'Automatically adapts between mobile stack and desktop multi-window'],
                ['Type-safe Routing', 'Compile-time route validation prevents navigation errors'],
                ['Perfect for:', 'SPAs, mobile-first apps, dashboard interfaces']
            ] },
        { name: '@tachui/forms (Form System)', size: '~35KB', entries: [
                ['27+ Components', 'Smart fields with CreditCard/Luhn validation, Phone formatting, Email validation'],
                ['Real-time Validation', '18 built-in rules with instant feedback, no submission delays'],
                ['Accessibility-first', 'Full ARIA compliance, keyboard navigation, screen reader support'],
                ['State Management', 'Advanced form state with automatic cleanup and error handling'],
                ['Perfect for:', 'Data-heavy apps, e-commerce, admin panels']
            ] },
        { name: '@tachui/symbols (Icon System)', size: '~15KB', entries: [
                ['SF Symbols API', 'Direct mapping from iOS Symbol APIs with familiar weight/style variants'],
                ['3000+ Lucide Icons', 'Modern, consistent icon set with perfect pixel alignment'],
                ['Custom Icon Sets', 'Plugin architecture supports any icon library or SVG collections'],
                ['Tree-shaking', 'Only bundled icons included, automatic production optimization'],
                ['Perfect for:', 'Icon-heavy applications, design systems']
            ] },
    ];

    // Specialized Features - Advanced capabilities for specific use cases
    const specializedPackages = [
        { name: '@tachui/data (Lists & Data)', size: '~20KB', entries: [
                ['EnhancedList', 'Virtualization, swipe actions, pull-to-refresh, section support'],
                ['MenuComponent', 'Context menus with keyboard navigation and accessibility'],
                ['Performance', 'Handle 1000+ items with smooth scrolling and animations'],
                ['Perfect for:', 'Dashboards, data-heavy applications']
            ] },
        { name: '@tachui/grid (Grid Layouts)', size: '~15KB', entries: [
                ['Grid Components', 'Flexible grid systems with responsive support'],
                ['Lazy Grids', 'LazyVGrid/LazyHGrid for optimal performance with large datasets'],
                ['SwiftUI API', 'Identical grid syntax to iOS development'],
                ['Perfect for:', 'Image galleries, product catalogs, card layouts']
            ] },
        { name: '@tachui/responsive (Adaptive Design)', size: '~12KB', entries: [
                ['Breakpoint System', 'Base, SM, MD, LG, XL with custom modifier builders'],
                ['CSS Generators', 'Advanced utility builders for responsive layouts'],
                ['Dev Tools', 'Built-in debugging helpers for responsive design'],
                ['Perfect for:', 'Multi-device applications, adaptive interfaces']
            ] },
    ];
    return VStack({
        element: 'section',
        spacing: 0,
        alignment: 'center',
        children: [
            VStack({
                spacing: 0,
                alignment: 'center',
                children: [
                    Text('Modular Architecture')
                        .font({ size: '2.5rem', family: Assets.logoFont, weight: 'normal' })
                        .textAlign('center')
                        .foregroundColor(Assets.textWhite)
                        .padding(0)
                        .margin(0)
                        .marginBottom(20)
                        .textShadow({ x: 0, y: 2, blur: 15, color: 'hsla(251, 91%, 66%, 0.4)' }),
                    Text('18 packages organized into three layers: Foundation, Features, and Specialized')
                        .font({ size: '1.15rem', family: Assets.baseFont })
                        .textAlign('center')
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.85)
                        .marginBottom(50),

                    // Foundation Layer
                    Text('Foundation Layer')
                        .font({ size: '1.5rem', family: Assets.logoFont })
                        .foregroundColor(Assets.accentOrange)
                        .marginBottom(20)
                        .textAlign('center'),
                    HStack({
                        spacing: 16,
                        alignment: 'top',
                        children: foundationPackages.map((pkg) => {
                            return ModularStack(pkg.name, pkg.size, pkg.entries);
                        }),
                    })
                        .alignItems('stretch')
                        .base.flexDirection('column')
                        .md.flexDirection('row')
                        .marginBottom(50),

                    // Application Features
                    Text('Application Features')
                        .font({ size: '1.5rem', family: Assets.logoFont })
                        .foregroundColor(Assets.accentOrange)
                        .marginBottom(20)
                        .textAlign('center'),
                    HStack({
                        spacing: 16,
                        alignment: 'top',
                        children: featurePackages.map((pkg) => {
                            return ModularStack(pkg.name, pkg.size, pkg.entries);
                        }),
                    })
                        .alignItems('stretch')
                        .base.flexDirection('column')
                        .md.flexDirection('row')
                        .marginBottom(50),

                    // Specialized Features
                    Text('Specialized Features')
                        .font({ size: '1.5rem', family: Assets.logoFont })
                        .foregroundColor(Assets.accentOrange)
                        .marginBottom(20)
                        .textAlign('center'),
                    HStack({
                        spacing: 16,
                        alignment: 'top',
                        children: specializedPackages.map((pkg) => {
                            return ModularStack(pkg.name, pkg.size, pkg.entries);
                        }),
                    })
                        .alignItems('stretch')
                        .base.flexDirection('column')
                        .md.flexDirection('row')
                        .marginBottom(30),

                    // Additional packages note
                    Text('Plus @tachui/mobile, @tachui/viewport, @tachui/devtools, @tachui/cli, @tachui/types, @tachui/registry, and more')
                        .font({ size: '1rem', family: Assets.baseFont })
                        .textAlign('center')
                        .foregroundColor(Assets.textWhite)
                        .opacity(0.7),
                    VStack({})
                ]
            })
                .padding({ vertical: 0, horizontal: 20 })
                .maxWidth(1200)
                .elementId('modular'),
        ]
    })
        .background(Assets.darkPurple80)
        .foregroundColor(Assets.textWhite)
        .padding({ vertical: 80, horizontal: 0 })
        .position('relative')
        .width("100%")
        .elementId('architecture');
}
