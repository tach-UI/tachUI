---
title: '@tachui/navigation'
---

# @tachui/navigation

Provides NavigationStack, NavigationLink, TabView, deep linking, and route utilities. The modal/sheet system is the top roadmap item for v0.9 → v1.0.

## Status

- ✅ Stack + tab navigation, path-driven routing
- ✅ Deep link + programmatic navigation helpers
- ✅ Per-view document metadata (`DocumentHead`, `withDocumentHead`, `useDocumentMeta`)
- 🚧 Sheet / modal presentation (`.sheet`, `.fullScreenCover`)
- 🚧 NavigationSplitView for desktop/tablet surfaces
- 🚧 `.searchable()` with suggestions

## Install

```bash
pnpm add @tachui/navigation
```

Follow progress via the [Phase 2 navigation enhancement design doc](/design-docs/Enh-NavigationPlugin.md).

## Per-view SEO metadata

`DocumentHead` metadata is merged from the navigation stack root to the active view. Deeper views override only the fields they set.

```typescript
import { DocumentHead, NavigationStack } from '@tachui/navigation'

const root = DocumentHead(
  {
    title: 'Home',
    titleTemplate: '%s — Acme',
    description: 'Default description',
  },
  HomeScreen()
)

const product = DocumentHead(
  { title: 'Widget Pro', canonical: '/products/widget-pro' },
  ProductScreen()
)

NavigationStack(root)
```
