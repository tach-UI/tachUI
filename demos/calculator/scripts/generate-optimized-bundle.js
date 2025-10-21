#!/usr/bin/env node
/**
 * Calculator Optimized Bundle Generator
 * Generates optimized production bundles for the calculator app
 */

import { generateProductionBundle } from '../../packages/core/build/production-bundler.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const calculatorPath = path.resolve(__dirname, '..')

async function generateCalculatorBundle() {
  console.log('🏭 Generating Optimized Bundle for Calculator App\n')

  try {
    const outputDir = path.join(calculatorPath, 'dist/tachui-bundles')

    // Generate minimal-production bundle (perfect for calculator)
    console.log('📦 Generating minimal-production bundle...')
    const result = await generateProductionBundle('minimal-production', {
      projectRoot: calculatorPath,
      outputDir,
      bundleName: 'calculator-optimized',
      analysisReport: true,
      validationLevel: 'comprehensive',
      compressionFormat: 'gzip'
    })

    // Display results
    console.log('\n📊 Bundle Generation Results:')
    console.log(`✅ Bundle: ${result.bundleName}`)
    console.log(`📦 Size: ${Math.round(result.originalSize/1024)}KB`)
    if (result.compressedSize) {
      console.log(`🗜️  Compressed: ${Math.round(result.compressedSize/1024)}KB (gzipped)`)
    }

    console.log(`🎯 Components: ${result.analysis.componentCount}`)
    console.log(`⚡ Features: ${result.analysis.featureCount}`)

    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${result.warnings.length}`)
      result.warnings.forEach(warning => console.log(`   - ${warning}`))
    }

    if (result.errors.length > 0) {
      console.log(`\n❌ Errors: ${result.errors.length}`)
      result.errors.forEach(error => console.log(`   - ${error}`))
    } else {
      console.log('\n🎉 Bundle generation successful!')
    }

    // Performance comparison
    const baselineSize = 3.8 * 1024 * 1024 // 3.8MB
    const reduction = Math.round((1 - result.originalSize/baselineSize) * 100)
    console.log(`\n🚀 Performance Impact:`)
    console.log(`   💰 Size reduction: ${reduction}% (from 3.8MB)`)
    console.log(`   ⚡ Load time improvement: ~${Math.round((baselineSize - result.originalSize)/1024/1024*1000)}ms faster`)

    console.log(`\n📁 Generated files:`)
    console.log(`   📄 ${path.relative(calculatorPath, result.outputPath)}`)

    if (result.validationResults) {
      console.log(`\n🧪 Validation Results:`)
      console.log(`   ✅ Bundle integrity: ${result.validationResults.bundleIntegrity ? 'Passed' : 'Failed'}`)
      console.log(`   ✅ Dependencies: ${result.validationResults.dependencyResolution ? 'Passed' : 'Failed'}`)
      console.log(`   ✅ Runtime compatibility: ${result.validationResults.runtimeCompatibility ? 'Passed' : 'Failed'}`)
    }

  } catch (error) {
    console.error('❌ Bundle generation failed:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

generateCalculatorBundle()
