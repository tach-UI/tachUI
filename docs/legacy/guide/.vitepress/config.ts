import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'TachUI',
  description: 'SwiftUI-inspired web framework with SolidJS-style reactivity',
  base: '/docs/',

  // Dead links are now handled with placeholder pages
  ignoreDeadLinks: false,

  markdown: {
    toc: {
      level: [2, 3, 4],
    },
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/developer-getting-started' },
      { text: 'API Reference', link: '/api/' },
      { text: 'Reference', link: '/reference/modifier-system' },
      { text: 'Migration Guides', link: '/migration-guides/swiftui-modifiers' },
      { text: 'Upgrade Guide', link: '/upgrade-guide' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Plugins', link: '/plugins/' },
      { text: 'Symbols', link: '/symbols/' },
      { text: 'Cheatsheets', link: '/sheets/components-reference' },
      { text: 'Package Structure', link: '/structure/core' },
      { text: 'GitHub', link: 'https://github.com/tach-ui/tachUI' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/getting-started' },
            {
              text: 'Developer Quick Start',
              link: '/guide/developer-getting-started',
            },
            { text: 'Build Tooling & Setup', link: '/guide/build-tooling' },
            { text: 'Project Structure', link: '/guide/project-structure' },
            { text: 'Core Concepts', link: '/guide/concepts' },
            { text: 'Installation', link: '/guide/installation' },
          ],
        },
        {
          text: 'Reactive System',
          items: [
            { text: 'Signals', link: '/guide/signals' },
            { text: 'Computed Values', link: '/guide/computed' },
            { text: 'Effects', link: '/guide/effects' },
            { text: 'Cleanup & Memory', link: '/guide/cleanup' },
          ],
        },
        {
          text: 'Components',
          items: [
            {
              text: 'Complete Components Guide',
              link: '/guide/complete-components-guide',
            },
            { text: 'TachUI Components', link: '/guide/tachui-components' },
            { text: 'Basic Components', link: '/guide/components' },
            { text: 'Assets System', link: '/guide/assets-system' },
            { text: 'Font Assets', link: '/guide/font-assets' },
            { text: 'Gradients', link: '/guide/gradients' },
            {
              text: 'CSS Framework Integration',
              link: '/guide/css-framework-integration',
            },
            { text: 'Layout Containers', link: '/guide/layout' },
            { text: 'Navigation', link: '/guide/navigation' },
            { text: 'State Management', link: '/guide/state-management' },
            { text: 'State Reference', link: '/guide/state-reference' },
            { text: 'State vs Signals', link: '/guide/state-vs-signals' },
            {
              text: 'Events & Signals Development',
              link: '/guide/events-and-signals-development',
            },
          ],
        },
        {
          text: 'Developer Guides',
          items: [
            { text: 'Component Cloning', link: '/guide/component-cloning' },
            { text: 'Type Generation Workflow', link: '/guide/type-generation' },
            {
              text: 'Performance Best Practices',
              link: '/guide/performance-best-practices',
            },
            {
              text: 'Plugin Security Guidelines',
              link: '/guide/plugin-security-guidelines',
            },
            { text: 'Debugging Toolkit', link: '/guide/debugging-guide' },
          ],
        },
        {
          text: 'Performance & Optimization',
          items: [
            {
              text: '🚀 Bundle Optimization Guide',
              link: '/guide/bundle-optimization',
            },
            { text: 'Performance & Benchmarks', link: '/guide/performance' },
            { text: 'Benchmarks', link: '/guide/benchmarks' },
            { text: 'Testing Guide', link: '/guide/testing' },
          ],
        },
        {
          text: 'Advanced Topics',
          items: [
            { text: 'Viewport Management', link: '/guide/viewport-management' },
            { text: 'Security System', link: '/guide/security' },
            { text: 'Validation System', link: '/guide/validation' },
            { text: 'Modifiers System', link: '/guide/modifiers' },
            { text: 'New Modifiers', link: '/guide/new-modifiers' },
            {
              text: 'Modifier Pipeline Internals',
              link: '/guide/modifier-pipeline-internals',
            },
            { text: 'Semantic HTML', link: '/guide/semantic-html' },
          ],
        },
        {
          text: 'Responsive Design',
          items: [
            {
              text: 'Responsive Design Guide',
              link: '/guide/responsive-design',
            },
            { text: 'Breakpoints', link: '/guide/breakpoints' },
            {
              text: 'Responsive Debugging',
              link: '/guide/responsive-debugging',
            },
            {
              text: 'Responsive Performance',
              link: '/guide/responsive-performance',
            },
            {
              text: 'Responsive Migration',
              link: '/guide/responsive-migration',
            },
          ],
        },
        {
          text: 'Migration & Compatibility',
          items: [
            {
              text: 'Enhanced Modifiers Migration',
              link: '/guide/enhanced-modifiers-migration',
            },
            { text: 'TextField Migration', link: '/guide/textfield-migration' },
            { text: 'Migration Tools', link: '/guide/migration' },
            {
              text: 'SwiftUI Modifiers Migration',
              link: '/migration-guides/swiftui-modifiers',
            },
          ],
        },
        {
          text: 'System Internals',
          items: [
            { text: 'Runtime System', link: '/guide/runtime' },
            { text: 'DOM Bridge', link: '/guide/dom-bridge' },
            { text: 'Compiler', link: '/guide/compiler' },
          ],
        },
        {
          text: 'AI Development',
          items: [
            { text: 'Tacho CLI', link: '/guide/tacho-cli' },
            { text: 'AI Integration', link: '/guide/ai-integration' },
          ],
        },
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            {
              text: 'Modifier System API',
              link: '/reference/modifier-system',
            },
          ],
        },
      ],
      '/migration-guides/': [
        {
          text: 'Migration Guides',
          items: [
            {
              text: 'SwiftUI Modifiers Migration',
              link: '/migration-guides/swiftui-modifiers',
            },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Overview',
          items: [{ text: 'API Reference', link: '/api/' }],
        },
        {
          text: 'Reactive System',
          items: [
            { text: 'createSignal', link: '/api/create-signal' },
            { text: 'createComputed', link: '/api/create-computed' },
            { text: 'createEffect', link: '/api/create-effect' },
            { text: 'Utilities', link: '/api/utilities' },
          ],
        },
        {
          text: 'Application APIs',
          items: [
            { text: 'Application Mounting', link: '/api/mounting' },
            { text: 'Navigation System', link: '/api/navigation' },
            { text: 'Security Features', link: '/api/security' },
            { text: 'Validation System', link: '/api/validation' },
          ],
        },
        {
          text: 'Build System',
          items: [
            { text: 'Compiler API', link: '/api/compiler' },
            { text: 'Modifiers System', link: '/api/modifiers' },
            { text: 'Enhanced Modifiers', link: '/api/enhanced-modifiers' },
            { text: 'Responsive Modifiers', link: '/api/responsive-modifiers' },
          ],
        },
        {
          text: 'Styling & Effects',
          items: [
            { text: 'CSS Classes API', link: '/api/css-classes' },
            { text: 'Gradients API', link: '/api/gradients' },
            { text: 'Hover Effects API', link: '/api/hover-effects' },
            { text: 'Transforms API', link: '/api/transforms' },
            { text: 'Visual Effects API', link: '/api/visual-effects' },
          ],
        },
        {
          text: 'Semantic HTML',
          items: [
            { text: 'Element Override API', link: '/api/element-override' },
          ],
        },
        {
          text: 'Components Overview',
          items: [{ text: 'All Components', link: '/components/' }],
        },
        {
          text: 'Core Components',
          items: [
            { text: 'Text', link: '/components/text' },
            { text: 'Button', link: '/components/button' },
            { text: 'BasicInput', link: '/components/basicinput' },
            { text: 'TextField', link: '/components/textfield' },
            { text: 'Toggle', link: '/components/toggle' },
            { text: 'Slider', link: '/components/slider' },
            { text: 'Picker', link: '/components/picker' },
            { text: 'Stepper', link: '/components/stepper' },
          ],
        },
        {
          text: 'Navigation Components',
          items: [
            { text: 'NavigationView', link: '/components/navigationview' },
            { text: 'NavigationStack', link: '/components/navigation-stack' },
            { text: 'NavigationLink', link: '/components/navigation-link' },
            { text: 'TabView', link: '/components/tabview' },
            { text: 'SimpleTabView', link: '/components/simple-tab-view' },
            { text: 'Link', link: '/components/link' },
          ],
        },
        {
          text: 'Interactive Components',
          items: [
            { text: 'Alert', link: '/components/alert' },
            { text: 'ActionSheet', link: '/components/actionsheet' },
            { text: 'Menu', link: '/components/menu' },
            { text: 'DatePicker', link: '/components/datepicker' },
          ],
        },
        {
          text: 'Dynamic Rendering',
          items: [
            { text: 'Show', link: '/components/show' },
            { text: 'ForEach', link: '/components/foreach' },
            { text: 'For', link: '/components/for' },
          ],
        },
        {
          text: 'Layout & Form Components',
          items: [
            { text: 'Divider', link: '/components/divider' },
            { text: 'Form', link: '/components/form' },
          ],
        },
        {
          text: 'Window Management',
          items: [
            { text: 'App', link: '/components/app' },
            { text: 'Window', link: '/components/window' },
            { text: 'WindowGroup', link: '/components/windowgroup' },
          ],
        },
      ],
      '/examples/': [
        {
          text: 'Getting Started',
          items: [
            {
              text: 'Quick Start Example',
              link: '/examples/quick-start-example',
            },
            { text: 'Counter App', link: '/examples/counter' },
            { text: 'Todo List', link: '/examples/todo' },
            { text: 'Data Fetching', link: '/examples/data-fetching' },
          ],
        },
        {
          text: 'Component Examples',
          items: [
            {
              text: 'Component Showcase',
              link: '/examples/component-examples',
            },
            {
              text: 'Working Components',
              link: '/examples/working-component-examples',
            },
          ],
        },
        {
          text: 'Styling Examples',
          items: [
            { text: 'Modifier Usage', link: '/examples/modifier-examples' },
            { text: 'CSS Modifiers', link: '/examples/css-modifier-examples' },
            {
              text: 'CSS Framework Examples',
              link: '/examples/css-framework-examples',
            },
            { text: 'Gradient Examples', link: '/examples/gradient-examples' },
          ],
        },
        {
          text: 'Advanced Examples',
          items: [
            {
              text: 'Validation Examples',
              link: '/examples/validation-examples',
            },
            { text: 'Viewport Management', link: '/examples/viewport-example' },
            {
              text: 'Advanced Viewport',
              link: '/examples/advanced-viewport-example',
            },
          ],
        },
        {
          text: 'Responsive Examples',
          items: [
            {
              text: 'Responsive Layouts',
              link: '/examples/responsive-layouts',
            },
            {
              text: 'Real-world Responsive',
              link: '/examples/responsive-real-world',
            },
          ],
        },
      ],
      '/sheets/': [
        {
          text: 'Cheatsheets',
          items: [
            { text: 'Components', link: '/sheets/components-reference' },
            { text: 'Modifiers', link: '/sheets/modifiers-reference' },
          ],
        },
      ],
      '/structure/': [
        {
          text: 'Package Structure',
          items: [
            { text: 'Core', link: '/structure/core' },
            { text: 'Forms', link: '/structure/forms' },
            { text: 'Navigation', link: '/structure/navigation' },
            { text: 'Symbols', link: '/structure/symbols' },
            { text: 'CLI', link: '/structure/cli' },
          ],
        },
      ],
      '/plugins/': [
        {
          text: 'Plugin System',
          items: [
            { text: 'Plugin Overview', link: '/plugins' },
            { text: 'Plugin Architecture', link: '/plugin-architecture' },
            {
              text: 'Plugin Optimization',
              link: '/plugin-system-optimization',
            },
            { text: 'Advanced Modifiers', link: '/advanced-modifiers' },
            { text: 'Padding Modifiers', link: '/padding-modifiers' },
          ],
        },
        {
          text: 'Available Plugins',
          items: [{ text: 'Forms Plugin', link: '/plugins/forms' }],
        },
      ],
      '/symbols/': [
        {
          text: 'Symbols Package',
          items: [
            { text: 'Overview', link: '/symbols/' },
            { text: 'Getting Started', link: '/symbols/getting-started' },
            { text: 'API Reference', link: '/symbols/api-reference' },
          ],
        },
        {
          text: 'Development History',
          items: [
            { text: 'Phase 2 Features', link: '/symbols/phase-2-features' },
            {
              text: 'Phase 2 Summary',
              link: '/symbols/phase-2-completion-summary',
            },
          ],
        },
      ],
      '/demos/': [
        {
          text: 'Demos',
          items: [{ text: 'Running Demos', link: '/demos/running-demos' }],
        },
      ],
      '/developer-experience/': [
        {
          text: 'Developer Tools',
          items: [
            {
              text: 'Experience Improvements',
              link: '/developer-experience-improvements',
            },
            { text: 'Testing Framework', link: '/testing-framework' },
            {
              text: 'Testing Expectations',
              link: '/developer-testing-expectations',
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/tach-ui/tachUI' },
    ],

    footer: {
      message: 'Released under the MPL-2.0 License.',
      copyright: 'Copyright © 2024 TachUI Team',
    },

    search: {
      provider: 'local',
    },
  },

  vite: {
    resolve: {
      alias: {
        '@tachui/core': '../../packages/core/src',
      },
    },
  },
})
