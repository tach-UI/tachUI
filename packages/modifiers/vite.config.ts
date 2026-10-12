import { defineConfig } from 'vite'
import { relative, resolve } from 'path'

// Basic modifiers bundle - essential layout and styling. Rolldown takes
// `manualChunks` only as a function, and a chunk it names also takes in the
// modules its members import. The effect families are left to their own entry
// chunks for granular imports: a named effects chunk would take them all in,
// since the effects entry imports each family.
const BASIC_CHUNK_DIRECTORIES = [
  'src/basic/',
  'src/layout/',
  'src/typography/',
  'src/appearance/',
  'src/interaction/',
  'src/utility/',
]

function manualChunks(id: string): string | undefined {
  const path = relative(__dirname, id).split('\\').join('/')
  return BASIC_CHUNK_DIRECTORIES.some(directory => path.startsWith(directory))
    ? 'modifiers-basic'
    : undefined
}

export default defineConfig(({ mode }) => ({
  build: {
    // The size-budget gate reads the chunk graph from this manifest rather than
    // re-deriving it by parsing the emitted JavaScript (tools/check-size-budget.mjs).
    manifest: true,
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
        // Must stay external: bundling the renderer would give this package
        // its own globalRenderer, separate from the app's.
        '@tachui/core/runtime',
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
        manualChunks,
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
