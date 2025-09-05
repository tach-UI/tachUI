import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
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
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
  },
  esbuild: {
    target: 'es2020',
  },
})
