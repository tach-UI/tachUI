---
"@tachui/cli": patch
"@tachui/core": patch
"@tachui/data": patch
"@tachui/devtools": patch
"@tachui/eslint-plugin-tachui": patch
"@tachui/flow-control": patch
"@tachui/forms": patch
"@tachui/grid": patch
"@tachui/mobile": patch
"@tachui/modifiers": patch
"@tachui/navigation": patch
"@tachui/primitives": patch
"@tachui/registry": patch
"@tachui/responsive": patch
"@tachui/ssr": patch
"@tachui/symbols": patch
"@tachui/types": patch
"@tachui/viewport": patch
---

Migrate package manager from pnpm to bun

- Replace pnpm with bun (v1.2.0) as package manager
- Update all package scripts from pnpm to bun equivalents  
- Migrate workspace configuration from pnpm-workspace.yaml to package.json workspaces
- Update CI/CD workflows to use oven-sh/setup-bun@v2
- Update documentation with bun commands

Note: This is a tooling change only - no API changes to packages.
