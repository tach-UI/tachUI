import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        // Bundle variants (tree-shakable)
        index: resolve(__dirname, 'src/bundles/complete.ts'), // Complete (with validation)
        minimal: resolve(__dirname, 'src/bundles/minimal.ts'), // Dev minimal (with validation)
        common: resolve(__dirname, 'src/bundles/common.ts'), // Dev common (with validation)
        essential: resolve(__dirname, 'src/bundles/essential.ts'), // Dev essential (with validation)

        // Production bundles (no validation, no TypeScript)
        'minimal-prod': resolve(__dirname, 'src/bundles/production-minimal.ts'), // ~45KB production

        // Granular exports (for maximum optimization)
        version: resolve(__dirname, 'src/version.ts'),
        'reactive/index': resolve(__dirname, 'src/reactive/index.ts'),
        'compiler/index': resolve(__dirname, 'src/compiler/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
        'plugins/index': resolve(__dirname, 'src/plugins/index.ts'),
        'state/index': resolve(__dirname, 'src/state/index.ts'),
        'runtime/dom-bridge': resolve(__dirname, 'src/runtime/dom-bridge.ts'),
        'runtime/renderer': resolve(__dirname, 'src/runtime/renderer.ts'),
        'modifiers/index': resolve(__dirname, 'src/modifiers/index.ts'),
        'modifiers/base': resolve(__dirname, 'src/modifiers/base.ts'),
        'modifiers/types': resolve(__dirname, 'src/modifiers/types.ts'),
        'modifiers/builder': resolve(__dirname, 'src/modifiers/builder.ts'),
        'modifiers/registry': resolve(__dirname, 'src/modifiers/registry.ts'),
        'runtime/types': resolve(__dirname, 'src/runtime/types.ts'),
        'runtime/index': resolve(__dirname, 'src/runtime/index.ts'),
        'runtime/concatenation-minimal': resolve(__dirname, 'src/runtime/concatenation-minimal.ts'),
        'runtime/concatenation-aria': resolve(__dirname, 'src/runtime/concatenation-aria.ts'),
        'runtime/concatenation-full': resolve(__dirname, 'src/runtime/concatenation-full.ts'),
        'reactive/types': resolve(__dirname, 'src/reactive/types.ts'),
        'constants/layout': resolve(__dirname, 'src/constants/layout.ts'),
        'validation/index': resolve(__dirname, 'src/validation/index.ts'),
        'assets/index': resolve(__dirname, 'src/assets/index.ts'),
        'gradients/gradient-asset': resolve(__dirname, 'src/gradients/gradient-asset.ts'),
        'css-classes/index': resolve(__dirname, 'src/css-classes/index.ts'),
      },
      name: 'TachUICore',
      formats: ['es'],
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    rollupOptions: {
      // External dependencies (not bundled)
      external: id => {
        // Always externalize TypeScript
        if (id === 'typescript' || id.includes('typescript')) {
          return true
        }
        // Externalize @tachui packages to avoid circular dependencies
        if (id.startsWith('@tachui/')) {
          return true
        }
        return false
      },
      output: {
        exports: 'named',
        preserveModules: false, // Use optimized bundles instead of individual modules
        manualChunks: undefined, // Let Rollup optimize chunking
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  // Configure for TypeScript
  esbuild: {
    target: 'es2020',
  },
})
