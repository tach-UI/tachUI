# Security Guidelines for Plugin Authors

TachUI’s plugin architecture lets teams publish modifiers, components, and tooling safely—as long as each package follows a few security best practices. This guide focuses on author responsibilities when targeting the shared `ModifierRegistry`.

## Register Metadata for Every Modifier

- Use `registerModifierWithMetadata` (or the helpers in your package’s `register*Modifiers()` function) to supply:
  - `name` — unique, kebab-case identifier.
  - `category` — aligns with the catalog shown in `@tachui/devtools`.
  - `description` and `usage` snippets for documentation.
  - `priority` — choose a value that matches your package tier (Core: 100‑199, Official plugins: 50‑99, Community: 10‑49).
- Metadata enables type generation and tooling to validate your modifier; missing metadata triggers build-time warnings and fails the `generate-modifier-types --check` task.

## Respect Reserved Names & Priority Ranges

- The registry prevents collisions using a forbidden-name list and priority checks. Avoid generic names (`padding`, `frame`) unless you intentionally override core behaviour.
- If you fork an existing modifier, choose a new name and document how it differs. Consumers can then opt into your modifier explicitly.

## Sanitise User Input

- Call `stateModifier` or `createCustomModifier` with explicit sanitisation for any values that might be user-supplied.
- Reuse helpers from `@tachui/modifiers/utility` (or the security utilities in `@tachui/core/security`) when dealing with HTML, URLs, or untrusted CSS.
- Keep `STRICT_INPUT_SANITIZATION` enabled during development to surface warnings early.

## Run in Hardened Environments

- Encourage consumers to enable `enableBasicSecurity()` (or stricter presets) so plugins run inside the expected sandbox.
- Test your plugin with `WEBWORKER_SANDBOX` and `PLUGIN_CODE_SIGNING` flags toggled on—they change the execution environment and can reveal implicit assumptions.
- If your plugin relies on browser APIs, guard them behind capability checks so they degrade gracefully when the sandbox is active.

## Ship Source Maps & Documentation

- Provide source maps (or at least meaningful stack traces) so consumers can debug issues inside the WebWorker sandbox.
- Publish a README describing required feature flags, environment variables, and how to revoke permissions if something goes wrong.
- Cross-link to your modifier metadata so DevTools can surface documentation inline.

## Testing Checklist Before Release

- `pnpm --filter <your plugin> test` and `pnpm --filter <your plugin> type-check`.
- `pnpm --filter @tachui/core generate-modifier-types:monorepo -- --packages core,<your plugin>` to ensure metadata hydrates correctly.
- Run the CLI migration command (`tacho migrate remove-modifier-trigger --check`) against your sample apps to confirm they are ready for direct modifier chaining.
- Enable `SECURITY_DEV_MODE` and review the logs—the registry warns when metadata is missing or suspicious.

Following these guidelines keeps the ecosystem secure and makes it easier for teams to adopt your plugin in environments with strict security policies.
