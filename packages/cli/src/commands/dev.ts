/**
 * Tacho CLI - Dev Command
 *
 * Start development server with TachUI optimizations and real-time performance monitoring
 */

import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import chalk from 'chalk'
import { Command } from 'commander'
import ora from 'ora'

export const devCommand = new Command('dev')
  .description('Start development server with TachUI optimizations')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('-h, --host <host>', 'Host address', 'localhost')
  .option('--open', 'Open browser automatically', true)
  .option('--performance', 'Enable performance monitoring', false)
  .option('--debug', 'Enable debug mode with detailed logging', false)
  .action(async (options) => {
    try {
      const cwd = process.cwd()

      // Check if we're in a TachUI project
      const packageJsonPath = resolve(cwd, 'package.json')
      if (!existsSync(packageJsonPath)) {
        console.error(chalk.red('❌ No package.json found. Are you in a TachUI project?'))
        console.log(chalk.yellow('💡 Run `tacho init` to create a new project'))
        process.exit(1)
      }

      // Check for TachUI dependency
      const packageJson = require(packageJsonPath)
      const hasTachUI =
        packageJson.dependencies?.['@tachui/core'] || packageJson.devDependencies?.['@tachui/core']

      if (!hasTachUI) {
        console.log(chalk.yellow('⚠️  TachUI not found in dependencies'))
        console.log(chalk.blue('💡 This appears to be a regular Vite project'))
      }

      console.log(
        chalk.cyan(`
╭─────────────────────────────────────╮
│  🚀 TachUI Development Server       │
│  Enhanced for TachUI projects       │
╰─────────────────────────────────────╯
`)
      )

      // Performance monitoring setup
      if (options.performance) {
        console.log(chalk.green('📊 Performance monitoring enabled'))
        console.log(chalk.gray('  • Bundle size tracking'))
        console.log(chalk.gray('  • Hot reload performance'))
        console.log(chalk.gray('  • Memory usage monitoring'))
      }

      // Debug mode setup
      if (options.debug) {
        console.log(chalk.blue('🐛 Debug mode enabled'))
        console.log(chalk.gray('  • Detailed compilation logs'))
        console.log(chalk.gray('  • Signal tracking'))
        console.log(chalk.gray('  • Component lifecycle logging'))
      }

      const spinner = ora('Starting development server...').start()

      // Check if vite.config exists
      const viteConfigExists =
        existsSync(resolve(cwd, 'vite.config.ts')) || existsSync(resolve(cwd, 'vite.config.js'))

      if (!viteConfigExists) {
        spinner.warn('No vite.config found, using defaults')
      }

      // Prepare Vite command arguments
      const viteArgs = ['--port', options.port, '--host', options.host]

      if (options.open) {
        viteArgs.push('--open')
      }

      // Add TachUI-specific environment variables
      const env = {
        ...process.env,
        TACHUI_DEV: 'true',
        TACHUI_PERFORMANCE_MONITORING: options.performance ? 'true' : 'false',
        TACHUI_DEBUG: options.debug ? 'true' : 'false',
        NODE_ENV: 'development',
      }

      // Start Vite development server
      const viteProcess = spawn('npx', ['vite', ...viteArgs], {
        cwd,
        env,
        stdio: 'pipe',
      })

      let serverStarted = false

      viteProcess.stdout?.on('data', (data) => {
        const output = data.toString()

        // Detect when server is ready
        if (output.includes('Local:') && !serverStarted) {
          serverStarted = true
          spinner.succeed('Development server started!')

          // Show TachUI-specific info
          console.log(chalk.green('\n✅ TachUI Development Server Ready!'))

          if (options.performance) {
            console.log(chalk.blue('📊 Performance monitoring active'))
          }

          if (options.debug) {
            console.log(chalk.blue('🐛 Debug logging enabled'))
          }

          console.log(chalk.gray('\n📝 TachUI Features:'))
          console.log(chalk.gray('  • SwiftUI-style modifiers'))
          console.log(chalk.gray('  • Fine-grained reactivity'))
          console.log(chalk.gray('  • Direct DOM rendering'))
          console.log(chalk.gray('  • Phase 6 state management'))
          console.log(chalk.gray('  • Navigation system'))

          console.log(chalk.yellow('\n💡 Tips:'))
          console.log(chalk.gray('  • Use .modifier chains for styling'))
          console.log(chalk.gray('  • Try @State for reactive local state'))
          console.log(chalk.gray('  • Use TabView for navigation'))
          console.log(chalk.gray('  • Check browser devtools for performance'))
        }

        // Filter and enhance output
        const lines = output.split('\n').filter((line: string) => line.trim())
        lines.forEach((line: string) => {
          if (line.includes('Local:')) {
            console.log(chalk.green(line))
          } else if (line.includes('Network:')) {
            console.log(chalk.blue(line))
          } else if (line.includes('ready in')) {
            console.log(chalk.cyan(line))
          } else if (options.debug && line.trim()) {
            console.log(chalk.gray(line))
          }
        })
      })

      viteProcess.stderr?.on('data', (data) => {
        const error = data.toString()

        // Handle common TachUI-related errors
        if (error.includes('@tachui/core')) {
          console.error(chalk.red('❌ TachUI import error:'))
          console.error(chalk.gray(error))
          console.log(
            chalk.yellow('💡 Make sure @tachui/core is installed: npm install @tachui/core')
          )
        } else if (error.includes('TypeScript')) {
          console.error(chalk.red('❌ TypeScript error:'))
          console.error(chalk.gray(error))
        } else if (options.debug) {
          console.error(chalk.red(error))
        }
      })

      viteProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(chalk.red(`❌ Development server exited with code ${code}`))
        } else {
          console.log(chalk.green('✅ Development server stopped'))
        }
      })

      // Handle process termination
      process.on('SIGINT', () => {
        console.log(chalk.yellow('\n🛑 Stopping development server...'))
        viteProcess.kill('SIGINT')
        process.exit(0)
      })

      process.on('SIGTERM', () => {
        viteProcess.kill('SIGTERM')
        process.exit(0)
      })
    } catch (error) {
      console.error(chalk.red('❌ Error starting development server:'), (error as Error).message)

      // Provide helpful debugging information
      console.log(chalk.yellow('\n🔍 Troubleshooting:'))
      console.log(chalk.gray("  • Make sure you're in a TachUI project directory"))
      console.log(chalk.gray('  • Check that package.json exists'))
      console.log(chalk.gray('  • Verify @tachui/core is installed'))
      console.log(chalk.gray('  • Try: npm install && tacho dev'))

      process.exit(1)
    }
  })
