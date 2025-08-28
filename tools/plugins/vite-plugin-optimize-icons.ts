/**
 * Vite plugin to automatically optimize icon imports
 * Only bundles icons that are actually used in the code
 */

import type { Plugin } from 'vite'
import { readFileSync } from 'fs'
import { glob } from 'glob'

interface IconOptimizationOptions {
  /** Source directories to scan for icon usage */
  scanDirs?: string[]
  /** Pattern to match icon usage */
  iconPattern?: RegExp
  /** Icon library to optimize */
  library?: string
  /** Enable debug logging */
  debug?: boolean
}

export function optimizeIcons(options: IconOptimizationOptions = {}): Plugin {
  const {
    scanDirs = ['src/**/*.{ts,tsx,js,jsx}'],
    iconPattern = /Symbol\s*\(\s*['"`]([^'"`]+)['"`]/g,
    library = 'lucide',
    debug = false
  } = options
  
  let usedIcons = new Set<string>()
  let root: string
  
  return {
    name: 'optimize-icons',
    
    configResolved(config) {
      root = config.root
      
      // Scan for used icons
      const files = scanDirs.flatMap(pattern => 
        glob.sync(pattern, { cwd: root })
      )
      
      files.forEach(file => {
        try {
          const content = readFileSync(file, 'utf-8')
          const matches = Array.from(content.matchAll(iconPattern))
          matches.forEach(match => usedIcons.add(match[1]))
        } catch (error) {
          // Skip unreadable files
        }
      })
      
      if (debug) {
        console.log(`🎯 Found ${usedIcons.size} used icons:`, Array.from(usedIcons).join(', '))
      }
    },
    
    resolveId(id) {
      // Intercept lucide imports
      if (id === library) {
        return `virtual:optimized-${library}`
      }
      return null
    },
    
    load(id) {
      if (id === `virtual:optimized-${library}`) {
        return this.generateOptimizedIconModule(Array.from(usedIcons))
      }
      return null
    },
    
    generateOptimizedIconModule(icons: string[]) {
      // This would need actual implementation to extract SVG data
      const exports = icons.map(iconName => {
        const pascalName = iconName.split('-').map(part => 
          part.charAt(0).toUpperCase() + part.slice(1)
        ).join('')
        
        // In a real implementation, this would extract actual SVG data
        return `export const ${pascalName} = ['svg', {}, [/* actual icon data */]]`
      })
      
      return `
// Optimized icon module with only used icons: ${icons.join(', ')}
${exports.join('\n')}

export default {
  ${icons.map(icon => {
    const pascalName = icon.split('-').map(part => 
      part.charAt(0).toUpperCase() + part.slice(1)
    ).join('')
    return `${pascalName}`
  }).join(',\n  ')}
}
`
    }
  }
}