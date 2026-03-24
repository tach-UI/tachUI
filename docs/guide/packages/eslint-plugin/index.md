---
title: '@tachui/eslint-plugin'
---

# @tachui/eslint-plugin

ESLint plugin for TachUI projects, focused on migration safety and modifier-style consistency for direct modifier chaining.

## When to use it

Use this package when migrating older code that still uses `.modifier.*` and you want automated enforcement toward direct chaining (`Text(...).padding(...)`).

## Installation

```bash
pnpm add -D @tachui/eslint-plugin eslint
```

## Configuration

### Legacy `.eslintrc` format

```json
{
  "plugins": ["@tachui"],
  "rules": {
    "@tachui/prefer-direct-modifiers": "warn"
  }
}
```

### Flat config (`eslint.config.js`)

```js
import tachui from '@tachui/eslint-plugin'

export default [
  {
    plugins: {
      '@tachui': tachui,
    },
    rules: {
      '@tachui/prefer-direct-modifiers': 'warn',
    },
  },
]
```

## Rule: `prefer-direct-modifiers`

- Catches chained `.modifier.<name>(...)` usage and reports the nested `modifier` trigger.
- Auto-fix is supported (`fixable: "code"`), including optional chaining forms.
- No rule options today (`schema: []`).
- Rule metadata type is `suggestion` (not `problem`).

### Before / after

```ts
// Before
Text('Hello').modifier.padding(16).modifier.backgroundColor('#222')
maybeText?.modifier?.fontWeight('bold')

// After (auto-fix with --fix)
Text('Hello').padding(16).backgroundColor('#222')
maybeText?.fontWeight('bold')
```

[View README on GitHub](https://github.com/tach-ui/tachUI/tree/main/packages/eslint-plugin-tachui/README.md)
