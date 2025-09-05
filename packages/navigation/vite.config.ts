import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'TachUINavigation',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: [
        '@tachui/core',
        '@tachui/core/validation',
        '@tachui/primitives',
      ],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/primitives': 'TachUIPrimitives',
        },
        exports: 'named',
      },
    },
    sourcemap: false,
    minify: 'esbuild',
    // Target modern browsers for better performance
    target: 'es2020',
  },
  // Configure for TypeScript
  esbuild: {
    target: 'es2020',
  },
})
