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
- Maintain 100%+ test coverage; ask before removing tests
- Add tests for new code in `__tests__/`
- "SwiftUI" OK in docs/comments, NOT in code/filenames
- Limit emojis
- Never use ticket or issue names in files or tests

## Essential Commands
Standard scripts are in `package.json`. What is not obvious from reading it:

```bash
bun run build     # sequential filter chain, NOT parallel - order matters
bun run test      # full suite, ~30-40s
```

Package-specific: each has `dev`, `build`, `test`, and `valid` (the full check).

Note: `test:memory-leaks` runs `vitest.memory.config.ts`, which globs the memory
suites and sets `FORCE_MEMORY_TESTS`. What that gate means differs per suite, so
four files sit under it with three different coverages:

- `packages/query/__tests__/memory` — deterministic retention checks, ungated.
  They run in the normal suite and in CI as well, and obtain a collector
  in-process, so they need nothing from the runner and work under every pool.
- `memory-usage-tracking` — ungated too, and runs everywhere including CI.
- `memory-leak-component` — skips on CI unless `FORCE_MEMORY_TESTS=true`, which
  nothing in `.github/workflows` sets. So on CI it runs only through this
  script; locally it runs in the normal suite too.
- `modifier-lifecycle` — its memory subset skips without `FORCE_MEMORY_TESTS`
  anywhere, CI or not; the rest of the file runs normally.

`test:long` still points at files that no longer exist and cannot run (#229).

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
