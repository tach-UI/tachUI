/**
 * Vite plugin to automatically tree-shake unused Lucide icons
 * Scans source code and only bundles required icons
 */

import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { join } from 'path'

interface IconTreeShakingOptions {
  /** Icon library to tree-shake (default: 'lucide') */
  library?: string
  /** Source directories to scan (default: ['src']) */
  scanDirs?: string[]
  /** Pattern to match icon usage (default: Symbol calls) */
  pattern?: RegExp
  /** Enable debug logging */
  debug?: boolean
}

export function iconTreeShaking(options: IconTreeShakingOptions = {}): Plugin {
  const {
    library = 'lucide',
    scanDirs = ['src'],
    pattern = /Symbol\\s*\\(\\s*['"\`]([^'"\`]+)['"\`]/g,
    debug = false
  } = options
  
  let usedIcons = new Set<string>()
  let root: string
  
  return {
    name: 'icon-tree-shaking',
    
    configResolved(config) {
      root = config.root
      
      // Scan for used icons
      scanDirs.forEach(dir => {
        const fullPath = join(root, dir)
        scanDirectory(fullPath, pattern, usedIcons)
      })
      
      if (debug) {
        console.log(`🎯 Found ${usedIcons.size} used icons:`, Array.from(usedIcons).join(', '))
      }
    },
    
    resolveId(id) {
      // Intercept lucide imports
      if (id === library) {
        return id
      }
      return null
    },
    
    load(id) {
      if (id === library) {
        // Generate a minimal lucide module with only used icons
        return generateMinimalIconModule(Array.from(usedIcons), debug)
      }
      return null
    }
  }
}

function scanDirectory(dir: string, pattern: RegExp, usedIcons: Set<string>) {
  // Implementation similar to icon-extractor.js
  // ... scanning logic
}

function generateMinimalIconModule(icons: string[], debug: boolean): string {
  if (debug) {
    console.log(`📦 Generating minimal icon module with ${icons.length} icons`)
  }
  
  // Generate ES module that exports only needed icons
  return \`
// Auto-generated minimal Lucide module
// Only includes: ${icons.join(', ')}

const icons = {
  ${icons.map(icon => {
    // Convert to PascalCase for Lucide naming
    const pascalCase = icon.split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('')
    
    // Return actual icon data (this would need real Lucide data)
    return \`\${pascalCase}: ['svg', {}, [/* actual icon paths */]]\`
  }).join(',\\n  ')}
}

${icons.map(icon => {
  const pascalCase = icon.split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
  return \`export const \${pascalCase} = icons.\${pascalCase}\`
}).join('\\n')}

export default icons
\`
}