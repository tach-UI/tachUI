---
cssclasses:
  - full-page
---

# tachUI Framework
SwiftUI-inspired web UI framework for web with SolidJS-style reactivity. Monorepo using pnpm workspaces.

## Important Guidelines
- Never run dev servers yourself; coordinate with the user for runtime verification.
- Always ask before removing, skipping, or restructuring tests.
- Resolve root causes instead of relying on temporary workarounds unless instructed otherwise.
- Follow ALL instructions here strictly
- Be direct; ask for clarification if needed
- Minimize code changes; check existing implementations first
- `pnpm build` MUST succeed after every change
- Maintain 95%+ test coverage; ask before removing tests
- Add tests for new code in `__tests__/`
- "SwiftUI" OK in docs/comments, NOT in code/filenames
- Limit emojis

## Project Type
- TypeScript 5.8+ (strict mode)
- Vite 7+ for build/dev
- Vitest 3.2+ for testing
- pnpm 10+ monorepo
- 20+ packages: core framework + plugins (forms, navigation, etc.)
- VitePress docs
- Demos: calculator, intro app

## Key Locations
- **Source**: `packages/*`
- **Docs**: `docs/`
- **Designs**: `design/`
- **Demos**: `demos/`
- **Tests**: `__tests__/*.test.ts` per package
- **Root configs**: `package.json`, `pnpm-workspace.yaml`, `tsconfig.json`, `vitest*.config.ts`

## Packages
- `@tachui/core`: Reactivity (signals), runtime, base modifiers
- `@tachui/primitives`: Base UI (VStack, Text, Button)
- `@tachui/modifiers`: 200+ modifiers (.padding(), .background(), etc.)
- `@tachui/flow-control`: If/Show/ForEach
- `@tachui/data`: List, Menu
- `@tachui/forms`: Forms, validation, inputs
- `@tachui/grid`: CSS Grid (Grid, LazyVGrid)
- `@tachui/navigation`: NavigationStack, TabView
- `@tachui/mobile`: ActionSheet, Alert
- `@tachui/responsive`: Breakpoints, media queries
- `@tachui/viewport`: Window/viewport management
- `@tachui/symbols`: Icons (Lucide + SF Symbols mapping)
- `@tachui/devtools`: Debug, profiler
- `@tachui/cli`: CLI tools
- Others: types, registry, eslint-plugin-tachui

## Essential Commands
```bash
# Setup
pnpm install

# Dev servers (per package)
pnpm dev:core          # Core
pnpm dev:docs          # Docs (VitePress)
pnpm dev:navigation    # Navigation
pnpm dev:symbols       # Symbols
pnpm dev              # All parallel

# Build
pnpm build             # All (pnpm -r build)
pnpm build:core        # Specific package
pnpm build:clean       # Clean + test/lint/type-check + build:dev

# Test (~30-40s full suite, 95%+ coverage)
pnpm test              # All (vitest run)
pnpm test:ci           # CI mode
pnpm test:coverage     # With coverage
pnpm test:memory-leaks # Memory checks

# Lint/Type-check
pnpm lint              # oxlint
pnpm type-check        # tsc -r

# Docs
pnpm docs:dev          # VitePress dev
pnpm docs:build        # Build docs

# Benchmarks
pnpm benchmark         # Core perf
pnpm benchmark:quick
pnpm benchmark:navigation
```

Package-specific: Each has `dev`, `build`, `test`, `valid` (full check).

## Code Patterns & Conventions
- **Components**: Exported functions returning JSX/TSX
- **Modifiers**: Chainable `.modifier()` from `@tachui/core`
- **Reactivity**: Signals/effects from core (SolidJS-like)
- **Tests**: `__tests__/*.test.ts`, Vitest, high coverage, DOM mocks
- **Types**: Strict TS, generated modifier types (`generated-modifiers.d.ts`)
- **Style**: 2-space indent, meaningful names, no 1-letter vars
- **Build**: Vite per package, tree-shakable

## Testing Approach
- Unit: Component/modifier isolation
- Integration: Full renders, reactivity
- Perf/Memory/Security: Specialized suites
- Run after changes: `pnpm test` → `pnpm build`
- Coverage: 95%+, measured via `pnpm test:coverage`

## Gotchas & Non-Obvious
- **Workspaces**: Use `pnpm --filter @tachui/pkg` for targeted ops
- **Type Gen**: Modifiers auto-generate types; run `pnpm build` to update
- **Tree-shaking**: Modifiers/plugins tree-shake; test bundles
- **Dev Servers**: Don't start unless asked (resource-heavy)
- **Git Hooks**: pre-commit (lint), pre-push (type-check + test:ci)
- **Absolute Paths**: Use workspace aliases (e.g., `@tachui/core`)
- **No Side Effects**: Pure functions, explicit reactivity
- **Design Docs**: Check `design/` before implementing

## Quality Metrics (Observed)
- Tests: 100+ files, thousands passing
- Packages: 20+ build cleanly
- Bundle: Core ~16-30KB gzipped
- Coverage: 95%+

## CI/CD
- GitHub Actions: lint, type-check, test:ci, build, security scans
