#!/usr/bin/env node
/**
 * Packed-package check for @tachui/connectrpc.
 *
 * Installs the package the way an application would — from packed tarballs,
 * with its Connect peers supplied by the application — and proves four things
 * the workspace cannot, because inside it every import resolves to source:
 *
 * 1. The exports map works: the entry imports under Node, and its declarations
 *    type-check for a consumer under `bundler` resolution, with `skipLibCheck`
 *    off so the published declarations are checked against the installed peers.
 * 2. Connect stays a peer: the installed tree holds exactly one copy of each
 *    peer, and the built entry imports them rather than carrying its own. A
 *    bundled copy would bring its own `ConnectError`, and `instanceof` against
 *    the application's would fail on every error the adapter surfaced.
 * 3. It tree-shakes: importing one constant pulls in no Connect runtime.
 * 4. The declared peer range is honest: `--peers floor` installs the lowest
 *    version each range admits, `--peers latest` the highest.
 *
 * Usage:
 *   node tools/smoke-connectrpc-packed.mjs --peers floor
 *   node tools/smoke-connectrpc-packed.mjs --peers latest
 *   node tools/smoke-connectrpc-packed.mjs --peers latest --skip-build
 *
 * Needs the registry for the peers; the tachUI packages come from local
 * tarballs, since `@tachui/query` is private and has never been published.
 */
import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import semver from 'semver'

import { collectInstalledPaths } from './npm-installed-copies.mjs'

const ROOT_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TAG = '[smoke-connectrpc-packed]'

/** The adapter and everything it depends on at runtime, in build order. */
const PACKAGES = [
  { name: '@tachui/types', dir: 'types' },
  { name: '@tachui/registry', dir: 'registry' },
  { name: '@tachui/core', dir: 'core' },
  { name: '@tachui/query', dir: 'query' },
  { name: '@tachui/connectrpc', dir: 'connectrpc' },
]

function parseArgs(argv) {
  const args = { peers: undefined, skipBuild: false }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--peers') args.peers = argv[++index]
    else if (arg === '--skip-build') args.skipBuild = true
    else throw new Error(`unknown argument: ${arg}`)
  }
  if (args.peers !== 'floor' && args.peers !== 'latest') {
    throw new Error('--peers must be "floor" or "latest"')
  }
  return args
}

function run(command, args, cwd) {
  try {
    return execFileSync(command, args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    })
  } catch (error) {
    // `tsc` and `npm ls` report on stdout, which is piped here, so a failure
    // would otherwise show only the command line.
    if (error && typeof error.stdout === 'string' && error.stdout) console.error(error.stdout)
    throw error
  }
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

/**
 * Throws rather than exiting, so `main()`'s `finally` still removes the temp
 * directory; the top-level handler reports the message and sets the exit code.
 */
function fail(message) {
  throw new Error(message)
}

/**
 * The version specifier to install for each peer. `floor` pins the minimum the
 * declared range admits, so a range that claims more than the code supports
 * fails here rather than in an application.
 */
