# @tachui/ssr

Server-side rendering utilities for TachUI applications.

## Features

- `renderToString(input)` for synchronous HTML serialization.
- `prerender(routes, options)` for static file generation.
- Signal/computed values are resolved as one-time snapshots during serialization.
- Event handler props are omitted from output HTML.

## Installation

```bash
pnpm add @tachui/ssr
```

## Usage

```ts
import { renderToString } from '@tachui/ssr'
import { VStack, Text } from '@tachui/primitives'

const html = renderToString(
  VStack({
    children: [Text('Hello from SSR')],
  })
)
```

Static prerender:

```ts
import { prerender } from '@tachui/ssr/prerender'

await prerender(
  [
    {
      path: '/',
      render: () => App(),
    },
  ],
  {
    outDir: './dist',
  }
)
```

## Scope

This package focuses on initial HTML generation for SEO and static rendering use-cases.
Client hydration helpers are not included in this first pass.
