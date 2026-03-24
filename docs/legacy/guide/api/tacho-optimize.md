# Tacho CLI - Bundle Optimization Commands

The Tacho CLI includes powerful bundle optimization commands that integrate the Epic Pico bundle optimization system directly into your development workflow.

## Installation

The optimization commands are included with the Tacho CLI:

```bash
npm install -g @tachui/cli
# or
npx tacho --help
```

## Commands Overview

| Command | Description | Use Case |
|---------|-------------|----------|
| `tacho optimize analyze` | Analyze application bundle usage | Get optimization recommendations |
| `tacho optimize migrate` | Migrate to optimized bundles | Apply optimizations safely |
| `tacho optimize rollback` | Rollback migration changes | Undo optimization if issues |
| `tacho optimize build` | Generate optimized bundles | Create production bundles |

## `tacho optimize analyze`

Analyzes your TachUI application to identify bundle optimization opportunities.

### Usage

```bash
# Analyze current directory
npx tacho optimize analyze

# Analyze specific directory
npx tacho optimize analyze ./src

# Verbose analysis with detailed recommendations
npx tacho optimize analyze --verbose

# Generate analysis report file
npx tacho optimize analyze --output analysis.json
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--verbose` | Show detailed analysis information | `false` |
| `--output <file>` | Save analysis report to JSON file | - |
| `--format <type>` | Output format: `json`, `table`, `markdown` | `table` |

### Example Output

```bash
$ npx tacho optimize analyze

🔍 TachUI Bundle Optimization Analysis

📁 Project: calculator-app
📂 Source files: 8 files analyzed
📦 Current bundle: 3.8MB (estimated)

📊 Component Usage Analysis:
┌─────────────────┬─────────┬───────────┬──────────────┐
│ Component       │ Count   │ Essential │ Bundle Impact│
├─────────────────┼─────────┼───────────┼──────────────┤
│ Text            │ 3       │ Yes       │ 3KB          │
│ Button          │ 12      │ Yes       │ 4.5KB        │
│ HStack          │ 4       │ Yes       │ 1.5KB        │
│ VStack          │ 2       │ Yes       │ 1.5KB        │
│ BasicInput      │ 1       │ No        │ 2.5KB        │
└─────────────────┴─────────┴───────────┴──────────────┘

🎯 Optimization Recommendations:

✅ HIGH CONFIDENCE: Switch to 'minimal-production'
   📦 Expected bundle size: 50KB
   💰 Savings: 99% reduction (3.75MB saved)
   🎬 Components supported: All components you use
   
🔧 Required changes:
   1. Add tachUIBundlePlugin to vite.config.ts
   2. Configure bundle: 'minimal-production'
   3. No code changes needed

⚡ Performance Impact:
   📥 Load time: 2000ms → 100ms
   🧠 Parse time: 300ms → 15ms
   📱 Mobile friendly: Excellent

💡 Next steps:
   Run: npx tacho optimize migrate --dry-run
```

## `tacho optimize migrate`

Migrates your application to use optimized bundle configurations with automatic backup and rollback support.

### Usage

```bash
# Preview migration (safe, no changes)
npx tacho optimize migrate --dry-run

# Execute migration with automatic backup
npx tacho optimize migrate

# Execute migration to specific bundle
npx tacho optimize migrate --bundle minimal-production

# Execute migration without backup (not recommended)
npx tacho optimize migrate --no-backup

# Continue migration even if some steps fail
npx tacho optimize migrate --continue-on-error
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--dry-run` | Preview changes without applying them | `false` |
| `--bundle <name>` | Target bundle configuration | Auto-detected |
| `--backup` / `--no-backup` | Create backup before migration | `true` |
| `--continue-on-error` | Continue if some steps fail | `false` |
| `--skip-validation` | Skip post-migration validation | `false` |

### Example Output

