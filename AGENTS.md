---
cssclasses:
  - full-page
---

# tachUI Framework
SwiftUI-inspired web UI framework for web with SolidJS-style reactivity. Monorepo using bun workspaces.

## Important Guidelines
- Never run dev servers yourself; coordinate with the user for runtime verification.
- Always ask before removing, skipping, or restructuring tests.
- Resolve root causes instead of relying on temporary workarounds unless instructed otherwise.
- Follow ALL instructions here strictly
- Be direct; ask for clarification if needed
- Minimize code changes; check existing implementations first
- `bun run build` MUST succeed after every change
- Maintain 95%+ test coverage; ask before removing tests
- Add tests for new code in `__tests__/`
- "SwiftUI" OK in docs/comments, NOT in code/filenames
- Limit emojis

## Essential Commands
Standard scripts are in `package.json`. What is not obvious from reading it:

```bash
bun run build     # sequential filter chain, NOT parallel - order matters
bun run test      # full suite, ~30-40s
```

Package-specific: each has `dev`, `build`, `test`, and `valid` (the full check).

Note: `test:memory-leaks` and `test:long` currently point at files that no longer
exist and cannot run (#229).

## Code Patterns & Conventions
- **Components**: Exported functions returning JSX/TSX
- **Modifiers**: Chainable `.modifierName()` directly on component instances (e.g. `Text('hi').padding().bold()`); `.modifier()` is an internal method and must not be exposed in public APIs or docs
- **Reactivity**: Signals/effects from core (SolidJS-like)
- **Tests**: `__tests__/*.test.ts`, Vitest, high coverage, DOM mocks
- **Types**: Strict TS, generated modifier types (`generated-modifiers.d.ts`)
- **Style**: 2-space indent, meaningful names, no 1-letter vars
- **Build**: Vite per package, tree-shakable

## Testing Approach
- Run after changes in this order: `bun run test` then `bun run build`
- Specialized suites exist for perf, memory, and security

## Gotchas & Non-Obvious
- **Workspaces**: Use `bun run --filter @tachui/pkg` for targeted ops
- **Type Gen**: Modifiers auto-generate types; run `bun run build` to update
- **Tree-shaking**: Modifiers/plugins tree-shake; test bundles
- **Dev Servers**: Don't start unless asked (resource-heavy)
- **Git Hooks**: pre-commit (lint), pre-push (type-check + test:ci)
- **Absolute Paths**: Use workspace aliases (e.g., `@tachui/core`)
- **No Side Effects**: Pure functions, explicit reactivity
- **Design Docs**: Check `planning/` for planning docs; design decisions are captured in GitHub issues directly

