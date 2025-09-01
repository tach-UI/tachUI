import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'components/text-input/index': resolve(
          __dirname,
          'src/components/text-input/index.ts'
        ),
        'components/selection/index': resolve(
          __dirname,
          'src/components/selection/index.ts'
        ),
        'components/date-picker/index': resolve(
          __dirname,
          'src/components/date-picker/index.ts'
        ),
        'components/advanced/index': resolve(
          __dirname,
          'src/components/advanced/index.ts'
        ),
        'validation/index': resolve(__dirname, 'src/validation/index.ts'),
      },
      name: 'TachUIForms',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@tachui/core',
        '@tachui/primitives',
        /^@tachui\/core\/.*/,
        /^@tachui\/primitives\/.*/,
      ],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/primitives': 'TachUIPrimitives',
        },
      },
    },
    sourcemap: true,
    minify: 'esbuild',
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
})
