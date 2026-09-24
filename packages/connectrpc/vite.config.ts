import { resolve } from 'path'
import { defineConfig } from 'vite'

/**
 * Connect and Protobuf are peers: the application installs exactly one copy,
 * and the adapter must share it. A bundled copy would carry its own
 * `ConnectError` class, so `instanceof ConnectError` in application code would
 * fail on every error this package surfaced. The tachUI packages stay external
 * for the same reason — one `QueryClient` environment key, one reactive graph.
 */
const EXTERNAL_PACKAGES = [
  '@tachui/core',
  '@tachui/query',
  '@connectrpc/connect',
  '@bufbuild/protobuf',
]

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: id =>
        EXTERNAL_PACKAGES.some(name => id === name || id.startsWith(`${name}/`)) ||
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