export function peerSpecifiers(peerDependencies, mode) {
  return Object.fromEntries(
    Object.entries(peerDependencies).map(([name, range]) => {
      if (mode === 'latest') return [name, range]
      const floor = semver.minVersion(range)
      if (!floor) throw new Error(`cannot derive a floor for ${name}@${range}`)
      return [name, floor.version]
    })
  )
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  const manifest = readJson(join(ROOT_DIR, 'packages/connectrpc/package.json'))
  const peers = peerSpecifiers(manifest.peerDependencies ?? {}, args.peers)
  if (Object.keys(peers).length === 0) fail('the adapter declares no peer dependencies')

  const tempDir = mkdtempSync(join(tmpdir(), 'tachui-connectrpc-packed-'))
  try {
    if (!args.skipBuild) {
      console.log(`${TAG} building`)
      for (const pkg of PACKAGES) run('bun', ['run', '--filter', pkg.name, 'build'], ROOT_DIR)
    }

    console.log(`${TAG} packing`)
    const packDir = join(tempDir, 'packs')
    mkdirSync(packDir)
    const tarballs = {}
    for (const pkg of PACKAGES) {
      const before = new Set(readdirSync(packDir))
      run('bun', ['pm', 'pack', '--destination', packDir, '--quiet'], join(ROOT_DIR, 'packages', pkg.dir))
      const added = readdirSync(packDir).filter(file => !before.has(file))
      if (added.length !== 1) fail(`expected one tarball for ${pkg.name}, found ${added.length}`)
      tarballs[pkg.name] = join(packDir, added[0])
    }

    console.log(`${TAG} installing with ${args.peers} peers: ${JSON.stringify(peers)}`)
    const appDir = join(tempDir, 'app')
    mkdirSync(appDir)
    const dependencies = { ...peers }
    for (const [name, tarball] of Object.entries(tarballs)) dependencies[name] = `file:${tarball}`
    writeFileSync(
      join(appDir, 'package.json'),
      `${JSON.stringify({ name: 'connectrpc-packed-app', private: true, type: 'module', dependencies }, null, 2)}\n`
    )
    run('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], appDir)

    checkPeers(appDir, manifest.peerDependencies, peers, args.peers)
    checkRuntime(appDir)
    checkExternals(appDir)
    checkTreeShaking(appDir, tempDir)
    checkTypes(appDir)

    console.log(`${TAG} success (${args.peers} peers)`)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
}

function checkPeers(appDir, ranges, specifiers, mode) {
  for (const [name, range] of Object.entries(ranges)) {
    const tree = JSON.parse(run('npm', ['ls', name, '--all', '--json', '--long'], appDir))
    const installed = checkPeerTree(tree, name, range, specifiers[name], mode)
    console.log(`${TAG} ${name}@${installed}`)
  }
}

/**
 * Checks one peer in an `npm ls --all --json --long` tree: exactly one
 * installed copy, inside the declared range, and at the floor on a floor run.
 * Returns the installed version.
 */
export function checkPeerTree(tree, name, range, specifier, mode) {
  const copies = collectInstalledPaths(tree, name)
  if (copies.size !== 1) {
    const found = [...copies].map(([path, version]) => `${version} at ${path}`).join(', ')
    fail(`expected one installed copy of ${name}, found: ${found || 'none'}`)
  }
  const [installed] = copies.values()
  if (!semver.satisfies(installed, range)) fail(`${name}@${installed} is outside ${range}`)
  if (mode === 'floor' && installed !== specifier) {
    fail(`expected ${name}@${specifier} at the floor, installed ${installed}`)
  }
  return installed
}

function checkRuntime(appDir) {
  const script = `
    import { DEFAULT_TRANSPORT_NAME, isRetryableCode } from '@tachui/connectrpc'
    import { Code } from '@connectrpc/connect'
    const retryable = Object.values(Code).filter(code => typeof code === 'number' && isRetryableCode(code))
    if (DEFAULT_TRANSPORT_NAME !== 'default') throw new Error('unexpected DEFAULT_TRANSPORT_NAME')
    // Sorted, so the check does not depend on the order Connect declares its codes in.
    const expected = [Code.ResourceExhausted, Code.Unavailable].sort((a, b) => a - b)
    if (JSON.stringify(retryable.sort((a, b) => a - b)) !== JSON.stringify(expected)) {
      throw new Error('isRetryableCode disagrees with the installed Connect codes')
    }
  `
  run('node', ['--input-type=module', '-e', script], appDir)
}

/**
 * The built entry must import its peers by name. `DataLoss` is a member of
 * Connect's `Code` enum the adapter never names — it does name `Canceled` and
 * `DeadlineExceeded`, for the failures it raises itself — so it can only appear
 * in the built entry if the enum itself was inlined.
 */
function checkExternals(appDir) {
  const entry = readFileSync(join(appDir, 'node_modules/@tachui/connectrpc/dist/index.js'), 'utf8')
  if (!/from\s*["']@connectrpc\/connect["']/.test(entry)) {
    fail('the built entry does not import @connectrpc/connect by name')
  }
  if (entry.includes('DataLoss')) fail('the built entry carries its own copy of Connect')
}

function bundledInputs(appDir, outDir, name, source) {
  const esbuild = createRequire(join(ROOT_DIR, 'package.json'))('esbuild')
  const entry = join(outDir, `${name}.mjs`)
  writeFileSync(entry, source)
  const result = esbuild.buildSync({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'browser',
    write: false,
    metafile: true,
    nodePaths: [join(appDir, 'node_modules')],
    absWorkingDir: appDir,
  })
  // `metafile.inputs` lists every file esbuild parsed, including ones it then
  // shook out entirely, so only what contributed bytes to the output counts.
  const [output] = Object.values(result.metafile.outputs)
  return Object.entries(output.inputs)
    .filter(([, contribution]) => contribution.bytesInOutput > 0)
    .map(([input]) => input)
}

function checkTreeShaking(appDir, tempDir) {
  const outDir = join(tempDir, 'bundles')
  mkdirSync(outDir)
  const isConnectRuntime = input => /@connectrpc\/|@bufbuild\//.test(input)

  const shaken = bundledInputs(
    appDir,
    outDir,
    'constant-only',
    `import { DEFAULT_TRANSPORT_NAME } from '@tachui/connectrpc'\nconsole.log(DEFAULT_TRANSPORT_NAME)\n`
  )
  const leaked = shaken.filter(isConnectRuntime)
  if (leaked.length > 0) fail(`importing one constant pulled in Connect: ${leaked.join(', ')}`)

  // The control: an export that does use Connect must bring it in, or the
  // check above could never have failed.
  const control = bundledInputs(
    appDir,
    outDir,
    'uses-connect',
    `import { isRetryableCode } from '@tachui/connectrpc'\nconsole.log(isRetryableCode(14))\n`
  )
  if (!control.some(isConnectRuntime)) {
    fail('the control bundle did not include Connect, so the tree-shaking check proves nothing')
  }
}

function checkTypes(appDir) {
  writeFileSync(
    join(appDir, 'consumer.ts'),
    `import type { DescMessage } from '@bufbuild/protobuf'
import { Code } from '@connectrpc/connect'
import type {
  ConnectCallOptions,
  ConnectQueryKey,
  ConnectQueryOptions,
  ConnectQueryResult,
} from '@tachui/connectrpc'
import { DEFAULT_TRANSPORT_NAME, isRetryableCode } from '@tachui/connectrpc'

export const key: ConnectQueryKey = ['connect', DEFAULT_TRANSPORT_NAME, 'acme.v1.Service', 'Method', '{}']
export const callOptions: ConnectCallOptions = { timeoutMs: 1000 }
export const options: ConnectQueryOptions<DescMessage> = { staleTime: 1000, callOptions }
export type Result = ConnectQueryResult<string>
export const retryable: boolean = isRetryableCode(Code.Unavailable)
`
  )
  const tsc = join(ROOT_DIR, 'node_modules/typescript/bin/tsc')
  // Bundler resolution only. Every tachUI package emits extensionless
  // relative imports in its declarations, which `nodenext` rejects, and the
  // starter templates resolve with `bundler`.
  for (const [module, moduleResolution] of [['esnext', 'bundler']]) {
    // `skipLibCheck` stays off: the point is to check the published
    // declarations against the installed peers, not only the consumer.
    const config = `tsconfig.${moduleResolution}.json`
    writeFileSync(
      join(appDir, config),
      JSON.stringify({
        compilerOptions: {
          noEmit: true,
          strict: true,
          skipLibCheck: false,
          target: 'es2022',
          lib: ['es2022', 'dom'],
          module,
          moduleResolution,
          types: [],
        },
        files: ['consumer.ts'],
      })
    )
    run('node', [tsc, '--project', config], appDir)
    console.log(`${TAG} types resolve under ${moduleResolution}`)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(`${TAG} ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
