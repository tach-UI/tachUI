import path from 'node:path'
import { defineConfig, mergeConfig } from 'vitest/config'
import sharedConfig from '../../vitest.shared.config'

const src = path.resolve(__dirname, './src')

const alias = {
  '@tachui/modifiers': src,
  '@tachui/modifiers/': `${src}/`,
  '@tachui/modifiers/effects': path.resolve(src, './effects/index.ts'),
}

/**
 * The overlay suites are the exception to `setup-enhanced.ts`.
 *
 * That file replaces `global.document` with a hand-rolled mock whose
 * `appendChild` is a no-op spy and which has no `children` at all. The overlay
 * modifier builds a layer element and walks the resulting tree, so it cannot
 * work against a mock of that shape — under it, 82 of these tests fail.
 *
 * They run on the shared jsdom setup instead, which is what the root runner
 * has always given them; splitting them out is what makes the package-local
 * run agree with it.
 */
const OVERLAY_SUITES = ['__tests__/layout/overlay*.test.ts']

export default mergeConfig(
  sharedConfig,
  defineConfig({
    resolve: { alias },
    onConsoleLog: () => false,
    test: {
      projects: [
        {
          extends: true,
          test: {
            name: 'modifiers',
            // Spread, not replaced: the shared list carries the Playwright
            // specs, benchmarks and coverage output, none of which this
            // project should collect.
            exclude: [
              ...(sharedConfig.test?.exclude ?? []),
              ...OVERLAY_SUITES,
            ],
            setupFiles: ['./__tests__/setup-enhanced.ts'],
            silent: true,
          },
        },
        {
          extends: true,
          test: {
            name: 'modifiers:overlay',
            include: OVERLAY_SUITES,
          },
        },
      ],
    },
  })
)
