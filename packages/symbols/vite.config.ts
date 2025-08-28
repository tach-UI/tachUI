import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: false,
      include: ['src/**/*'],
      exclude: ['**/__tests__/**'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/index': resolve(__dirname, 'src/components/index.ts'),
        'icon-sets/index': resolve(__dirname, 'src/icon-sets/index.ts'),
        'modifiers/index': resolve(__dirname, 'src/modifiers/index.ts'),
        'utils/index': resolve(__dirname, 'src/utils/index.ts'),
      },
      name: 'TachUISymbols',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['@tachui/core', '@tachui/core/validation', 'lucide'],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          lucide: 'Lucide',
        },
        exports: 'named',
        // Temporarily disable manual chunks to fix Symbol export
        // manualChunks: {
        //   // Core symbol component - most commonly used
        //   'symbol-core': ['./src/components/Symbol.ts'],
        //   // Icon sets - loaded on demand
        //   'icon-sets': ['./src/icon-sets/lucide.ts', './src/icon-sets/registry.ts'],
        //   // Modifiers - loaded when needed
        //   'symbol-modifiers': ['./src/modifiers/SymbolModifier.ts'],
        //   // Utilities - shared across components
        //   'symbol-utils': [
        //     './src/utils/accessibility.ts',
        //     './src/utils/icon-loader.ts',
        //     './src/utils/performance.ts'
        //   ],
        // },
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['../core/__tests__/setup.ts'],
  },
})
