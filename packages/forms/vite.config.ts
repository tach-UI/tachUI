import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig(({ mode }) => ({
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
        'modifiers/index': resolve(__dirname, 'src/modifiers/index.ts'),
      },
      name: 'TachUIForms',
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        '@tachui/core',
        '@tachui/primitives',
        '@tachui/registry',
        /^@tachui\/core\/.*/,
        /^@tachui\/primitives\/.*/,
        /^@tachui\/registry\/.*/,
      ],
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/primitives': 'TachUIPrimitives',
        },
      },
    },
    sourcemap: mode !== 'production',
    minify: 'esbuild',
    target: 'esnext',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
}))
