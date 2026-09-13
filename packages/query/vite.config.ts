import { resolve } from 'path'
import { defineConfig, transformWithEsbuild, type Plugin } from 'vite'

/**
 * Collapses whitespace in the emitted chunks.
 *
 * Vite's library mode minifies identifiers and syntax but leaves the output
 * formatted, and gzip does not absorb the difference: measured on this package,
 * the same chunk is 13.8 KB gzipped as emitted and 10.4 KB once whitespace is
 * removed — a quarter of the bundle, for nothing. Source comments cost nothing
 * either way; they are gone long before this runs.
 *
 * In `generateBundle` rather than `renderChunk`, which is where this started and
 * why it did nothing: Vite's own `esbuild-transpile` is itself a `renderChunk`
 * hook, it runs after a `post` plugin's, and it re-prints the chunk it is given.
 * A collapsed chunk handed to it came back formatted, `__PURE__` annotations and
 * all. `generateBundle` runs once every chunk is final.
 *
 * Production only. A development build keeps its formatting and its sourcemap;
 * rewriting the code here would invalidate the map, and the size budget this
 * exists for is measured against the production bundle.
 */
function collapseWhitespace(): Plugin {
  return {
    name: 'tachui:collapse-whitespace',
    enforce: 'post',
    apply: 'build',
    async generateBundle(outputOptions, bundle) {
      if (outputOptions.sourcemap !== false) {
        return
      }
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk') {
          continue
        }
        const minified = await transformWithEsbuild(output.code, 'chunk.js', {
          minify: true,
          target: 'es2020',
          format: 'esm',
          sourcemap: false,
        })
        output.code = minified.code
      }
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
