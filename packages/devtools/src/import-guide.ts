/**
 * Developer Guidance Tools for Optimal TachUI Imports
 *
 * Provides interactive guidance and documentation for optimal import patterns
 */

export interface ImportGuidanceRule {
  pattern: RegExp
  recommendation: string
  example: string
  bundleImpact: string
  category:
    | 'layout'
    | 'reactive'
    | 'display'
    | 'effects'
    | 'forms'
    | 'navigation'
}

export interface ImportGuide {
  title: string
  description: string
  rules: ImportGuidanceRule[]
  examples: {
    good: string[]
    avoid: string[]
  }
}

export class ImportGuidanceSystem {
  private guides: Map<string, ImportGuide> = new Map()

  constructor() {
    this.initializeGuides()
  }

  private initializeGuides() {
    // Core Package Guidance
    this.guides.set('core', {
      title: 'TachUI Core Import Guide',
      description: 'Optimize core framework imports for minimal bundle size',
      rules: [
        {
          pattern: /^@tachui\/core$/,
          recommendation: 'Use specific subpaths instead of main export',
          example: '@tachui/core/reactive instead of @tachui/core',
          bundleImpact: 'Can save 20-35KB by avoiding unused code',
          category: 'reactive',
        },
        {
          pattern: /createSignal|createEffect|createComputed/,
          recommendation:
            'Import reactive functions from @tachui/core/reactive',
          example: "import { createSignal } from '@tachui/core/reactive'",
          bundleImpact: 'Saves ~33KB vs full core import',
          category: 'reactive',
        },
      ],
      examples: {
        good: [
          "import { createSignal, createEffect } from '@tachui/core/reactive'",
          "import { withComponentContext } from '@tachui/core/runtime'",
          "import { Assets } from '@tachui/core/assets'",
        ],
        avoid: [
          "import { createSignal, VStack, Button } from '@tachui/core'",
          "import * as TachUI from '@tachui/core'",
        ],
      },
    })

    // Primitives Package Guidance
    this.guides.set('primitives', {
      title: 'TachUI Primitives Import Guide',
      description: 'Import UI components with optimal granularity',
      rules: [
        {
          pattern: /VStack|HStack|Spacer/,
          recommendation:
            'Import layout components from @tachui/primitives/layout',
          example: "import { VStack, HStack } from '@tachui/primitives/layout'",
          bundleImpact: 'Saves ~27KB by avoiding display/control components',
          category: 'layout',
        },
        {
          pattern: /Text|Image|ScrollView/,
          recommendation:
            'Import display components from @tachui/primitives/display',
          example: "import { Text, Image } from '@tachui/primitives/display'",
          bundleImpact: 'Saves ~23KB by avoiding layout/control components',
          category: 'display',
        },
        {
          pattern: /Button|TextField|Toggle/,
          recommendation:
            'Import form controls from @tachui/primitives/controls',
          example: "import { Button } from '@tachui/primitives/controls'",
          bundleImpact: 'Saves ~20KB by avoiding layout/display components',
          category: 'forms',
        },
      ],
      examples: {
        good: [
          "import { VStack, HStack } from '@tachui/primitives/layout'",
          "import { Text } from '@tachui/primitives/display'",
          "import { Button } from '@tachui/primitives/controls'",
        ],
        avoid: [
          "import { VStack, Text, Button } from '@tachui/primitives'",
          "import * from '@tachui/primitives'",
        ],
      },
    })

    // Bundle Size Guidance
    this.guides.set('bundle-optimization', {
      title: 'Bundle Size Optimization Guide',
      description: 'Minimize your bundle size with smart import strategies',
      rules: [
        {
          pattern: /minimal|essential/,
          recommendation: 'Use bundle variants for production builds',
          example: "import { createSignal } from '@tachui/core/minimal'",
          bundleImpact: '45KB → 15KB for basic reactive apps',
          category: 'reactive',
        },
      ],
      examples: {
        good: [
          '// Production calculator app',
          "import { createSignal } from '@tachui/core/minimal'",
          "import { VStack } from '@tachui/primitives/layout'",
          '',
          '// Complex dashboard app',
          "import { createSignal } from '@tachui/core/reactive'",
          "import '@tachui/effects' // Only if animations needed",
        ],
        avoid: [
          '// Avoid importing everything',
          "import '@tachui/core'",
          "import '@tachui/primitives'",
          "import '@tachui/effects' // Unless you need animations",
        ],
      },
    })
  }

