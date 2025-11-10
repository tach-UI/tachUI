# @tachui/eslint-plugin

ESLint rules that help teams migrate to the direct modifier syntax introduced in the Phase 6+ tachUI runtime.

## Installation

```bash
pnpm add -D @tachui/eslint-plugin eslint
```

If you rely on the TypeScript parser, ensure `@typescript-eslint/parser` is already configured in your ESLint setup.

## Usage

Update your ESLint configuration to enable the plugin and the `prefer-direct-modifiers` rule:

```json
{
  "plugins": ["@tachui"],
  "rules": {
    "@tachui/prefer-direct-modifiers": "warn"
  }
}
```

## Rules

### `prefer-direct-modifiers`

- **Purpose:** catches legacy `.modifier.*` chaining and encourages the new direct modifier calls that rely on the component proxy.
- **Fixable:** yes – the rule removes the `.modifier` trigger and preserves optional chaining when present.
- **Typical before/after:**

```ts
// Before
Text("Hello").modifier.padding(16).backgroundColor("#222")

// After
Text("Hello").padding(16).backgroundColor("#222")
```

The fixer also understands optional chaining:

```ts
maybeComponent?.modifier?.padding(8)
// becomes
maybeComponent?.padding(8)
```

### Oxlint

Oxlint can load the rule through its ESLint compatibility layer. Point oxlint at your existing ESLint config or supply the plugin on the command line:

```bash
oxlint --plugin @tachui/eslint-plugin --rule @tachui/prefer-direct-modifiers=warn packages
```

When you already have an `.eslintrc`, ensure it lists `"plugins": ["@tachui"]` and run `oxlint --config ./path/to/.eslintrc`. The rule will then participate in the same lint step that enforces the rest of your Oxlint policies.

## Contributing

- `pnpm --filter @tachui/eslint-plugin test` – run the Vitest suite
- `pnpm --filter @tachui/eslint-plugin type-check` – strict TypeScript validation
- `pnpm --filter @tachui/eslint-plugin build` – generate the distributable output
