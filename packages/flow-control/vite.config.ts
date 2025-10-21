import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'conditional/index': resolve(__dirname, 'src/conditional/index.ts'),
        'iteration/index': resolve(__dirname, 'src/iteration/index.ts'),
      },
      name: 'TachUIFlowControl',
      formats: ['es'],
    },
    rollupOptions: {
      external: id => {
        if (id === 'typescript' || id.includes('typescript')) {
          return true
        }
        if (id.startsWith('@tachui/')) {
          return true
        }
        return false
      },
      output: {
        exports: 'named',
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
