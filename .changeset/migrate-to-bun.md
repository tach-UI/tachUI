---
"tachui": major
---

# Migration from pnpm to bun package manager

## Summary

Migrated the entire monorepo from pnpm to bun for faster package installation and simpler toolchain management.

## Breaking Changes

### Package Manager
- **pnpm** has been replaced with **bun** (v1.2.0)
- All contributors must install bun: `curl -fsSL https://bun.sh/install | bash`

### Commands
| Before (pnpm) | After (bun) |
|--------------|-------------|
| `pnpm install` | `bun install` |
| `pnpm dev` | `bun run dev` |
| `pnpm build` | `bun run build` |
| `pnpm --filter <pkg>` | `bun run --filter <pkg>` |
| `pnpm exec <cmd>` | `bunx <cmd>` |

### Lock File
- `pnpm-lock.yaml` has been deleted
- `bun.lockb` will be generated on first `bun install`

### Workspace Configuration
- `pnpm-workspace.yaml` has been removed
- Workspaces are now defined in root `package.json`:
  ```json
  "workspaces": ["packages/*", "docs/guide"]
  ```

## Files Changed

### Root Configuration
- `package.json` - Updated packageManager, scripts, and workspaces
- Deleted `pnpm-workspace.yaml`
- Deleted `pnpm-lock.yaml`

### Package Updates (25+ files)
All `package.json` files updated to use bun commands:
- `pnpm type-check` → `bun run type-check`
- `pnpm lint` → `bun run lint`
- `pnpm build` → `bun run build`

### CI/CD Workflows (5 files)
- `.github/workflows/ci.yml`
- `.github/workflows/release.yml`
- `.github/workflows/docs-api.yml`
- `.github/workflows/benchmark-report.yml`
- `.github/workflows/auto-merge-changeset-release.yml`

Changes:
- Replaced `pnpm/action-setup@v4` with `oven-sh/setup-bun@v2`
- Removed `cache: 'pnpm'` configurations
- Updated all commands from `pnpm` to `bun`

### Documentation
- `AGENTS.md` - Updated all pnpm references
- `CONTRIBUTING.md` - Updated prerequisites and commands
- `README.md` - Updated installation instructions

## Benefits

- ⚡ **3-5x faster package installation**
- 📦 **Single binary** - no separate Node.js requirement for package management
- 🔧 **Built-in TypeScript** and bundler support
- 🚀 **Modern tooling** with rapid improvements
- 📁 **Simpler workspace configuration** in package.json

## Migration Guide for Contributors

1. Install bun:
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. Reinstall dependencies:
   ```bash
   rm -rf node_modules
   bun install
   ```

3. Update IDE/editor settings if you had pnpm-specific configurations

4. Update any local scripts or aliases from `pnpm` to `bun`

## Related Issues

Closes #201
