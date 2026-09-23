import { resolve } from 'node:path'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        modifiers: resolve(__dirname, 'src/modifiers.ts'),
        'modifiers-register': resolve(__dirname, 'src/modifiers-register.ts'),
        sheet: resolve(__dirname, 'src/sheet.ts'),
        stack: resolve(__dirname, 'src/stack.ts'),
        link: resolve(__dirname, 'src/link.ts'),
        tabs: resolve(__dirname, 'src/tabs.ts'),
        path: resolve(__dirname, 'src/path.ts'),
        environment: resolve(__dirname, 'src/environment.ts'),
        types: resolve(__dirname, 'src/types.ts'),
      },
      name: 'TachUINavigation',
      fileName: (_, entryName) => `${entryName}.js`,
      formats: ['es'],
    },
    rollupOptions: {
      // Every tachUI package stays external. Bundling one gives this package
      // a private copy: `@tachui/modifiers/preload/basic` would register the
      // basic modifiers into a registry of its own that the app's builder never
      // reads, and `@tachui/core/modifiers` would give it a builder of its own
      // to patch `.navigationTitle()` and the rest onto.
      external: (id: string) => id.startsWith('@tachui/'),
      output: {
        globals: {
          '@tachui/core': 'TachUICore',
          '@tachui/primitives': 'TachUIPrimitives',
        },
        exports: 'named',
      },
    },
    sourcemap: mode !== 'production',
    minify: 'esbuild',
    // Target modern browsers for better performance
    target: 'es2020',
  },
  // Configure for TypeScript
  esbuild: {
    target: 'es2020',
  },
}))
