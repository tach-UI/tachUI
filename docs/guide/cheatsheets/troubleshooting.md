---
title: Troubleshooting
---

# Troubleshooting

| Symptom | Fix |
| --- | --- |
| Modifiers undefined | Ensure `@tachui/modifiers` is installed so fluent modifier methods (e.g., `.padding(16)`) are available—no extra builder calls required |
| Navigation state lost on refresh | Use `NavigationStack` with `path` state or persist via `createSignal` in a parent scope |
| Playground iframe blank | Run `pnpm docs:dev` (Phase 1) or rebuild the placeholder assets |
| Type errors on custom modifiers | Re-run the modifier type generation script (`pnpm --filter @tachui/modifiers generate:types`) |

Report additional issues in the [GitHub discussions](https://github.com/tach-ui/tachUI/discussions).
