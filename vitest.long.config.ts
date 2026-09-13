import { defineConfig, mergeConfig } from 'vitest/config'

import sharedConfig from './vitest.shared.config'

/**
 * The long tier: the slow suites `vitest.ci.config.ts` excludes to keep PR CI
 * fast — multi-second application simulations, real-world flow integrations,
 * and the benchmark-shaped performance checks.
 *
 * Registration is by convention, as in the memory tier. #229 exists because
 * this script named three literal paths and the files moved out from under it;
 * a glob cannot rot the same way. Every pattern here must have a counterpart
 * in the CI config's `exclude`, or a suite runs in both tiers.
 */
export default mergeConfig(
  sharedConfig,
  defineConfig({
    test: {
      include: [
        'packages/**/__tests__/**/long-running-*.test.ts',
        'packages/**/__tests__/**/simulation*.test.ts',
        'packages/**/__tests__/integration/real-world-*.test.ts',
        'packages/**/__tests__/integration/error-recovery.test.ts',
        'packages/**/__tests__/integration/foundation-demo.test.ts',
        'packages/**/__tests__/performance/*benchmark*.test.ts',
        'packages/**/__tests__/performance/bundle-size-monitoring.test.ts',
      ],
      // These suites are slow by definition; the shared 10s ceiling is the
      // thing most likely to fail first, and that would say nothing.
      testTimeout: 60000,
      hookTimeout: 60000,
    },
  })
)