```bash
$ npx tacho optimize migrate --dry-run

🧙 TachUI Migration Wizard - Dry Run

📊 Migration Analysis:
  Current bundle size: 3824KB
  Target bundle: minimal-production
  Expected size: 50KB
  Expected savings: 3774KB (98.7%)
  Migration effort: Low
  Risk level: Low

📋 Migration Plan (6 steps):
  1. ✅ Update Vite configuration (automated)
     📁 Files: vite.config.ts
     ⏱️  Time: ~5 minutes
  
  2. ✅ Update package.json dependencies (automated)
     📁 Files: package.json  
     ⏱️  Time: ~2 minutes
  
  3. ✅ Optimize component imports (automated)
     📁 Files: src/Calculator.ts, src/Display.ts
     ⏱️  Time: ~4 minutes
  
  4. ✅ Update build scripts (automated)
     📁 Files: package.json
     ⏱️  Time: ~3 minutes
     
  5. ✅ Validate migration (automated)
     🧪 Tests: Bundle generation, functionality
     ⏱️  Time: ~10 minutes

📦 Bundle Configuration Preview:
```typescript
// vite.config.ts (Generated)
import { defineConfig } from 'vite'
import tachUIBundlePlugin from '@tachui/core/build/vite-integration'

export default defineConfig({
  plugins: [
    tachUIBundlePlugin({
      bundle: 'minimal-production',
      analysisReport: true,
      compression: 'gzip'
    })
  ]
})
```

💾 Backup Plan:
  📁 Backup location: .tachui-migration-backup/
  🔄 Rollback command: npx tacho optimize rollback

🚀 Ready to proceed? Run without --dry-run flag.
```

### Migration Process

The migration tool follows a safe, step-by-step process:

1. **Analysis**: Analyzes current application structure
2. **Backup**: Creates backup of critical files (unless `--no-backup`)
3. **Configuration**: Updates Vite configuration with bundle plugin
4. **Dependencies**: Updates package.json if needed
5. **Import Optimization**: Optimizes import statements (if beneficial)
6. **Build Scripts**: Updates build commands if needed
7. **Validation**: Tests that migration succeeded
8. **Performance Measurement**: Measures actual bundle size improvements

## `tacho optimize rollback`

Safely rollback migration changes if issues occur.

### Usage

```bash
# Rollback last migration
npx tacho optimize rollback

# Rollback specific backup
npx tacho optimize rollback --backup-dir ./my-backup

# Force rollback (skip confirmations)
npx tacho optimize rollback --force
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--backup-dir <path>` | Specify backup directory | `.tachui-migration-backup` |
| `--force` | Skip confirmation prompts | `false` |

### Example Output

```bash
$ npx tacho optimize rollback

🔄 TachUI Migration Rollback

📁 Found backup: .tachui-migration-backup/
📅 Created: 2024-08-22 14:30:15
📦 Original bundle size: 3824KB

🔄 Rollback Plan:
  1. Restore vite.config.ts
  2. Restore package.json
  3. Restore component files
  4. Clean up generated bundles

⚠️  This will undo your bundle optimization changes.
   Continue? (y/N): y

✅ Rollback completed successfully
📊 Bundle size restored to: 3824KB
💡 Optimization can be re-attempted anytime
```

## `tacho optimize build`

Generate optimized production bundles directly from CLI.

### Usage

```bash
# Generate optimal bundle for current app
npx tacho optimize build

# Generate specific bundle configuration
npx tacho optimize build --bundle minimal-production

# Generate all bundle configurations
npx tacho optimize build --all

# Generate with analysis report
npx tacho optimize build --analyze

# Custom output directory
npx tacho optimize build --output ./dist/bundles
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--bundle <name>` | Bundle configuration to generate | Auto-detected |
| `--all` | Generate all bundle configurations | `false` |
| `--analyze` | Generate detailed analysis report | `false` |
| `--output <dir>` | Output directory for bundles | `./dist/tachui-bundles` |
| `--compression <type>` | Compression type: `gzip`, `brotli`, `none` | `gzip` |

