---
title: Interactive Playground
---

# Interactive playground

The new docs experience embeds tachUI itself via an iframe that is generated alongside the VitePress build.

## Phase 1

- ✅ Placeholder iframe served from `.vitepress/public/playground`
- ✅ Vue component (`<DocPlaygroundFrame />`) to reuse across pages
- 🚧 `docs:playground` script to build the tachUI sandbox out-of-repo
- 🚧 Monaco editor + shared storage for code snippets

## Try it

<DocPlaygroundFrame title="Playground preview" />

Want to contribute a module or example? Add an entry under `/docs/guide/in-action/patterns.md` during Phase 2, or open an issue with the snippet you would like to see here.
