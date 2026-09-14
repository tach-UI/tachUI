import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      // Object form, for two reasons. A bare entry made vite name the output
      // after the package — `dist/mobile.js` — while the manifest pointed at
      // `dist/index.js`, so importing @tachui/mobile failed at runtime even
      // though its types resolved. And ./modifiers was advertised with nothing
      // building it.
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'modifiers/index': resolve(__dirname, 'src/modifiers/index.ts'),
      },
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
