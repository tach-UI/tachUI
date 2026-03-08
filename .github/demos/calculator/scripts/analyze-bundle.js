#!/usr/bin/env node
/**
 * Calculator Bundle Analysis Script
 * Analyzes the calculator app for bundle optimization opportunities
 */

import { ApplicationOptimizer } from '../../packages/core/build/app-optimizer.js'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const calculatorPath = path.resolve(__dirname, '..')

async function analyzeCalculator() {
  console.log('🔍 Analyzing Calculator App for Bundle Optimization\n')

  try {
    // Initialize optimizer
    const optimizer = new ApplicationOptimizer(calculatorPath)

    // Run analysis
    console.log('📊 Analyzing application structure...')
    const profile = await optimizer.analyzeApplication()
    const recommendations = await optimizer.getOptimizationRecommendations()

    // Display results
    console.log(`📁 Project: ${profile.packageInfo.name}`)
    console.log(`📂 Source files: ${profile.sourceAnalysis.totalFiles} files analyzed`)
    console.log(`📦 Current bundle: ${Math.round(profile.currentBundle.size/1024)}KB (estimated)\n`)

    // Component usage
    console.log('📊 Component Usage Analysis:')
    profile.sourceAnalysis.componentUsage.forEach(comp => {
      console.log(`  ${comp.name}: ${comp.usageCount} uses (${comp.essential ? 'Essential' : 'Optional'}) - ${Math.round(comp.bundleImpact/1024)}KB`)
    })

    // Recommendations
    console.log('\n🎯 Optimization Recommendations:')
    const mainRec = recommendations.find(r => r.type === 'bundle-switch')
    if (mainRec) {
      console.log(`✅ HIGH CONFIDENCE: Switch to '${profile.optimization.recommendedBundle}'`)
      console.log(`   📦 Expected bundle size: ${Math.round(profile.optimization.potentialSavings > 0 ? (profile.currentBundle.size - profile.optimization.potentialSavings)/1024 : 50)}KB`)
      console.log(`   💰 Savings: ${Math.round((profile.optimization.potentialSavings/profile.currentBundle.size)*100)}% reduction`)
    }

    // Next steps
    console.log('\n💡 Next Steps:')
    console.log('   1. Add tachUIBundlePlugin to vite.config.ts')
    console.log('   2. Run: npm run build')
    console.log('   3. Compare bundle sizes')

  } catch (error) {
    console.error('❌ Analysis failed:', error.message)
    process.exit(1)
  }
}

analyzeCalculator()
