import { defineConfig } from 'vite'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  resolve: {
    dedupe: ['@tachui/core', '@tachui/primitives', '@tachui/modifiers', '@tachui/flow-control', '@tachui/responsive', '@tachui/effects', '@tachui/registry'],
    alias: {
      '@tachui/core/minimal': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist/minimal.js',
      '@tachui/core/gradients': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist/gradients/index.js',
      '@tachui/core/assets': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist/assets/index.js',
    },
  },
  plugins: [
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
    }),
  ],
  define: {
    // Define globals for browser compatibility
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    // Strip validation system in production
    __DEV__: mode !== 'production',
    __VALIDATION__: mode !== 'production',
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        format: 'es',
         manualChunks: id => {
           // Bundle all tachui packages that use the registry together to prevent fragmentation
           if (id.includes('@tachui/core') || id.includes('@tachui/symbols') || id.includes('@tachui/registry') || id.includes('@tachui/modifiers') || id.includes('@tachui/effects') || id.includes('@tachui/responsive') || id.includes('@tachui/mobile')) {
             return 'tachui'
           }
           // Keep lucide bundled since @tachui/symbols depends on it
           if (id.includes('lucide')) {
             return 'tachui'
           }
         },
      },
      external: mode === 'production' ? [
        'typescript',
        '@typescript-eslint/parser', 
        '@typescript-eslint/eslint-plugin',
        'vite',
        'rollup',
        'esbuild',
        // Don't bundle Node.js built-ins
        'path', 'fs', 'crypto', 'util'
      ] : id => {
        // Don't bundle Node.js built-ins
        return ['path', 'fs', 'crypto', 'util'].includes(id)
      },
      treeshake: {
        // Aggressive tree shaking but preserve @tachui/symbols side effects
        moduleSideEffects: id => {
          // Preserve side effects for @tachui/symbols to ensure icon registration
          if (id?.includes('@tachui/symbols')) return true
          return false
        },
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },
    },
    // Generate stats for bundle analysis
    reportCompressedSize: true,
    // Enable minification
    minify: 'esbuild',
    // Source maps for debugging
    sourcemap: mode !== 'production',
  },
  server: {
    port: 3002,
    host: '0.0.0.0',
    fs: {
      allow: ['../../demos', '../../packages'],
    },
  },
  preview: {
    port: 3002,
    host: '0.0.0.0',
  },
    optimizeDeps: {
      include: ['@tachui/core', '@tachui/symbols', '@tachui/registry', '@tachui/modifiers', '@tachui/effects'],
      exclude: ['typescript', '@typescript-eslint/parser', '@typescript-eslint/eslint-plugin', '@tachui/responsive', '@tachui/mobile'],
    },
}))
