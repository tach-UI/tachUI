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

## Subpath Imports

Prefer granular subpaths for better tree-shaking:

```typescript
import { NavigationStack } from '@tachui/navigation/stack'
import { NavigationLink } from '@tachui/navigation/link'
import { TabView } from '@tachui/navigation/tabs'
import { NavigationPath } from '@tachui/navigation/path'
import { NavigationEnvironmentProvider } from '@tachui/navigation/environment'
import { sheet, fullScreenCover, popover } from '@tachui/navigation/sheet'
import { navigationTitle } from '@tachui/navigation/modifiers'
```

Subpath matrix:

- `@tachui/navigation/stack`: stack/split/view container APIs
- `@tachui/navigation/link`: declarative navigation link APIs
- `@tachui/navigation/tabs`: tab navigation APIs
- `@tachui/navigation/path`: path and programmatic navigation APIs
- `@tachui/navigation/environment`: navigation environment + document-head APIs
- `@tachui/navigation/sheet`: sheet/popover/cover presentation APIs
- `@tachui/navigation/modifiers`: pure navigation modifier functions (no global registration side effects)
- `@tachui/navigation/modifiers/register`: explicit modifier-builder registration side effects
- `@tachui/navigation/types`: shared type definitions

Use root `@tachui/navigation` when you intentionally need the full compatibility surface.

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