### Example Output

```bash
$ npx tacho optimize build --analyze

🏭 TachUI Bundle Generator

🔍 Analyzing application...
📊 Component usage: 5 components detected
🎯 Recommended bundle: minimal-production

📦 Generating Bundle: minimal-production
  🔨 Static code inlining...
  📊 Building dependency graph...
  🔄 Resolving circular dependencies...
  📋 Ordering modules for inlining...
  📦 Inlining 23 modules...
  🌲 Tree-shaking unused code...
  ⚡ Optimizing and minifying...

✅ Bundle generated: tachui-minimal-production.js (47KB)
🗜️  Compressed size: 12KB (gzipped)

📊 Bundle Analysis Report:
  📁 Output: ./dist/tachui-bundles/minimal-production-analysis.json
  📈 Performance improvement: 98.8% reduction
  ⚡ Load time improvement: 1900ms saved
  
🧪 Validation Results:
  ✅ Bundle integrity: Passed
  ✅ Dependency resolution: Passed  
  ✅ Runtime compatibility: Passed
  ✅ Browser functionality: Passed

💡 Integration: Add tachUIBundlePlugin to vite.config.ts to use in builds
```

## Configuration File

You can create a `tacho.config.js` file to set default options:

```javascript
// tacho.config.js
export default {
  optimize: {
    // Default bundle configuration
    bundle: 'auto',
    
    // Always create backups
    backup: true,
    
    // Generate analysis reports
    analysisReport: true,
    
    // Compression preference
    compression: 'gzip',
    
    // Custom output directory
    outputDir: './dist/optimized-bundles'
  }
}
```

## Integration with CI/CD

### GitHub Actions

```yaml
# .github/workflows/bundle-optimization.yml
name: Bundle Optimization Check

on: [push, pull_request]

jobs:
  bundle-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Analyze bundle optimization
        run: npx tacho optimize analyze --output bundle-analysis.json
      
      - name: Check bundle size
        run: npx tacho optimize build --analyze
      
      - name: Upload analysis results
        uses: actions/upload-artifact@v3
        with:
          name: bundle-analysis
          path: bundle-analysis.json
```

### Bundle Size Monitoring

```bash
# Add to package.json scripts
{
  "scripts": {
    "bundle:check": "tacho optimize analyze",
    "bundle:optimize": "tacho optimize migrate",
    "bundle:build": "tacho optimize build --all --analyze",
    "bundle:rollback": "tacho optimize rollback"
  }
}
```

## Error Handling

The CLI provides detailed error messages and recovery suggestions:

```bash
$ npx tacho optimize migrate

❌ Migration failed at step 3: Component optimization

🔍 Details:
  Error: Component 'DatePicker' not found in minimal-production bundle
  File: src/components/Calendar.ts:15
  
💡 Solutions:
  1. Switch to 'common-production' or 'complete-production' bundle
  2. Install @tachui/forms plugin for DatePicker
  3. Replace DatePicker with BasicInput for minimal bundle

🔄 Automatic rollback initiated...
✅ Application restored to previous state

💬 Need help? Run: tacho optimize analyze --verbose
```

## Best Practices

### 1. Always Start with Analysis
```bash
# Get recommendations before migrating
npx tacho optimize analyze --verbose
```

### 2. Use Dry-Run for Safety  
```bash
# Preview changes before applying
npx tacho optimize migrate --dry-run
```

### 3. Monitor Bundle Size in CI
```bash
# Add bundle size checks to CI pipeline
npx tacho optimize build --analyze
```

### 4. Keep Backups
```bash
# Always create backups (default behavior)
npx tacho optimize migrate --backup
```

The Tacho CLI integration makes Epic Pico bundle optimization accessible and safe for all TachUI developers, providing automated analysis, migration, and validation tools that ensure your applications achieve maximum performance with minimal effort.