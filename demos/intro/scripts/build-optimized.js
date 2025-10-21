#!/usr/bin/env node
/**
 * Build script that automatically optimizes icons before building
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'

async function main() {
  console.log('🔍 Extracting used icons...')
  
  // Run icon extraction
  try {
    execSync('node ../../tools/extract-used-icons.js src src/icons/auto-generated.ts', { 
      stdio: 'inherit' 
    })
  } catch (error) {
    console.error('❌ Failed to extract icons:', error.message)
    process.exit(1)
  }
  
  // Verify icon set was generated
  if (!existsSync('src/icons/auto-generated.ts')) {
    console.error('❌ Icon extraction failed - no output generated')
    process.exit(1)
  }
  
  console.log('📦 Building optimized bundle...')
  
  // Run the normal build
  try {
    execSync('vite build', { stdio: 'inherit' })
    console.log('✅ Optimized build complete!')
  } catch (error) {
    console.error('❌ Build failed:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)