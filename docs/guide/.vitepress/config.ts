import { defineConfig } from 'vitepress'

const guideSidebar = [
  {
    text: 'Start Here',
    items: [
      { text: 'What is tachUI?', link: '/guide/index' },
      { text: 'Installation', link: '/guide/installation' },
      { text: 'Quick Start', link: '/guide/developer-getting-started' },
      { text: 'Project Structure', link: '/guide/project-structure' },
    ],
  },
  {
    text: 'Core Concepts',
    items: [
      { text: 'Signals & Reactivity', link: '/guide/signals' },
      { text: 'State Management', link: '/guide/state-management' },
      { text: 'Components Overview', link: '/guide/complete-components-guide' },
      { text: 'Component Catalog', link: '/components/catalog' },
      { text: 'Modifier System', link: '/guide/modifiers' },
      { text: 'Modifier Catalog', link: '/modifiers/catalog' },
      { text: 'Layouts & Responsive Design', link: '/guide/responsive-design' },
      { text: 'Navigation', link: '/guide/navigation' },
    ],
  },
  {
    text: 'Migration & Adoption',
    items: [
      { text: 'SwiftUI Compatibility', link: '/guide/swiftui-compatibility' },
      { text: 'Enhanced Modifiers Migration', link: '/guide/enhanced-modifiers-migration' },
      { text: 'Flexbox → Grid', link: '/guide/flexbox-to-grid-migration' },
      { text: 'TextField Migration', link: '/guide/textfield-migration' },
    ],
  },
  {
    text: 'Advanced Topics',
    items: [
      { text: 'Performance & Benchmarks', link: '/guide/performance' },
      { text: 'Bundle Optimization', link: '/guide/bundle-optimization' },
      { text: 'Viewport Management', link: '/guide/viewport-management' },
      { text: 'Security & Validation', link: '/guide/security' },
      { text: 'Plugin Architecture', link: '/guide/plugin-security-guidelines' },
      { text: 'Testing', link: '/guide/testing' },
    ],
  },
]

const packagesSidebar = [
  {
    text: 'Overview',
    items: [
      { text: 'Why Packages', link: '/packages/index' },
      { text: 'Publishing & Versioning', link: '/structure/core' },
    ],
  },
  {
    text: 'Core Framework',
    items: [
      { text: '@tachui/core', link: '/packages/core/' },
      { text: 'Reactive Runtime', link: '/packages/core/runtime' },
      { text: 'Performance Guide', link: '/packages/core/performance' },
    ],
  },
  {
    text: 'UI Building Blocks',
    items: [
      { text: '@tachui/primitives', link: '/packages/primitives/' },
      { text: '@tachui/modifiers', link: '/packages/modifiers/' },
      { text: '@tachui/symbols', link: '/packages/symbols/' },
    ],
  },
  {
    text: 'Feature Packages',
    items: [
      { text: '@tachui/navigation', link: '/packages/navigation/' },
      { text: '@tachui/forms', link: '/packages/forms/' },
      { text: '@tachui/grid', link: '/packages/grid/' },
      { text: '@tachui/data', link: '/packages/data/' },
    ],
  },
]

const inActionSidebar = [
  {
    text: 'Interactive Playground',
    items: [
      { text: 'Overview', link: '/in-action/' },
      { text: 'Live Playground', link: '/in-action/interactive' },
      { text: 'Modifier Lab', link: '/guide/advanced-modifiers' },
    ],
  },
  {
    text: 'Patterns',
    items: [
      { text: 'Layouts', link: '/in-action/patterns' },
      { text: 'Animations & Effects', link: '/guide/visual-effects' },
    ],
  },
]

const cheatSheetsSidebar = [
  {
    text: 'Quick Reference',
    items: [
      { text: 'Components', link: '/cheatsheets/components' },
      { text: 'Modifiers', link: '/cheatsheets/modifiers' },
      { text: 'Snippets', link: '/cheatsheets/snippets' },
      { text: 'Troubleshooting', link: '/cheatsheets/troubleshooting' },
    ],
  },
]

const apiSidebar = [
  {
    text: 'API Docs',
    items: [
      { text: 'Overview', link: '/api/' },
      { text: 'Runtime', link: '/api/runtime' },
      { text: 'Components', link: '/api/components' },
      { text: 'Modifiers', link: '/api/modifiers' },
      { text: 'Utilities', link: '/api/utilities' },
    ],
  },
]

const demosSidebar = [
  {
    text: 'Showcase Apps',
    items: [
      { text: 'Overview', link: '/demos/' },
      { text: 'Calculator', link: '/demos/calculator' },
      { text: 'Intro Experience', link: '/demos/intro' },
      { text: 'Upcoming Demos', link: '/demos/roadmap' },
    ],
  },
]

const resourcesSidebar = [
  {
    text: 'Community & Resources',
    items: [
      { text: 'Support', link: '/resources/' },
      { text: 'Community', link: '/resources/community' },
      { text: 'Tools', link: '/resources/tools' },
      { text: 'Learning', link: '/resources/learning' },
    ],
  },
]

export default defineConfig({
  title: 'tachUI',
  description: 'SwiftUI-inspired web framework with SolidJS-style reactivity',
  lang: 'en-US',
  base: '/docs/',
  srcDir: '.',
  cleanUrls: true,
  ignoreDeadLinks: true,
  markdown: {
    toc: { level: [2, 3] },
    theme: {
      light: 'github-light',
      dark: 'github-dark',
    },
  },
  head: [
    ['meta', { property: 'og:title', content: 'tachUI Documentation' }],
    ['meta', { property: 'og:description', content: 'tachUI developer documentation for the SwiftUI-inspired web framework.' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700&family=Inconsolata:wght@400;500;600&display=swap',
      },
    ],
  ],
  themeConfig: {
    search: {
      provider: 'local',
    },
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/' },
      { text: 'Packages', link: '/packages/' },
      { text: 'Showcase', link: '/showcase' },
      {
        text: 'Resources',
        items: [
          { text: 'Overview', link: '/resources/' },
          { text: 'Cheat Sheets', link: '/cheatsheets/' },
          { text: 'Community', link: '/resources/community' },
          { text: 'Tools', link: '/resources/tools' },
          { text: 'Learning', link: '/resources/learning' },
          { text: 'Roadmap', link: '/roadmap' },
        ],
      },
      { text: 'GitHub', link: 'https://github.com/tach-ui/tachUI' },
    ],
    sidebar: {
      '/guide/': guideSidebar,
      '/packages/': packagesSidebar,
      '/in-action/': inActionSidebar,
      '/cheatsheets/': cheatSheetsSidebar,
      '/api/': apiSidebar,
      '/demos/': demosSidebar,
      '/resources/': resourcesSidebar,
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/tach-ui/tachUI' },
      { icon: 'discord', link: 'https://discord.gg/tachui' },
    ],
    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },
    footer: {
      message: 'Released under the MPL-2.0 License.',
      copyright: '© 2025 tachUI contributors',
    },
    outline: [2, 3],
  },
})
