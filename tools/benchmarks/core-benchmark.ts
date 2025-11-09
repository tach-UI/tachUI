import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

import {
  FRAMEWORK_BASELINES,
  calculatePerformanceScore,
  convertTachUIResults,
  generateComparisonReport,
  runTachUIBenchmarks,
} from '../../packages/core/benchmarks'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '../..')
const historyDir = path.resolve(repoRoot, 'benchmarks/history')
const browserResultsDir = path.resolve(
  repoRoot,
  'packages/core/benchmarks/results/browser'
)

type BrowserBenchmarkPayload = {
  runAt: string
  port: number
  results: Array<{
    name: string
    duration: number
    memory: number | null
    operationsPerSecond: number
    timestamp: string
  }>
  memorySummary?: {
    averageMb: number
  }
  rendererMetrics?: Record<string, unknown>
}

type BenchmarkResultLike = Parameters<typeof convertTachUIResults>[0]

function toTimestampSlug(date: Date): string {
  return date.toISOString().replace(/[:]/g, '-')
}

async function ensureHistoryDir(): Promise<void> {
  await fs.mkdir(historyDir, { recursive: true })
}

async function readLatestBrowserResult(): Promise<BrowserBenchmarkPayload | null> {
  try {
    const files = await fs.readdir(browserResultsDir)
    const jsonFiles = files
      .filter(file => file.endsWith('.json'))
      .map(file => path.resolve(browserResultsDir, file))

    if (jsonFiles.length === 0) {
      return null
    }

    const withStats = await Promise.all(
      jsonFiles.map(async file => ({
        file,
        stat: await fs.stat(file),
      }))
    )

    withStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs)
    const latest = withStats[0]
    const contents = await fs.readFile(latest.file, 'utf8')
    const payload = JSON.parse(contents) as BrowserBenchmarkPayload
    return payload
  } catch {
    return null
  }
}

function normaliseNodeResults(results: Awaited<ReturnType<typeof runTachUIBenchmarks>>['results']) {
  return results.map(result => ({
    name: result.name,
    type: result.type,
    durationMs: result.duration,
    operationsPerSecond: result.operationsPerSecond ?? null,
    memoryBytes: result.memory ?? null,
    metadata: result.metadata ?? {},
    rendererMetrics: result.rendererMetrics ?? null,
  }))
}

const browserNameMap = new Map([
  ['Create 1,000 rows', { name: 'Create 1,000 rows', type: 'create' as const }],
  ['Replace all 1,000 rows', { name: 'Replace all 1,000 rows', type: 'update' as const }],
  ['Partial update (every 10th row)', { name: 'Partial update (every 10th row)', type: 'update' as const }],
  ['Select row', { name: 'Select row', type: 'select' as const }],
  ['Swap rows', { name: 'Swap rows', type: 'swap' as const }],
  ['Remove rows', { name: 'Remove rows', type: 'remove' as const }],
  ['Clear rows', { name: 'Clear rows', type: 'clear' as const }],
  ['Component creation (1,000 components)', { name: 'Component creation (1,000 components)', type: 'create' as const }],
])

