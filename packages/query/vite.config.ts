import { resolve } from 'path'
import { defineConfig, transformWithEsbuild, type Plugin } from 'vite'

/**
 * Collapses whitespace in the emitted chunk.
 *
 * Vite's library mode minifies identifiers and syntax but leaves the chunk
 * formatted, and gzip does not absorb the difference. Measured on this package:
 * 15,177 bytes gzipped as Vite emits it, 12,086 with this pass — a fifth of the
 * bundle, for nothing. Source comments cost nothing either way; they are gone
 * long before this runs.
 *
 * A `renderChunk` hook deliberately, and not `generateBundle`, even though
 * Vite's own `esbuild-transpile` runs after this one and re-prints what it is
 * given — so this pass recovers less than it could. Running later recovers the
 * remaining ~1 KB and strips every `/* @__PURE__ *\/` annotation with it, because
 * esbuild consumes them and does not re-emit; terser does the same, with or
 * without `compress`. A published library keeps its tree-shaking metadata: the
 * annotations were measured to make no difference to an esbuild consumer, but
 * that is one bundler, and they are not ours to discard on its behalf.
 */
function collapseWhitespace(sourcemap: boolean): Plugin {
  return {
    name: 'tachui:collapse-whitespace',
    enforce: 'post',
    apply: 'build',
    async renderChunk(code) {
      const minified = await transformWithEsbuild(code, 'chunk.js', {
        minify: true,
        target: 'es2020',
        format: 'esm',
        sourcemap,
      })
      // Rollup composes the maps its plugins return, so handing this one back
      // keeps a development build's sourcemap pointing at the original
      // sources. Returning `null` would silently drop it.
      return {
        code: minified.code,
        map: sourcemap ? (minified.map ?? null) : null,
      }
    },
  }
}

export default defineConfig(({ mode }) => ({
  plugins: [collapseWhitespace(mode !== 'production')],
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
