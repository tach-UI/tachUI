import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const preloadChecks: Array<{ fixture: string; registryKeys: string[] }> = [
  { fixture: 'tree-shake-effects.ts', registryKeys: ['transformStyle'] },
  { fixture: 'tree-shake-filters.ts', registryKeys: ['blur'] },
  { fixture: 'tree-shake-shadows.ts', registryKeys: ['shadow'] },
  { fixture: 'tree-shake-transforms.ts', registryKeys: ['transformStyle'] },
  { fixture: 'tree-shake-backdrop.ts', registryKeys: ['backdropFilter'] },
  { fixture: 'tree-shake-both.ts', registryKeys: ['padding', 'transformStyle'] },
]

async function buildFixtureOutput(fixture: string): Promise<string> {
  const result = await build({
    entryPoints: [path.resolve(__dirname, `../__tests__/fixtures/${fixture}`)],
    bundle: true,
    format: 'iife',
    treeShaking: true,
    minify: true,
    write: false,
    logLevel: 'silent',
  })

  const output = result.outputFiles?.[0]?.text ?? ''
  if (!output) throw new Error(`Empty bundle output for fixture ${fixture}`)
  return output
}

async function verify() {
  const output = await buildFixtureOutput('tree-shake-basic.ts')

  if (output.includes('Glassmorphism') || output.includes('DropShadow')) {
    console.error('❌ Tree-shaking failed: effects code detected in basic preload bundle')
    process.exit(1)
  }

  for (const check of preloadChecks) {
    const bundledOutput = await buildFixtureOutput(check.fixture)
    for (const registryKey of check.registryKeys) {
      if (!bundledOutput.includes(registryKey)) {
        console.error(
          `❌ Tree-shaking failed: expected "${registryKey}" in ${check.fixture} bundle`
        )
        process.exit(1)
      }
    }
  }

  console.log(
    '✅ Tree-shaking verification passed (basic stays segmented; preload bundles retain expected registrations)'
  )
}

verify()
