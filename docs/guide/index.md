---
title: tachUI
---

<DocHero
  title="Declarative superpowers for the web"
  description="tachUI pairs SolidJS-style reactivity with SwiftUI ergonomics so you can ship interactive web apps without re-learning everything you love about declarative UI development."
>
  <template #actions>
    <a class="tach-button" href="/guide/quick-start">Get started</a>
    <a class="tach-button secondary" href="/docs/showcase">Explore showcase</a>
    <a class="tach-button ghost" href="/docs/roadmap">Roadmap</a>
  </template>
</DocHero>

<div class="tach-stat-grid">
  <a class="tach-stat-link" href="/docs/components/catalog">
    <DocStat value="71+" label="Components" />
  </a>
  <a class="tach-stat-link" href="/docs/modifiers/catalog">
    <DocStat value="130+" label="Modifiers" />
  </a>
  <a class="tach-stat-link" href="/docs/packages/">
    <DocStat value="16" label="Packages" />
  </a>
  <DocStat value="4,700+" label="Tests" />
</div>

## Why tachUI

<DocCardGrid
  :cards="[
    {
      title: 'SwiftUI-first API',
      description: 'Modifiers, stacks, navigation, and state primitives that mirror SwiftUI so onboarding is measured in minutes.'
    },
    {
      title: 'Fine-grained Reactivity',
      description: 'Signals drive DOM updates with zero VDOM reconciliation cost and predictable performance.'
    },
    {
      title: 'Modular Architecture',
      description: 'Keep the 16 KB core runtime and opt into navigation, forms, grid, responsive utilities, and more as needed.'
    },
    {
      title: 'Full TypeScript Coverage',
      description: 'Strict typing across all packages plus IDE-ready modifier chains ensure DX remains fast and safe.'
    }
  ]"
/>

## Jump in

- `guide/` – fundamentals, migration guides, and core concepts
- `packages/` – deep dives and API links for every package
- `showcase/` – interactive playgrounds, galleries, and demos
- `resources/` – community, tooling, roadmap, and cheat sheets
- `api/` – typed API reference (linked from package pages)

## Interactive playground (Phase 1 preview)

<DocPlaygroundFrame title="tachUI Playground Preview">
  Upcoming: tachUI renders the docs about itself. This iframe currently loads a static placeholder while the tachUI-powered sandbox is wired up.
</DocPlaygroundFrame>

## Road to v1.0

<DocRoadmapCallout
  status="In progress"
  timeframe="Nov–Dec 2025"
  title="Documentation refresh (Phase 1)"
  description="Rebuild the VitePress site with accurate navigation, custom components, and tachUI-powered playground hooks."
>
  - ✅ New navigation + hero experience  
  - ✅ Internal playground iframe + Vue fallback components  
  - 🚧 Package + demo landing pages seeded
</DocRoadmapCallout>

<DocRoadmapCallout
  status="Up next"
  timeframe="Phase 2"
  title="Content migration and package coverage"
  description="Move fresh content for core/primitives/modifiers first, then the remaining packages with a repeatable process."
>
  See the [roadmap](/roadmap) for details.
</DocRoadmapCallout>
