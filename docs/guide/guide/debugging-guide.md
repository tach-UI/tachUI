# Debugging Guide

TachUI provides multiple layers of tooling—from CLI helpers to DevTools integrations—to help identify rendering bugs, stale metadata, and performance regressions. Use this guide as a checklist when something goes wrong.

## 1. Start with the CLI

- `tacho dev` spawns package-specific dev servers with built-in HMR guards. Watch the banner output: it reports which packages registered modifiers and whether metadata conflicts were detected.
- `tacho migrate remove-modifier-trigger --dry-run` surfaces legacy modifier chains that still rely on `.*`. Fixing these early prevents proxy mismatches later.
- `tacho analyze` and `tacho optimize` highlight large bundles or duplicated imports that may cause seemingly “random” runtime issues.

## 2. Enable DevTools

- Install `@tachui/devtools` and call its setup routine in development builds. It exposes:
  - Modifier registry inspector (categories, conflicts, metadata).
  - Documentation integration—links back to your modifier metadata/README.
  - Enhanced error panels that display the component tree and last applied modifiers.
- Check the console: DevTools logs when metadata snapshots are missing or stale.

## 3. Inspect Lifecycle Warnings

- Keep `SECURITY_DEV_MODE` enabled (default). It logs warnings for unsanitised HTML, duplicate modifier names, or cloning mistakes.
- When components misbehave after cloning, log `component.modifiers` and `component.id`—if the ID didn’t change the clone may not have been created.
- Use `useLifecycle` hooks (`onMount`, `onDOMReady`) to console-log DOM nodes and confirm elements reconcile the way you expect.

## 4. Verify Metadata & Types

- Run `pnpm --filter @tachui/core generate-modifier-types -- --check` to catch stale declaration files.
- Examine `packages/core/src/types/generated-modifiers.d.ts` if TypeScript reports missing modifiers. Regenerate and commit the file if necessary.
- ESLint with `@tachui/prefer-direct-modifiers` flags lingering legacy builder usage so TypeScript typings stay accurate.

## 5. Profile Performance Issues

- Use `pnpm benchmark:quick` for fast, reproducible performance checks in CI.
- `pnpm benchmark:browser:quick` profiles real browser behaviour—capture the output before and after your change to validate improvements.
- For runtime spikes, enable the performance overlay in DevTools and inspect which modifiers are rebuilding frequently.

## 6. Common Hotspots

- **HMR reloads**: After editing modifiers run `registerCoreModifiers({ force: true })` or restart the dev server to avoid stale factories.
- **Scroll views**: If content stops updating, ensure you reassign new arrays/signals rather than mutating the existing list in place.
- **Async actions**: Wrap asynchronous button handlers in try/catch and log errors; unhandled rejections can stop downstream effects from firing.

## 7. When All Else Fails

- Capture the reproduction as a fixture in `packages/core/__tests__` or `packages/primitives/__tests__`—the test runner makes it easier to debug without the full dev server.
- File an issue with logs from the CLI/DevTools plus the output of `pnpm --filter @tachui/core generate-modifier-types -- --check --fail-on-conflict`.

Combining these techniques should help you isolate most modifier, cloning, and performance issues without resorting to guesswork.
