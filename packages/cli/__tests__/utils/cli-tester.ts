/**
 * CLI Testing Utilities
 * 
 * Provides utilities for testing CLI commands in isolation with mocked
 * file system operations, user prompts, and process spawning.
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import { tmpdir } from 'os'
import { mkdtemp, rm } from 'fs/promises'

const execAsync = promisify(exec)

export interface CLITestResult {
  exitCode: number
  stdout: string
  stderr: string
  duration: number
}

export interface CLITestOptions {
  args?: string[]
  cwd?: string
  env?: Record<string, string>
  timeout?: number
  input?: string
}

/**
 * CLI Test Runner for isolated command testing
 */
export class CLITester {
  private tempDir: string | null = null
  private readonly cliPath: string

  constructor() {
    this.cliPath = path.resolve(__dirname, '../../bin/tacho.js')
  }

  /**
   * Create temporary directory for test isolation
   */
  async createTempDir(): Promise<string> {
    this.tempDir = await mkdtemp(path.join(tmpdir(), 'tachui-cli-test-'))
    return this.tempDir
  }

  /**
   * Execute CLI command with options
   */
  async run(command: string, options: CLITestOptions = {}): Promise<CLITestResult> {
    const {
      args = [],
      cwd = this.tempDir || process.cwd(),
      env = {},
      timeout = 30000,
      input
    } = options

    const startTime = Date.now()
    
    try {
      const fullCommand = [
        'node',
        this.cliPath,
        command,
        ...args
      ].join(' ')

      const { stdout, stderr } = await execAsync(fullCommand, {
        cwd,
        env: { ...process.env, ...env },
        timeout,
        ...(input && { input })
      })

      return {
        exitCode: 0,
        stdout,
        stderr,
        duration: Date.now() - startTime
      }
    } catch (error: any) {
      return {
        exitCode: error.code || 1,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test CLI command with expected success
   */
  async expectSuccess(command: string, options: CLITestOptions = {}): Promise<CLITestResult> {
    const result = await this.run(command, options)
    
    if (result.exitCode !== 0) {
      throw new Error(
        `Expected command "${command}" to succeed but got exit code ${result.exitCode}:\n` +
        `STDOUT: ${result.stdout}\n` +
        `STDERR: ${result.stderr}`
      )
    }

    return result
  }

  /**
   * Test CLI command with expected failure
   */
  async expectFailure(command: string, options: CLITestOptions = {}): Promise<CLITestResult> {
    const result = await this.run(command, options)
    
    if (result.exitCode === 0) {
      throw new Error(
        `Expected command "${command}" to fail but it succeeded:\n` +
        `STDOUT: ${result.stdout}\n` +
        `STDERR: ${result.stderr}`
      )
    }

    return result
  }

  /**
   * Test help command output
   */
  async testHelpCommand(): Promise<string> {
    const result = await this.run('--help')
    return result.stdout
  }

  /**
   * Test version command output  
   */
  async testVersionCommand(): Promise<string> {
    const result = await this.run('--version')
    return result.stdout.trim()
  }

  /**
   * Clean up temporary directory
   */
  async cleanup(): Promise<void> {
    if (this.tempDir) {
      try {
        await rm(this.tempDir, { recursive: true, force: true })
      } catch (error) {
        console.warn('Failed to cleanup temp directory:', error)
      }
      this.tempDir = null
    }
  }
}

/**
 * Create isolated CLI test environment
 */
export async function createCLITestEnvironment(): Promise<CLITester> {
  const tester = new CLITester()
  await tester.createTempDir()
  return tester
}

/**
 * Mock user prompts for testing interactive commands
 */
export class PromptMocker {
  private responses: Map<string, any> = new Map()

  /**
   * Set response for a specific prompt
   */
  setResponse(promptKey: string, response: any): void {
    this.responses.set(promptKey, response)
  }

  /**
   * Set multiple prompt responses
   */
  setResponses(responses: Record<string, any>): void {
    Object.entries(responses).forEach(([key, value]) => {
      this.setResponse(key, value)
    })
  }

  /**
   * Get mocked response for prompt
   */
  getResponse(promptKey: string): any {
    return this.responses.get(promptKey)
  }

  /**
   * Clear all mocked responses
   */
  clear(): void {
    this.responses.clear()
  }
}

/**
 * File system test utilities
 */
export const fsTestUtils = {
  /**
   * Create test file with content
   */
  async createTestFile(filePath: string, content: string): Promise<void> {
    const { writeFile, mkdir } = await import('fs/promises')
    const dir = path.dirname(filePath)
    await mkdir(dir, { recursive: true })
    await writeFile(filePath, content, 'utf-8')
  },

  /**
   * Read test file content
   */
  async readTestFile(filePath: string): Promise<string> {
    const { readFile } = await import('fs/promises')
    return readFile(filePath, 'utf-8')
  },

  /**
   * Check if file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    const { access } = await import('fs/promises')
    try {
      await access(filePath)
      return true
    } catch {
      return false
    }
  }
}