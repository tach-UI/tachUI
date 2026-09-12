import { resolve } from 'path'
import { defineConfig, transformWithEsbuild, type Plugin } from 'vite'

/**
 * Collapses whitespace in the emitted chunk.
 *
 * Vite's library mode minifies identifiers and syntax but leaves the output
 * formatted, and gzip does not absorb the difference: measured on this package,
 * the same chunk is 13.8 KB gzipped as emitted and 10.4 KB once whitespace is
 * removed — a quarter of the bundle, for nothing. Source comments cost nothing
 * either way; they are gone long before this runs.
 */
function collapseWhitespace(): Plugin {
  return {
    name: 'tachui:collapse-whitespace',
    // After Vite's own minifier, which is what leaves the formatting behind.
    enforce: 'post',
    async renderChunk(code) {
      const minified = await transformWithEsbuild(code, 'chunk.js', {
        minify: true,
        target: 'es2020',
        format: 'esm',
        sourcemap: false,
      })
      return { code: minified.code, map: null }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [collapseWhitespace()],
  build: {
    // The size-budget gate reads the chunk graph from this manifest rather than
    // re-deriving it by parsing the emitted JavaScript (tools/check-size-budget.mjs).
    manifest: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: id =>
        id === '@tachui/core' ||
        id.startsWith('@tachui/core/') ||
        id.startsWith('node:'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
      },
    },
    sourcemap: mode !== 'production',
    target: 'es2020',
  },
}))
