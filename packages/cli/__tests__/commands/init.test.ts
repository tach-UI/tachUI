import path from 'path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { exec } from 'child_process'
import { promisify } from 'util'
import { existsSync } from 'fs'
import { CLITester, createCLITestEnvironment, fsTestUtils } from '../utils/cli-tester'
import { fileURLToPath } from 'url'

const execAsync = promisify(exec)
const thisFilePath = fileURLToPath(import.meta.url)
const testsDir = path.dirname(thisFilePath)
const cliPackageDir = path.resolve(testsDir, '../..')

describe('TachUI CLI - Init Command', () => {
  let cliTester: CLITester
  let tempDir: string

  beforeEach(async () => {
    cliTester = await createCLITestEnvironment()
    tempDir = cliTester.getTempDir()
  })

  afterEach(async () => {
    await cliTester.cleanup()
  })

  it('creates a basic starter with --yes', async () => {
    const projectName = 'my-basic-app'
    const projectPath = path.join(tempDir, projectName)

    const result = await cliTester.expectSuccess('init', {
      args: [projectName, '--template', 'basic', '--yes'],
      cwd: tempDir,
    })

    expect(result.stdout).toContain('Project:')
    expect(await fsTestUtils.fileExists(path.join(projectPath, 'package.json'))).toBe(true)
    expect(await fsTestUtils.fileExists(path.join(projectPath, 'src/main.ts'))).toBe(true)

    const packageJson = JSON.parse(await fsTestUtils.readTestFile(path.join(projectPath, 'package.json')))
    expect(packageJson.name).toBe(projectName)
    expect(packageJson.dependencies).toHaveProperty('@tachui/core')
  })

  it('creates an advanced starter', async () => {
    const projectName = 'my-advanced-app'
    const projectPath = path.join(tempDir, projectName)

    await cliTester.expectSuccess('init', {
      args: [projectName, '--template', 'advanced', '--yes'],
      cwd: tempDir,
    })

    const appSource = await fsTestUtils.readTestFile(path.join(projectPath, 'src/App.ts'))
    expect(appSource).toContain("from '@tachui/core/state'")
    expect(appSource).toContain('State(')
  })

  it('supports init . in an empty directory', async () => {
    const workspace = path.join(tempDir, 'empty-root')
    const { mkdir } = await import('fs/promises')
    await mkdir(workspace, { recursive: true })

    await cliTester.expectSuccess('init', {
      args: ['.', '--template', 'basic', '--yes'],
      cwd: workspace,
    })

    expect(await fsTestUtils.fileExists(path.join(workspace, 'package.json'))).toBe(true)
    const packageJson = JSON.parse(await fsTestUtils.readTestFile(path.join(workspace, 'package.json')))
    expect(packageJson.name).toBe('empty-root')
  })

  it('rejects init . in a non-empty directory', async () => {
    const workspace = path.join(tempDir, 'occupied-root')
    await fsTestUtils.createTestFile(path.join(workspace, 'existing.txt'), 'existing')

    const result = await cliTester.expectFailure('init', {
      args: ['.', '--yes'],
      cwd: workspace,
    })

    expect(result.stderr).toContain('Current directory is not empty')
  })

  it('rejects phase6 template name after rename', async () => {
    const result = await cliTester.expectFailure('init', {
      args: ['my-app', '--template', 'phase6', '--yes'],
      cwd: tempDir,
    })

    expect(result.stderr).toContain('Unknown template "phase6"')
    expect(result.stderr).toContain('advanced')
  })

  it('rejects invalid project names', async () => {
    const result = await cliTester.expectFailure('init', {
      args: ['Invalid Name', '--yes'],
      cwd: tempDir,
    })

    expect(result.stderr).toContain('must be lowercase')
  })

  it('respects --tachui-version override', async () => {
    const projectName = 'pinned-version-app'
    const projectPath = path.join(tempDir, projectName)

    await cliTester.expectSuccess('init', {
      args: [projectName, '--yes', '--tachui-version', '0.8.0-alpha'],
      cwd: tempDir,
    })

    const packageJson = JSON.parse(await fsTestUtils.readTestFile(path.join(projectPath, 'package.json')))
    expect(packageJson.dependencies['@tachui/core']).toBe('0.8.0-alpha')
  })

  it('changes next-step install command with --package-manager pnpm', async () => {
    const result = await cliTester.expectSuccess('init', {
      args: ['pm-app', '--yes', '--package-manager', 'pnpm'],
      cwd: tempDir,
    })

    expect(result.stdout).toContain('pnpm install')
    expect(result.stdout).toContain('pnpm dev')
  })

  it('lists templates with --list-templates', async () => {
    const result = await cliTester.expectSuccess('init', {
      args: ['--list-templates'],
      cwd: tempDir,
    })

    expect(result.stdout).toContain('basic')
    expect(result.stdout).toContain('advanced')
    expect(result.exitCode).toBe(0)
  })

  it('can scaffold from built dist entrypoint', async () => {
    await execAsync('pnpm build', { cwd: cliPackageDir })

    const primaryDistEntry = path.resolve(cliPackageDir, 'dist/index.js')
    const fallbackDistEntry = path.resolve(cliPackageDir, 'dist/cli/src/index.js')
    const distEntry = existsSync(primaryDistEntry) ? primaryDistEntry : fallbackDistEntry

    expect(existsSync(distEntry)).toBe(true)
    const projectName = 'dist-entry-app'

    const evalScript = [
      `process.argv=['node','tacho','init','${projectName}','--template','basic','--yes'];`,
      `import('${distEntry}').then(m=>m.main());`,
    ].join('')

    const { stdout, stderr } = await execAsync(
      `${process.execPath} -e "${evalScript}"`,
      { cwd: tempDir }
    )

    expect(stderr).not.toContain('Error')
    expect(stdout).toContain('Project:')
    expect(await fsTestUtils.fileExists(path.join(tempDir, projectName, 'package.json'))).toBe(true)
  }, 120000)
})
