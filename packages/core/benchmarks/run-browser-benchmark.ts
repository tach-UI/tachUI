import { chromium } from '@playwright/test'
import { build } from 'esbuild'
import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import type { RendererMetricsSummary } from './setup'

type BrowserBenchmarkResult = {
  name: string
  duration: number
  memory: number | null
  operationsPerSecond: number
  timestamp: string
}

type BrowserRendererMetrics = Record<string, RendererMetricsSummary>
type MemorySample = { value: number; name: string }

const LOG_METRICS: Array<keyof RendererMetricsSummary['average']> = [
  'created',
  'adopted',
  'moved',
  'removed',
  'attributeWrites',
  'attributeRemovals',
  'textUpdates',
]

function formatMetric(summary: RendererMetricsSummary, key: keyof RendererMetricsSummary['average']): string {
  const average = summary.average[key]
  const max = summary.max[key]
  const total = summary.totals[key]
  const avgDisplay = Number.isInteger(average) ? `${average}` : average.toFixed(1)
  return `${key}=avg:${avgDisplay},max:${Math.round(max)},total:${Math.round(total)}`
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DEFAULT_PORT = Number(process.env.TACHUI_BROWSER_BENCH_PORT || 4173)
const PUBLIC_DIR = path.resolve(__dirname, '../benchmarks/public')
const RESULTS_DIR = path.resolve(__dirname, '../benchmarks/results/browser')

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.map': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath)
  return MIME_TYPES[ext] || 'application/octet-stream'
}

async function serveStatic(dir: string, port: number): Promise<http.Server> {
  const server = http.createServer((req, res) => {
    if (!req.url) {
      res.writeHead(400)
      res.end('Bad request')
      return
    }

    const requestUrl = req.url === '/' ? '/index.html' : req.url
    const fsPath = path.join(dir, decodeURIComponent(requestUrl))

    fs.readFile(fsPath, (err, data) => {
      if (err) {
        res.writeHead(404)
        res.end('Not found')
        return
      }

      res.writeHead(200, { 'Content-Type': getContentType(fsPath) })
      res.end(data)
    })
  })

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(port, resolve)
  })

  return server
}

async function runBrowserBenchmarks() {
  const bundleEntry = path.resolve(__dirname, 'browser-runner.ts')
  const bundleOutput = path.resolve(PUBLIC_DIR, 'benchmark.js')
  await build({
    entryPoints: [bundleEntry],
    outfile: bundleOutput,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: ['es2020'],
    sourcemap: false,
    loader: {
      '.ts': 'ts',
    },
    external: ['node:module'],
  })

  console.log('🔧 Starting static server for browser benchmarks…')
  const server = await serveStatic(PUBLIC_DIR, DEFAULT_PORT)
  console.log(`🌐 Benchmark page available at http://127.0.0.1:${DEFAULT_PORT}`)

  const browser = await chromium.launch({
    args: ['--enable-precise-memory-info', '--js-flags=--expose-gc'],
  })
  const page = await browser.newPage()

  try {
    const memorySamples: MemorySample[] = []
    const captureMemory = async (label: string) => {
      const memory = await page.evaluate(() => {
        if (typeof window.gc === 'function') {
          try {
            ;(window as any).gc()
          } catch {}
        }
        if (typeof globalThis.gc === 'function') {
          try {
            (globalThis as any).gc()
          } catch {}
        }
        if (performance && 'memory' in performance) {
          const perfMemory = (performance as any).memory
          if (perfMemory && typeof perfMemory.usedJSHeapSize === 'number') {
            return perfMemory.usedJSHeapSize
          }
        }
        return null
      })
      if (memory != null) {
        memorySamples.push({ value: memory, name: label })
      }
      return memory
    }

    await captureMemory('warmup')
    console.log('🚀 Launching Chromium and navigating to benchmark page…')
    await page.goto(`http://127.0.0.1:${DEFAULT_PORT}/`, { waitUntil: 'networkidle' })
    await page.waitForFunction(() => (window as any).benchmarkRunner !== undefined, {
      timeout: 15_000,
    })

    console.log('🏃‍♂️ Running complete browser benchmark suite…')
    await page.evaluate(() => {
      const runner = (window as any).benchmarkRunner
      runner.clearResults()
      return runner.runAll()
    })

    await captureMemory('post-run')

    const results: BrowserBenchmarkResult[] = await page.evaluate(() => {
      const runner = (window as any).benchmarkRunner
      return runner.getResults()
    })

    const rendererMetrics = (await page.evaluate(() => {
      const runner = (window as any).benchmarkRunner
      return runner.getRendererMetrics()
    })) as BrowserRendererMetrics

    if (!fs.existsSync(RESULTS_DIR)) {
      fs.mkdirSync(RESULTS_DIR, { recursive: true })
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const outputPath = path.join(
      RESULTS_DIR,
      `browser-benchmark-${timestamp}.json`
    )

    const payload = {
      runAt: new Date().toISOString(),
      port: DEFAULT_PORT,
      results,
      memorySummary:
        memorySamples.length > 0
          ? {
              averageMb:
                memorySamples.reduce((sum, sample) => sum + sample.value, 0) /
                memorySamples.length /
                1024 /
                1024,
              samples: memorySamples.map(sample => ({
                name: sample.name,
                valueMb: sample.value / 1024 / 1024,
              })),
            }
          : {
              message:
                'performance.memory not exposed; relaunch Chromium with --enable-precise-memory-info to capture heap usage.',
            },
      rendererMetrics,
    }

    fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf8')

    console.log(`📄 Saved browser benchmark results to ${path.relative(process.cwd(), outputPath)}`)

    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    const avgDuration = totalDuration / results.length
    const fastest = Math.min(...results.map(r => r.duration))
    const slowest = Math.max(...results.map(r => r.duration))

    console.log('\n📊 Browser Benchmark Summary')
    console.log('='.repeat(40))
    console.log(`Benchmarks: ${results.length}`)
    console.log(`Total duration: ${totalDuration.toFixed(2)} ms`)
    console.log(`Average duration: ${avgDuration.toFixed(2)} ms`)
    console.log(`Fastest op: ${fastest.toFixed(2)} ms`)
    console.log(`Slowest op: ${slowest.toFixed(2)} ms`)
    if (memorySamples.length === 0) {
      console.log('⚠️ performance.memory not available. Launch Chromium with --enable-precise-memory-info to capture heap usage.')
    }
    if (Object.keys(rendererMetrics).length > 0) {
      console.log('\nRenderer metrics (browser run):')
      Object.entries(rendererMetrics).forEach(([name, summary]) => {
        const formatted = LOG_METRICS.map(metric => formatMetric(summary, metric)).join(', ')
        console.log(`  ${name}: iterations=${summary.iterations} | ${formatted}`)
      })
    }
    console.log('='.repeat(40))
  } finally {
    await browser.close()
    await new Promise<void>(resolve => server.close(() => resolve()))
  }
}

runBrowserBenchmarks().catch(error => {
  console.error('❌ Browser benchmark run failed:', error)
  process.exitCode = 1
})
