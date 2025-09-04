# TypeScript Configuration Solutions

## Problem: `--noEmit` vs Project References

**Issue**: TypeScript's `tsc --noEmit` flag doesn't work well with project references when referenced projects have `composite: true`. This results in error TS6310: "Referenced project may not disable emit."

**Root Cause**: The `--noEmit` flag conflicts with TypeScript's project reference system which expects all referenced projects to emit declaration files.

## Solution

We use a **dual TypeScript configuration approach**:

1. **Main `tsconfig.json`**: Used for building, includes project references for proper dependency resolution
2. **Separate `tsconfig.type-check.json`**: Used only for type checking, excludes project references to avoid the TS6310 error

### Automated Setup

Use the provided script to set up proper type checking for any package:

```bash
# Setup type checking for a specific package
node tools/setup-type-check.js packages/symbols

# Setup from within a package directory
cd packages/symbols
node ../../tools/setup-type-check.js
```

### Manual Setup

1. Create `tsconfig.type-check.json` in the package root:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "__tests__"]
}
```

2. Update the `type-check` script in `package.json`:

```json
{
  "scripts": {
    "type-check": "tsc --project tsconfig.type-check.json"
  }
}
```

## Architecture Benefits

### ✅ **Dual Configuration Benefits**

- **Build process**: Uses project references for proper dependency resolution
- **Type checking**: Isolated from project reference complexity
- **Development**: No impact on existing workflows
- **CI/CD**: Type checking works reliably across all packages

### ✅ **Maintains Full Type Safety**

- Type checking still validates all TypeScript code
- Build process includes comprehensive type checking via Vite DTS plugin
- No reduction in type safety guarantees

### ✅ **Scalable Solution**

- Works consistently across all packages in the monorepo
- Automated tooling for easy application
- No package-specific configuration needed

## Files Created

- `tools/tsconfig-type-check-template.json` - Template for type-check configurations
- `tools/setup-type-check.js` - Automated setup script
- `packages/*/tsconfig.type-check.json` - Generated type-check configs (per package)

## Applied To

- ✅ `@tachui/symbols` - Tested and working

## Recommended Application

Apply this solution to all packages that:

1. Have TypeScript project references in their main `tsconfig.json`
2. Use `tsc --noEmit` for type checking
3. Experience TS6310 errors during type checking

This approach ensures reliable type checking across the entire monorepo while maintaining the benefits of TypeScript's project reference system for builds.
