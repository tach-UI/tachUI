import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        base: resolve(__dirname, 'src/base.ts'),
        types: resolve(__dirname, 'src/types.ts'),
        'basic/index': resolve(__dirname, 'src/basic/index.ts'),
        'basic/padding': resolve(__dirname, 'src/basic/padding.ts'),
        'basic/margin': resolve(__dirname, 'src/basic/margin.ts'),
        'basic/size': resolve(__dirname, 'src/basic/size.ts'),
        'typography/text': resolve(__dirname, 'src/typography/text.ts'),
        'layout/index': resolve(__dirname, 'src/layout/index.ts'),
        'typography/index': resolve(__dirname, 'src/typography/index.ts'),
        'appearance/index': resolve(__dirname, 'src/appearance/index.ts'),
        'interaction/index': resolve(__dirname, 'src/interaction/index.ts'),
        'utility/index': resolve(__dirname, 'src/utility/index.ts'),
        'effects/index': resolve(__dirname, 'src/effects/index.ts'),
        'effects/filters/index': resolve(__dirname, 'src/effects/filters/index.ts'),
        'effects/shadows/index': resolve(__dirname, 'src/effects/shadows/index.ts'),
        'effects/backdrop/index': resolve(__dirname, 'src/effects/backdrop/index.ts'),
        'effects/transforms/index': resolve(__dirname, 'src/effects/transforms/index.ts'),
        'preload/basic': resolve(__dirname, 'src/preload/basic.ts'),
        'preload/effects': resolve(__dirname, 'src/preload/effects.ts'),
        'preload/filters': resolve(__dirname, 'src/preload/filters.ts'),
        'preload/shadows': resolve(__dirname, 'src/preload/shadows.ts'),
        'preload/transforms': resolve(__dirname, 'src/preload/transforms.ts'),
        'preload/backdrop': resolve(__dirname, 'src/preload/backdrop.ts'),
      },
      formats: ['es'],
    },
    emptyOutDir: false, // Don't clean the dist directory to preserve .d.ts files
    outDir: 'dist',
    rollupOptions: {
      external: [
        '@tachui/core',
        '@tachui/core/reactive',
        '@tachui/core/reactive/types',
        '@tachui/core/runtime/types',
        '@tachui/core/modifiers',
        '@tachui/core/modifiers/base',
        '@tachui/core/modifiers/types',
        '@tachui/core/modifiers/registry',
        '@tachui/core/constants/layout',
        '@tachui/core/gradients',
        '@tachui/core/gradients/css-generator',
        '@tachui/core/gradients/types',
        '@tachui/core/assets',
        '@tachui/registry',
      ],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/registry': 'TachuiRegistry',
        },
        // Manual chunks for optimal tree-shaking and bundle size control
        manualChunks: {
          // Basic modifiers bundle - essential layout and styling
          'modifiers-basic': [
            'src/basic/index.ts',
            'src/layout/index.ts', 
            'src/typography/index.ts',
            'src/appearance/index.ts',
            'src/interaction/index.ts',
            'src/utility/index.ts',
          ],
          // Effects bundle - advanced visual effects (excludes individual families)
          'modifiers-effects': [
            'src/effects/index.ts',
          ],
          // Individual effect families for granular imports
          'modifiers-filters': ['src/effects/filters/index.ts'],
          'modifiers-shadows': ['src/effects/shadows/index.ts'],
          'modifiers-transforms': ['src/effects/transforms/index.ts'],
          'modifiers-backdrop': ['src/effects/backdrop/index.ts'],
        },
      },
    },
    sourcemap: mode !== 'production',
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}))