  /**
   * Get import guidance for specific imports
   */
  getGuidance(
    importPath: string,
    namedImports: string[] = []
  ): ImportGuidanceRule[] {
    const matchingRules: ImportGuidanceRule[] = []

    for (const guide of this.guides.values()) {
      for (const rule of guide.rules) {
        if (
          rule.pattern.test(importPath) ||
          namedImports.some(imp => rule.pattern.test(imp))
        ) {
          matchingRules.push(rule)
        }
      }
    }

    return matchingRules
  }

  /**
   * Generate import documentation for a specific package
   */
  generatePackageGuide(packageName: string): string {
    const guide = this.guides.get(packageName)
    if (!guide) return `No guidance available for package: ${packageName}`

    let docs = `# ${guide.title}\n\n${guide.description}\n\n`

    docs += `## ✅ Recommended Imports\n\n`
    for (const good of guide.examples.good) {
      docs += `\`\`\`typescript\n${good}\n\`\`\`\n\n`
    }

    docs += `## ❌ Avoid These Patterns\n\n`
    for (const avoid of guide.examples.avoid) {
      docs += `\`\`\`typescript\n${avoid}\n\`\`\`\n\n`
    }

    docs += `## 📦 Bundle Impact\n\n`
    for (const rule of guide.rules) {
      docs += `- **${rule.recommendation}**: ${rule.bundleImpact}\n`
    }

    return docs
  }

  /**
   * Interactive import helper for CLI
   */
  async getInteractiveRecommendations(imports: string[]): Promise<{
    recommendations: string[]
    potentialSavings: string
  }> {
    const recommendations: string[] = []
    let totalSavings = 0

    for (const importPath of imports) {
      const guidance = this.getGuidance(importPath)

      for (const rule of guidance) {
        recommendations.push(`${rule.recommendation} (${rule.bundleImpact})`)

        // Extract KB savings from impact string
        const match = rule.bundleImpact.match(/(\d+)KB/)
        if (match) totalSavings += parseInt(match[1])
      }
    }

    return {
      recommendations: [...new Set(recommendations)], // Dedupe
      potentialSavings: `~${totalSavings}KB`,
    }
  }

  /**
   * Generate import cheat sheet
   */
  generateCheatSheet(): string {
    return `# TachUI Import Cheat Sheet 📚

## 🏗️ Layout Components (8KB)
\`\`\`typescript
import { VStack, HStack, Spacer } from '@tachui/primitives/layout'
\`\`\`

## 🎨 Display Components (12KB)  
\`\`\`typescript
import { Text, Image, ScrollView } from '@tachui/primitives/display'
\`\`\`

## 🎛️ Control Components (15KB)
\`\`\`typescript
import { Button, TextField, Toggle } from '@tachui/primitives/controls'
\`\`\`

## ⚡ Reactive System (12KB)
\`\`\`typescript
import { createSignal, createEffect } from '@tachui/core/reactive'
\`\`\`

## 🎭 Effects & Animations (Only if needed!)
\`\`\`typescript
import '@tachui/effects' // Adds 25KB
\`\`\`

## 📱 Mobile UI Patterns
\`\`\`typescript
import { ActionSheet, Alert } from '@tachui/mobile'
\`\`\`

## 🧩 Flow Control
\`\`\`typescript  
import { Show, ForEach } from '@tachui/flow-control'
\`\`\`

## 📊 Bundle Variants for Production

### Calculator/Simple Apps (15KB total)
\`\`\`typescript
import { createSignal } from '@tachui/core/minimal'
import { VStack } from '@tachui/primitives/layout'  
\`\`\`

### Complex Apps (45KB total)
\`\`\`typescript
import { createSignal } from '@tachui/core/reactive'
import '@tachui/effects'
\`\`\`

## 🚫 Anti-Patterns to Avoid

❌ \`import { everything } from '@tachui/core'\` (45KB)  
✅ \`import { createSignal } from '@tachui/core/reactive'\` (12KB)

❌ \`import * from '@tachui/primitives'\` (35KB)  
✅ \`import { VStack } from '@tachui/primitives/layout'\` (8KB)
`
  }
}

/**
 * Console utility for development guidance
 */
export function logImportGuidance(
  importPath: string,
  namedImports: string[] = []
) {
  const system = new ImportGuidanceSystem()
  const guidance = system.getGuidance(importPath, namedImports)

  if (guidance.length === 0) {
    console.log(`✅ Import path "${importPath}" looks optimal`)
    return
  }

  console.group(`💡 TachUI Import Suggestions for "${importPath}"`)

  for (const rule of guidance) {
    console.log(`📦 ${rule.recommendation}`)
    console.log(`💰 ${rule.bundleImpact}`)
    console.log(`📝 Example: ${rule.example}`)
    console.log('---')
  }

  console.groupEnd()
}
