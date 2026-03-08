---
title: Component API
---

# Component API

The majority of components share the same base props:

```ts
type BaseProps = {
  id?: string
  class?: string
  style?: Record<string, string>
  children?: TachChild | TachChild[]
}
```

Specialized components (List, NavigationStack, TabView) expose strongly-typed props documented in their package pages. Until the automated API tables return, check the corresponding source files:

| Component | Source |
| --- | --- |
| Lists | `packages/data/src/components/list.ts` |
| NavigationStack | `packages/navigation/src/components/navigation-stack.ts` |
| TabView | `packages/navigation/src/components/tab-view.ts` |
| Form controls | `packages/forms/src/components/*` |
