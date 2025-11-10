---
title: tachUI
---

<DocHero
  title="SwiftUI superpowers for the web"
  description="tachUI pairs SolidJS-style reactivity with SwiftUI ergonomics so you can ship interactive web apps without re-learning everything you love about declarative UI."
>
  <template #actions>
    <a class="tach-button" href="/guide/getting-started">Get started</a>
    <a class="tach-button secondary" href="/showcase">Explore showcase</a>
    <a class="tach-button ghost" href="/roadmap">Roadmap</a>
  </template>
</DocHero>

<div class="tach-stat-grid">
  <DocStat value="71+" label="Components" />
  <DocStat value="130+" label="Modifiers" />
  <DocStat value="16" label="Packages" />
  <DocStat value="3,687" label="Tests" />
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
- `packages/` – deep dives for each of the 16 packages
- `in-action/` – live playgrounds, galleries, and real-world blueprints
- `cheatsheets/` – quick reference tables for components and modifiers
- `api/` – typed API reference powered by TypeDoc
- `demos/` – calculator, intro experience, and upcoming showcases
- `resources/` – tooling, community, learning material

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
