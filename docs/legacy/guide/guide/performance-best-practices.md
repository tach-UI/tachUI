# Performance Best Practices

TachUI is designed to stay responsive even as modifier chains grow. These practices keep applications fast in both development and production.

## Lean Imports & Tree Shaking

- **Prefer `@tachui/modifiers` for concrete modifiers.** It auto-registers metadata and keeps runtime bundles small. Import only what you use.
- **Avoid re-exporting modifiers from app-level barrels** unless your bundler aggressively treeshakes; otherwise the entire modifier catalog might ship to clients.
- **Code-split heavy packages** (navigation, data, responsive) with dynamic imports so rarely used flows do not impact initial load.

## Keep Modifier Metadata Fresh

- Run `pnpm --filter @tachui/core generate-modifier-types -- --check` in CI to catch stale declarations before publishing.
- After creating or renaming modifiers, regenerate types and commit both the declaration (`generated-modifiers.d.ts`) and snapshot JSON so consumers stay in sync.
- Enforce the ESLint rule `@tachui/prefer-direct-modifiers` to guarantee code paths use the proxy layer that benefits from metadata caching.

## Work With the Component Proxy

- **Reuse base components via `clone()`** instead of rebuilding modifier chains; cloning preserves cached modifier functions and keeps GC churn low.
- Apply additional modifiers directly on clones. Mutating the original component after a clone can invalidate caches and cause extra diffing work.
- For HMR scenarios, call `registerCoreModifiers({ force: true })` after editing modifier modules so stale factories are purged without restarting the dev server.

## Measure Early & Often

- Use `pnpm benchmark:quick` while tuning modifiers; it exercises the registry in a controlled JSDOM environment.
- Run `pnpm benchmark:browser:quick` for real browser timings before merging large styling changes.
- Treat the calculator and intro demos as smoke tests—build them (`pnpm --filter @tachui/calculator-app build`, `pnpm --filter @tachui/intro-app build`) to verify bundle size stays within expectations.

## Reduce Re-render Pressure

- Prefer derived signals (`createComputed`) to prepare formatted strings or layout data rather than rebuilding modifier chains inside effects.
- Pre-clone frequently reused view templates and reuse the clones inside animation frames or timers.
- Stream large lists into `ForEach` within `ScrollView`; the built-in recycling avoids destroying modifiers between scroll frames.

## Tooling Hooks Worth Enabling

- Keep `SECURITY_DEV_MODE` enabled in development—it logs warnings for unsafe HTML modifiers that often trigger costly reflows.
- Run targeted performance tests such as `packages/core/__tests__/performance/memory-usage-tracking.test.ts` before publishing modifier-heavy releases.
- Install `@tachui/devtools` during development to inspect modifier hydration costs and confirm registry metadata is loading as expected.

Following these guidelines keeps the proxy-based modifier system fast and predictable as teams add new modifiers and plugins.
