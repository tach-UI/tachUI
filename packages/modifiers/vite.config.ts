import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        base: resolve(__dirname, 'src/base.ts'),
        types: resolve(__dirname, 'src/types.ts'),
        'basic/padding': resolve(__dirname, 'src/basic/padding.ts'),
        'basic/margin': resolve(__dirname, 'src/basic/margin.ts'),
        'basic/size': resolve(__dirname, 'src/basic/size.ts'),
        'typography/text': resolve(__dirname, 'src/typography/text.ts'),
        'layout/index': resolve(__dirname, 'src/layout/index.ts'),
        'typography/index': resolve(__dirname, 'src/typography/index.ts'),
        'appearance/index': resolve(__dirname, 'src/appearance/index.ts'),
        'interaction/index': resolve(__dirname, 'src/interaction/index.ts'),
        'utility/index': resolve(__dirname, 'src/utility/index.ts'),
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
        '@tachui/core/modifiers/types',
        '@tachui/core/modifiers/registry',
        '@tachui/core/constants/layout',
      ],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
