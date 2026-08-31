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

## Project Type
- TypeScript 5.8+ (strict mode)
- Vite 7+ for build/dev
- Vitest 3.2+ for testing
- bun 1.0+ monorepo
- 20+ packages: core framework + plugins (forms, navigation, etc.)
- VitePress docs
- Demos: calculator, intro app

## Key Locations
- **Source**: `packages/*`
- **Docs**: `docs/`
- **Designs**: `planning/`
- **Demos**: `demos/`
- **Tests**: `__tests__/*.test.ts` per package
- **Root configs**: `package.json`, `bun-workspace.yaml`, `tsconfig.json`, `vitest*.config.ts`

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
- `@tachui/ssr`: Server-side rendering, prerender, HTML serialization
- `@tachui/types`: Shared TypeScript definitions (modifiers, runtime, reactive, layout, etc.)
- `@tachui/cli`: CLI tools
- Others: registry, eslint-plugin-tachui

## Essential Commands
```bash
# Setup
bun install

# Dev servers (per package)
bun run dev:core          # Core
bun run dev:docs          # Docs (VitePress)
bun run dev:navigation    # Navigation
bun run dev:symbols       # Symbols
bun run dev              # All parallel

# Build
bun run build             # All (sequential filter chain, not parallel)
bun run build:core        # Specific package
bun run build:clean       # Clean + test/lint/type-check + build:dev

# Test (~30-40s full suite, 95%+ coverage)
bun run test              # All (vitest run)
bun run test:ci           # CI mode
bun run test:coverage     # With coverage
bun run test:memory-leaks # Memory checks

# Lint/Type-check
bun run lint              # oxlint
bun run type-check        # tsc -r

# Docs
bun run docs:dev          # VitePress dev
bun run docs:build        # Build docs

# Benchmarks
bun run benchmark         # Core perf
bun run benchmark:quick
bun run benchmark:navigation
```

Package-specific: Each has `dev`, `build`, `test`, `valid` (full check).

## Useful Tools
- **Github CLI**: available at `/opt/homebrew/bin/gh`

## Code Patterns & Conventions
- **Components**: Exported functions returning JSX/TSX
- **Modifiers**: Chainable `.modifierName()` directly on component instances (e.g. `Text('hi').padding().bold()`); `.modifier()` is an internal method and must not be exposed in public APIs or docs
- **Reactivity**: Signals/effects from core (SolidJS-like)
- **Tests**: `__tests__/*.test.ts`, Vitest, high coverage, DOM mocks
- **Types**: Strict TS, generated modifier types (`generated-modifiers.d.ts`)
- **Style**: 2-space indent, meaningful names, no 1-letter vars
- **Build**: Vite per package, tree-shakable

## Testing Approach
- Unit: Component/modifier isolation
- Integration: Full renders, reactivity
- Perf/Memory/Security: Specialized suites
- Run after changes: `bun run test` → `bun run build`
- Coverage: 95%+, measured via `bun run test:coverage`

## Gotchas & Non-Obvious
- **Workspaces**: Use `bun run --filter @tachui/pkg` for targeted ops
- **Type Gen**: Modifiers auto-generate types; run `bun run build` to update
- **Tree-shaking**: Modifiers/plugins tree-shake; test bundles
- **Dev Servers**: Don't start unless asked (resource-heavy)
- **Git Hooks**: pre-commit (lint), pre-push (type-check + test:ci)
- **Absolute Paths**: Use workspace aliases (e.g., `@tachui/core`)
- **No Side Effects**: Pure functions, explicit reactivity
- **Design Docs**: Check `planning/` for planning docs; design decisions are captured in GitHub issues directly

## Quality Metrics (Observed)
- Tests: 100+ files, thousands passing
- Packages: 20+ build cleanly
- Bundle: Core ~16-30KB gzipped
- Coverage: 95%+

## CI/CD
- GitHub Actions: lint, type-check, test:ci, build, security scans
