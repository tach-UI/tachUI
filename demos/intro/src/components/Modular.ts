import { VStack, HStack, Text } from '@tachui/primitives'
import { Assets } from '@tachui/core/assets'
import type { ComponentInstance } from '@tachui/core/runtime/types'
import { ModularStack } from './ModularStack'

const logoFont = Assets.logoFont

export function Modular(): ComponentInstance {

  const packagesA = [
    { name: '@tachui/core (Framework Foundation)', size: '~46KB', entries: [
        ['33 Essential Components - ', 'HStack, VStack, ZStack, Text, Button, Image, Link and more'],
        ['Over 130 Modifiers - ', 'Styling, interaction and utility Modifiers, aligned with expected SwiftUI patterns'],
        ['95% SwiftUI API compatibility - ', 'iOS developers feel at home immediately with identical syntax and patterns'],
        ['Fine-grained reactivity - ', 'Surgical DOM updates with no virtual DOM overhead, only changed properties trigger updates'],
        ['Security-first design - ', 'Built-in XSS protection, content sanitization, and secure HTML rendering'],
        ['Plugin architecture - ', 'Scales from 46KB to full-featured apps, tree-shaking ensures optimal bundles'],
        ['Perfect for: ', 'Landing pages, blogs, simple applications, portfolio sites']
    ] },
    { name: '@tachui/navigation (Routing & Navigation)', size: '~25KB', entries: [
      ['10+ Navigation Components - ', 'NavigationStack, EnhancedTabView, HierarchicalTabView, NavigationIconLink, NavigationListLink, StyledNavigationLink'],
      ['SwiftUI NavigationStack - ', 'Identical API to iOS navigation with path-based routing and type safety'],
      ['Adaptive navigation - ', 'Automatically adapts between mobile stack navigation and desktop multi-window layouts'],
      ['Deep linking built-in - ', 'URL state management with browser history integration out of the box'],
      ['Type-safe routing - ', 'Compile-time route validation prevents navigation errors before deployment'],
      ['Zero configuration - ', 'Works immediately with sensible defaults, extensive customization when needed'],
      ['Perfect for: ', 'Single-page applications, mobile-first apps, dashboard interfaces']
    ] },
    { name: '@tachui/forms (Advanced Form System)', size: '~35KB', entries: [
      ['Smart form fields - ', 'CreditCardField with Luhn validation, PhoneField with international formatting, EmailField with domain validation'],
      ['Real-time validation - ', '18 built-in rules with instant feedback, no waiting for form submission'],
      ['Accessibility-first - ', 'Full ARIA compliance, keyboard navigation, and screen reader support built into every component'],
      ['Production-ready validation - ', 'Battle-tested SSN masking, postal code formatting, and currency input handling'],
      ['Zero boilerplate - ', 'Advanced form state management with automatic cleanup and error handling'],
      ['Perfect for: ', 'Data-heavy applications, e-commerce, admin panels']
    ] },
  ]
  const packagesB = [
    { name: '@tachui/symbols (Icon System)', size: '~15KB', entries: [
      ['SF Symbols compatibility - ', 'Direct mapping from iOS Symbol APIs, familiar weight and style variants'],
      ['3000+ Lucide icons - ', 'Modern, consistent icon set with perfect pixel alignment at all sizes'],
      ['Custom icon sets - ', 'Plugin architecture supports any icon library or custom SVG collections'],
      ['Smooth animations - ', 'Built-in bounce, pulse, and rotation effects with performance optimization'],
      ['Tree-shaking friendly - ', 'Only bundled icons are included, automatic optimization for production builds'],
      ['Perfect for: ', 'Icon-heavy applications, design systems']
    ] },
    { name: '@tachui/mobile-patterns (Mobile UI Enhancements)', size: '~10KB', entries: [
      ['2 Key Mobile Components - ', 'ActionSheet, Alert'],
      ['Native iOS feel - ', 'Pixel-perfect ActionSheet and Alert components that match iOS design guidelines'],
      ['Touch-first design - ', 'Optimized tap targets, gesture recognition, and haptic feedback integration'],
      ['Adaptive theming - ', 'Automatically adjusts to light/dark mode with smooth transitions'],
      ['Lightweight - ', 'Only 10KB additional for complete mobile UI pattern library'],
      ['Zero configuration - ', 'Works immediately with sensible defaults, extensive customization available'],
      ['Perfect for: ', 'Mobile applications, touch interfaces']
    ] },
    { name: '@tachui/advanced-forms (Extended Form Elements)', size: '~20KB', entries: [
      ['3 Additional Form Components - ', 'DatePicker (calendar, time picker, and date range selector), Slider, Stepper'],
      ['Rich DatePicker - ', 'Calendar, time picker, and date range selection with localization support'],
      ['Advanced sliders - ', 'Multi-thumb sliders, range selection, custom marks, and smooth animations'],
      ['Smart steppers - ', 'Numeric input with validation, increment/decrement, and keyboard shortcuts'],
      ['Highly customizable - ', 'Extensive theming options while maintaining iOS-familiar interactions'],
      ['Performance optimized - ', 'Efficient rendering for complex form interactions and animations'],
      ['Perfect for: ', 'Complex data entry, configuration interfaces']
    ] },
  ]

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
            .modifier
            .font({ size: '2.5rem', family: logoFont, weight: 'normal' })
            .textAlign('center')
            .foregroundColor(Assets.textWhite)
            .padding(0)
            .margin(0)
            .marginBottom(60)
            .textShadow({ x: 0, y: 2, blur: 15, color: 'hsla(251, 91%, 66%, 0.4)' })
            .build(),

          HStack({
            spacing: 16,
            alignment: 'top',
            children: packagesA.map((pkg) => {
              return ModularStack(pkg.name, pkg.size, pkg.entries)
            }),
          })
            .modifier
            .alignItems('stretch')
            .base.flexDirection('column')
            .md.flexDirection('row')
            .marginBottom(16)
            .build(),

          HStack({
            spacing: 16,
            alignment: 'top',
            children: packagesB.map((pkg) => {
              return ModularStack(pkg.name, pkg.size, pkg.entries)
            }),
          })
            .modifier
            .alignItems('stretch')
            .base.flexDirection('column')
            .md.flexDirection('row')
            .build(),

          VStack({})
        ]
      })
        .modifier
        .padding({ vertical: 0, horizontal: 20 })
        .maxWidth(1200)
        .id('modular')
        .build(),

    ]
  })
    .modifier
    .background(Assets.darkPurple80)
    .foregroundColor(Assets.textWhite)
    .padding({ vertical: 80, horizontal: 0 })
    .position('relative')
    .width("100%")
    .id('architecture')
    .build()
}
