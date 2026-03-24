# @tachui/cli

Developer CLI for TachUI.

## Quick Start

Use `npx` without a global install:

```bash
npx @tachui/cli init my-app
cd my-app
npm install
npm run dev
```

## Init Command

```bash
tacho init <target> [options]
```

Examples:

```bash
npx @tachui/cli init my-app --template basic --yes
npx @tachui/cli init my-app --template advanced --yes
npx @tachui/cli init . --template basic --yes
npx @tachui/cli init my-app --tachui-version 0.8.0-alpha --yes
```

Options:

- `--template <template>`: `basic` or `advanced`
- `--yes`: skip prompts
- `--tachui-version <version>`: version to use for generated `@tachui/*` dependencies
- `--package-manager <npm|pnpm>`: controls next-step output only (does not change generated scripts)
- `--list-templates`: print available templates

Notes:

- `phase6` template naming has been removed. Use `advanced`.
- `--yes` requires an explicit target, for example `init my-app --yes`.
- By default, generated `@tachui/*` dependency versions are derived from the CLI package version.
- This assumes TachUI packages are co-published at matching versions. Use `--tachui-version` to override.

## Development Server Path

Scaffolded projects default to plain Vite scripts:

- `npm run dev`
- `npm run build`

`tacho dev` remains available as optional enhanced CLI workflow.

## Other Commands

- `tacho dev`
- `tacho generate`
- `tacho migrate`
- `tacho analyze`
- `tacho optimize`

Run `tacho <command> --help` for command-specific flags.
