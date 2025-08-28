---
cssclasses:
  - full-page
---

# TachUI Linting Setup

This document covers the linting setup for the TachUI monorepo using [oxlint](https://www.npmjs.com/package/oxlint), a high-performance JavaScript and TypeScript linter.

## Overview

TachUI uses oxlint for fast, zero-configuration linting across all packages and applications. oxlint is part of the Oxidation Compiler (Oxc) project and provides excellent performance with minimal setup overhead.

## Configuration

### Main Configuration File

The linting configuration is defined in `.oxlintrc.json` at the project root:

```json
{
  "plugins": [
    "unicorn",
    "typescript", 
    "oxc"
  ],
  "categories": {
    "correctness": "warn",
    "suspicious": "warn"
  },
  "rules": {
    "typescript/no-extra-non-null-assertion": "off",
    "no-unused-vars": ["warn", { 
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_",
      "caughtErrorsIgnorePattern": "^_"
    }]
  },
  "overrides": [
    // Test files and benchmarks - more permissive rules
    {
      "files": [
        "**/examples/**",
        "**/docs/**", 
        "**/*.test.ts",
        "**/*.spec.ts",
        "**/*.benchmark.ts",
        "**/benchmarks/**",
        "**/__tests__/**"
      ],
      "rules": {
        "typescript/no-explicit-any": "off",
        "typescript/ban-types": "off",
        "no-unused-vars": "off",
        "unicorn/consistent-function-scoping": "off"
      }
    },
    // Framework internals - allow explicit any where needed
    {
      "files": [
        "**/compiler/**",
        "**/assets/**",
        "**/navigation/**",
        "**/viewport/**",
        "**/types.ts",
        "**/components/List.ts",
        "**/components/Menu.ts",
        "**/components/ScrollView.ts", 
        "**/components/Show.ts",
        "**/components/Stepper.ts",
        "**/components/Text.ts",
        "**/components/wrapper.ts",
        "**/modifiers/**",
        "**/plugins/**",
        "**/reactive/**",
        "**/developer-experience/**",
        "**/globals.d.ts",
        "packages/forms/**"
      ],
      "rules": {
        "typescript/no-explicit-any": "off"
      }
    }
  ],
  "ignorePatterns": [
    "node_modules",
    "dist", 
    "build",
    ".next",
    "coverage"
  ]
}
```

### Rule Categories

- **correctness**: Code that is outright wrong or useless (enabled as warnings)
- **suspicious**: Code that is most likely wrong or useless (enabled as warnings)
- **pedantic**: Rather strict rules with occasional false positives (disabled by default)
- **style**: Code style recommendations (disabled by default)
- **nursery**: New rules under development (disabled by default)

### Underscore Prefix Convention

Variables, parameters, and catch blocks prefixed with `_` are ignored by the `no-unused-vars` rule:

```typescript
// ✅ No warnings - underscore prefix indicates intentionally unused
const _unusedVar = getValue()
function handler(_unusedParam: string) { /* ... */ }
try { 
  risky() 
} catch (_error) { 
  // Error handling without using the error object
}

// ⚠️ Warnings - should be prefixed with _ if intentionally unused  
const unusedVar = getValue()
function handler(unusedParam: string) { /* ... */ }
catch (error) { /* ... */ }
```

### Enabled Plugins

- **typescript**: TypeScript-specific linting rules
- **unicorn**: Additional JavaScript/TypeScript best practices
- **oxc**: Oxlint's unique rules for performance and correctness

## Usage

### Command Line Scripts

Available linting commands:

```bash
# Lint all packages and apps
pnpm lint

# Lint with auto-fix
pnpm lint:fix

# Lint specific package (from package root)
cd packages/forms
pnpm lint
```

### Individual Package Configuration

Packages can override the root configuration. For example, in `packages/forms/package.json`:

```json
{
  "scripts": {
    "lint": "oxlint src"
  }
}
```

### Command Line Options

oxlint supports many CLI options:

```bash
# Show help
npx oxlint --help

# List all available rules
npx oxlint --rules

# Lint with specific rule categories
npx oxlint --allow=pedantic --deny=style packages apps

# Enable additional plugins
npx oxlint --react-plugin --jsx-a11y-plugin packages apps

# Fix issues automatically
npx oxlint --fix packages apps

# Print configuration being used
npx oxlint --print-config
```

### Rule Categories Control

You can accumulate rules from left to right:

```bash
# Allow all pedantic rules but deny specific ones
oxlint -A pedantic -D no-debugger packages apps

# Enable all categories except nursery
oxlint -A all packages apps
```

### Output Formats

oxlint supports various output formats:

```bash
# GitHub Actions format
oxlint --format=github packages apps

# JSON output
oxlint --format=json packages apps

# Unix format  
oxlint --format=unix packages apps
```

## IDE Integration

### VS Code

Install the oxlint VS Code extension for real-time linting in the editor:

1. Search for "oxlint" in VS Code extensions
2. Install the official oxlint extension
3. The extension will automatically use the `.oxlintrc.json` configuration

### Other IDEs

Most TypeScript-aware IDEs can integrate with oxlint through:
- Language Server Protocol (LSP) support
- External tools configuration
- File watcher integration

## Monorepo Structure

The configuration is designed for TachUI's monorepo structure:

```
├── packages/           # Core framework packages
│   ├── core/          # Main framework
│   ├── forms/         # Forms plugin  
│   ├── navigation/    # Navigation plugin
│   └── cli/           # CLI tools
├── apps/              # Example applications
│   ├── docs/          # Documentation site
│   └── calculator/    # Calculator demo app
└── .oxlintrc.json     # Root linting configuration
```

### Package-Specific Rules

- **Test files** (`**/*.test.ts`, `**/__tests__/**`): Relaxed rules for unused variables and function scoping
- **Framework internals**: Allow explicit `any` types where needed for flexibility
- **Examples and docs**: Permissive rules for demonstration code
- **Benchmarks**: Relaxed rules for performance testing code

## Performance

oxlint is designed for speed:

- **Zero configuration**: Works out of the box with sensible defaults
- **Rust-based**: Significantly faster than ESLint or Biome
- **Parallel processing**: Utilizes multiple CPU cores automatically
- **Incremental**: Only lints changed files in watch mode

## Troubleshooting

### Common Issues

1. **Config not found**: Ensure `.oxlintrc.json` exists in project root
2. **Rules not applying**: Check file patterns in overrides match your file structure
3. **Performance issues**: Use `--threads=1` to limit CPU usage if needed

### Debug Configuration

```bash
# Print the configuration being used
npx oxlint --print-config

# Run with maximum verbosity
npx oxlint --threads=1 packages apps
```

### Disable Specific Rules

For one-off rule disabling, use comments:

```typescript
// eslint-disable-next-line no-unused-vars
const unusedVar = 'temporary'

/* eslint-disable typescript/no-explicit-any */
const anyValue: any = getData()
/* eslint-enable typescript/no-explicit-any */
```

## Migration from Biome

This project was migrated from Biome to oxlint. Key differences:

- **Performance**: oxlint is significantly faster
- **Configuration**: Simpler, more focused configuration
- **Rules**: Different rule set, some Biome rules not available
- **Formatting**: oxlint is linting-only (no formatting like Biome)

## Contributing

When contributing to TachUI:

1. Run `pnpm lint` before committing
2. Fix any linting errors with `pnpm lint:fix` when possible
3. Add appropriate eslint-disable comments for intentional rule violations
4. Update this README if you modify the linting configuration

## Resources

- [oxlint Documentation](https://www.npmjs.com/package/oxlint)
- [Oxc Project](https://oxc-project.github.io/)
- [Rule Categories](https://oxc-project.github.io/docs/guide/usage/linter.html#rule-categories)
- [Available Rules](https://oxc-project.github.io/docs/guide/usage/linter/rules.html)