import { defineConfig } from 'vite'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => ({
  resolve: {
    dedupe: ['@tachui/core', '@tachui/primitives', '@tachui/modifiers', '@tachui/flow-control', '@tachui/responsive', '@tachui/effects', '@tachui/registry'],
  },
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(mode === 'production' ? 'production' : 'development'),
    __DEV__: mode !== 'production',
    __VALIDATION__: mode !== 'production',
  },
  server: {
    port: 3001,
    host: '0.0.0.0',
    fs: {
      allow: ['../../demos', '../../packages'],
    },
  },
  // Enhanced development debugging (only in dev mode)
  esbuild: mode === 'production' ? {} : {
    keepNames: true,
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
  },
   optimizeDeps: {
     include: ['@tachui/core', '@tachui/primitives', '@tachui/registry', '@tachui/modifiers'],
     exclude: ['typescript', '@typescript-eslint/parser', '@typescript-eslint/eslint-plugin'],
   },
  build: {
    sourcemap: mode !== 'production',
    minify: mode === 'production' ? 'esbuild' : false, // Enable minification in production
    rollupOptions: {
      external: mode === 'production' ? [
        'typescript',
        '@typescript-eslint/parser', 
        '@typescript-eslint/eslint-plugin',
        'vite',
        'rollup',
        'esbuild'
      ] : [],
      plugins: [
        visualizer({
          filename: 'dist/stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
      ],
       output: {
         manualChunks: undefined, // Let Vite handle chunking automatically for better tree shaking
       },
    },
  },
}))

/*

'@tachui/core/reactive': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist/reactive',
'@tachui/core/runtime': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist/runtime',
'@tachui/core/modifiers': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist/modifiers',
'@tachui/core': '/Users/whoughton/Dev/tach-ui/tachUI/packages/core/dist',
'@tachui/effects': '/Users/whoughton/Dev/tach-ui/tachUI/packages/effects/dist'

*/
