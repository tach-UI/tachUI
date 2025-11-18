import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUIMobilePatterns',
      formats: ['es'],
    },
    rollupOptions: {
      // Mark @tachui/core as external since it's a peer dependency
      external: id =>
        id === '@tachui/core' ||
        id === '@tachui/core/gradients/css-generator' ||
        id === '@tachui/registry' ||
        id.startsWith('@tachui/modifiers'),
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/registry': 'TachuiRegistry',
        },
      },
    },
    sourcemap: mode !== 'production',
    minify: 'esbuild',
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
}))