function convertBrowserResultsToBenchmarks(browser: BrowserBenchmarkPayload): BenchmarkResultLike {
  const orderedNames = [
    'Create 1,000 rows',
    'Replace all 1,000 rows',
    'Partial update (every 10th row)',
    'Select row',
    'Swap rows',
    'Remove rows',
    'Clear rows',
    'Component creation (1,000 components)',
  ] as const

  const map = new Map<string, BrowserBenchmarkResult>(browser.results.map(result => [result.name, result]))
  const normalizedNames = new Map<string, string>([
    ['Partial update (every 10th row)', 'Partial update (every 10th row)'],
    ['Update every 10th row', 'Partial update (every 10th row)'],
    ['Remove rows', 'Remove rows'],
    ['Remove every 10th row', 'Remove rows'],
    ['Clear rows', 'Clear rows'],
    ['Clear all rows', 'Clear rows'],
  ])

  return orderedNames
    .map(originalName => {
      const mapping = browserNameMap.get(originalName)
      if (!mapping) return null
      const lookupNames = [originalName]
      normalizedNames.forEach((canonical, key) => {
        if (canonical === originalName) {
          lookupNames.push(key)
        }
      })
      const result = lookupNames.reduce<BrowserBenchmarkResult | null>((acc, name) => {
        if (acc) return acc
        return map.get(name) ?? null
      }, null)
      if (!result) return null
      return {
        name: mapping.name,
        type: mapping.type,
        duration: result.duration,
        memory: typeof result.memory === 'number' ? result.memory * 1024 * 1024 : undefined,
        operationsPerSecond: result.operationsPerSecond,
        metadata: { source: 'browser' },
      }
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
}

function deriveFrameworkDataFromBrowser(
  browser: BrowserBenchmarkPayload,
  memoryMb: number | null
): FrameworkBenchmarkData {
  const durationByName = new Map<string, number>()
  browser.results.forEach(result => {
    durationByName.set(result.name, result.duration)
  })

  const getDuration = (name: string): number => {
    const value = durationByName.get(name)
    return typeof value === 'number' && Number.isFinite(value) ? value : Number.NaN
  }

  const memoryUsage = typeof memoryMb === 'number' && Number.isFinite(memoryMb) ? memoryMb : Number.NaN

  return {
    framework: 'TachUI',
    version: '0.1.0',
    results: {
      create1000: getDuration('Create 1,000 rows'),
      replaceAll: getDuration('Replace all 1,000 rows'),
      partialUpdate: getDuration('Partial update (every 10th row)'),
      selectRow: getDuration('Select row'),
      swapRows: getDuration('Swap rows'),
      removeRows: getDuration('Remove rows'),
      clearRows: getDuration('Clear rows'),
      memoryUsage,
      bundleSize: 15.8,
    },
  }
}

async function writeHistoryFile(
  filename: string,
  payload: Record<string, unknown>
): Promise<void> {
  await fs.writeFile(
    path.resolve(historyDir, filename),
    JSON.stringify(payload, null, 2),
    'utf8'
  )
}

async function run() {
  const start = new Date()
  await ensureHistoryDir()

  console.log('🏁 Running TachUI core benchmark (Node harness)...')
  const { results: nodeResults, report: nodeReport } = await runTachUIBenchmarks()
  const tachuiNodeData = convertTachUIResults(nodeResults)

  const comparisonBaselines = FRAMEWORK_BASELINES.filter(base =>
    base.framework === 'React' || base.framework === 'SolidJS'
  )

  console.log('🌐 Loading latest browser benchmark payload (if available)...')
  const browserPayload = await readLatestBrowserResult()
  const browserBenchmarkResults = browserPayload
    ? convertBrowserResultsToBenchmarks(browserPayload)
    : null
  const browserMemoryMb = browserPayload?.memorySummary && 'averageMb' in browserPayload.memorySummary
    ? browserPayload.memorySummary.averageMb
    : null
  const tachuiBrowserData = browserPayload
    ? deriveFrameworkDataFromBrowser(browserPayload, browserMemoryMb)
    : null
  const comparisonSource = tachuiBrowserData ?? tachuiNodeData
  const performanceScore = calculatePerformanceScore(comparisonSource)
  const comparisonReport = generateComparisonReport(comparisonSource, comparisonBaselines)
  if (!browserPayload) {
    console.warn(
      '⚠️ No browser benchmark results were found. Run `pnpm benchmark:browser:report` first if you need browser data.'
    )
  }

  const timestamp = toTimestampSlug(start)
  const historyEntry = {
    generatedAt: start.toISOString(),
    performanceScore,
    node: {
      report: nodeReport,
      results: normaliseNodeResults(nodeResults),
      summary: tachuiNodeData,
    },
    browser: browserPayload
      ? {
          payload: browserPayload,
          summary: tachuiBrowserData,
        }
      : null,
    comparison: {
      source: tachuiBrowserData ? 'browser' : 'node',
      baselines: comparisonBaselines,
      report: comparisonReport,
    },
    environment: {
      nodeVersion: process.version,
      cwd: process.cwd(),
    },
  }

  const historyFilename = `benchmark-${timestamp}.json`

  await writeHistoryFile(historyFilename, historyEntry)
  await writeHistoryFile('latest.json', historyEntry)

  if (tachuiBrowserData) {
    console.log('✅ Using browser metrics for cross-framework comparison.')
  } else {
    console.log('ℹ️ Falling back to Node (JSDOM) metrics for cross-framework comparison.')
  }
  console.log(`✅ Honest benchmark summary written to benchmarks/history/${historyFilename}`)
  console.log(`📊 Comparison report:\n${comparisonReport}`)
}

run().catch(error => {
  console.error('❌ Honest benchmark execution failed:', error)
  process.exitCode = 1
})
