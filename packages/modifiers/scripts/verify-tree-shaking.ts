import { build } from 'esbuild'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const preloadChecks: Array<{ fixture: string; registryKey: string }> = [
  { fixture: 'tree-shake-effects.ts', registryKey: 'transformStyle' },
  { fixture: 'tree-shake-filters.ts', registryKey: 'blur' },
  { fixture: 'tree-shake-shadows.ts', registryKey: 'shadow' },
  { fixture: 'tree-shake-transforms.ts', registryKey: 'transformStyle' },
  { fixture: 'tree-shake-backdrop.ts', registryKey: 'backdropFilter' },
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
    if (!bundledOutput.includes(check.registryKey)) {
      console.error(
        `❌ Tree-shaking failed: expected "${check.registryKey}" in ${check.fixture} bundle`
      )
      process.exit(1)
    }
  }

  console.log(
    '✅ Tree-shaking verification passed (basic stays segmented; preload bundles retain expected registrations)'
  )
}

verify()
