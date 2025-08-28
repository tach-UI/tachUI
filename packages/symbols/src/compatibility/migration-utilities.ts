/**
 * Migration Utilities for SF Symbols Compatibility
 * 
 * Comprehensive tools for migrating between icon systems, analyzing codebases,
 * and providing automated conversion recommendations.
 */

import { getSFSymbolMapping, getAllSupportedSFSymbols } from './sf-symbols-mapping.js'
import { resolveVariantFromName, isVariantSupported } from './variant-mapping.js'
import { getSymbolCategory, SymbolCategory } from './category-mapping.js'
import type { SymbolVariant, SymbolWeight } from '../types.js'

/**
 * Migration analysis result for a single symbol
 */
export interface SymbolMigrationResult {
  original: string
  target: string
  status: 'success' | 'partial' | 'failed' | 'warning'
  confidence: number // 0-100 scale
  issues: string[]
  recommendations: string[]
  alternatives: string[]
  category?: SymbolCategory
  variant?: SymbolVariant
  weight?: SymbolWeight
}

/**
 * Comprehensive migration analysis for an entire project
 */
export interface ProjectMigrationAnalysis {
  summary: {
    totalSymbols: number
    successfulMigrations: number
    partialMigrations: number
    failedMigrations: number
    warningCount: number
    averageConfidence: number
  }
  results: SymbolMigrationResult[]
  categories: Record<SymbolCategory, number>
  recommendations: {
    priority: 'high' | 'medium' | 'low'
    action: string
    description: string
    affectedSymbols: string[]
  }[]
  statistics: {
    mostCommonIssues: Array<{ issue: string; count: number }>
    categoryDistribution: Array<{ category: SymbolCategory; count: number }>
    confidenceDistribution: Array<{ range: string; count: number }>
  }
}

/**
 * Configuration options for migration analysis
 */
export interface MigrationOptions {
  /** Target icon set for migration */
  targetIconSet: 'lucide' | 'material' | 'feather' | 'heroicons'
  
  /** Whether to include variant analysis */
  includeVariants: boolean
  
  /** Whether to include weight analysis */
  includeWeights: boolean
  
  /** Minimum confidence threshold for recommendations */
  confidenceThreshold: number
  
  /** Whether to suggest alternatives for failed migrations */
  suggestAlternatives: boolean
  
  /** Custom symbol mappings to supplement built-in mappings */
  customMappings?: Record<string, string>
  
  /** Deprecated symbols to flag for replacement */
  deprecatedSymbols?: string[]
  
  /** Contextual information about symbol usage */
  usageContext?: 'web' | 'mobile' | 'desktop' | 'universal'
}

/**
 * Default migration options
 */
const DEFAULT_MIGRATION_OPTIONS: MigrationOptions = {
  targetIconSet: 'lucide',
  includeVariants: true,
  includeWeights: true,
  confidenceThreshold: 70,
  suggestAlternatives: true,
  usageContext: 'web'
}

/**
 * Analyze migration of a single SF Symbol
 * 
 * @param sfSymbol - The SF Symbol name to analyze
 * @param options - Migration options
 * @returns Migration analysis result
 */
export function analyzeSingleSymbolMigration(
  sfSymbol: string,
  options: Partial<MigrationOptions> = {}
): SymbolMigrationResult {
  const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options }
  const result: SymbolMigrationResult = {
    original: sfSymbol,
    target: '',
    status: 'failed',
    confidence: 0,
    issues: [],
    recommendations: [],
    alternatives: []
  }
  
  try {
    // Parse variant and weight information
    const { baseName, variant, lucideIcon } = resolveVariantFromName(sfSymbol)
    const mapping = getSFSymbolMapping(baseName)
    
    result.variant = variant
    result.category = getSymbolCategory(baseName)
    
    if (mapping) {
      result.target = lucideIcon
      result.confidence = mapping.matchQuality === 'exact' ? 95 :
                         mapping.matchQuality === 'close' ? 80 : 60
      
      // Check variant support
      if (opts.includeVariants && variant !== 'none') {
        if (!isVariantSupported(baseName, variant)) {
          result.issues.push(`Variant '${variant}' not fully supported`)
          result.confidence -= 15
          result.recommendations.push(`Consider using base variant or alternative styling`)
        }
      }
      
      // Add notes if available
      if (mapping.notes) {
        result.recommendations.push(mapping.notes)
      }
      
      // Determine final status
      if (result.confidence >= 90) {
        result.status = 'success'
      } else if (result.confidence >= opts.confidenceThreshold) {
        result.status = 'partial'
      } else {
        result.status = 'warning'
      }
      
    } else {
      // No direct mapping found
      result.issues.push('No direct mapping available')
      result.status = 'failed'
      
      if (opts.suggestAlternatives) {
        result.alternatives = findSimilarSymbols(baseName, 3)
      }
    }
    
    // Check for deprecated symbols
    if (opts.deprecatedSymbols?.includes(sfSymbol)) {
      result.issues.push('Symbol is deprecated')
      result.recommendations.push('Consider updating to recommended alternative')
      result.confidence = Math.min(result.confidence, 50)
    }
    
    // Add custom mappings
    if (opts.customMappings?.[sfSymbol]) {
      result.target = opts.customMappings[sfSymbol]
      result.confidence = Math.max(result.confidence, 85)
      result.recommendations.push('Using custom mapping')
    }
    
  } catch (error) {
    result.issues.push(`Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    result.status = 'failed'
  }
  
  return result
}

/**
 * Analyze migration for multiple SF Symbols
 * 
 * @param sfSymbols - Array of SF Symbol names
 * @param options - Migration options
 * @returns Comprehensive project migration analysis
 */
export function analyzeProjectMigration(
  sfSymbols: string[],
  options: Partial<MigrationOptions> = {}
): ProjectMigrationAnalysis {
  const opts = { ...DEFAULT_MIGRATION_OPTIONS, ...options }
  
  // Analyze each symbol
  const results = sfSymbols.map(symbol => 
    analyzeSingleSymbolMigration(symbol, opts)
  )
  
  // Calculate summary statistics
  const summary = {
    totalSymbols: results.length,
    successfulMigrations: results.filter(r => r.status === 'success').length,
    partialMigrations: results.filter(r => r.status === 'partial').length,
    failedMigrations: results.filter(r => r.status === 'failed').length,
    warningCount: results.filter(r => r.status === 'warning').length,
    averageConfidence: results.reduce((sum, r) => sum + r.confidence, 0) / results.length
  }
  
  // Categorize results
  const categories: Record<SymbolCategory, number> = {} as any
  results.forEach(result => {
    if (result.category) {
      categories[result.category] = (categories[result.category] || 0) + 1
    }
  })
  
  // Generate recommendations
  const recommendations = generateProjectRecommendations(results, opts)
  
  // Collect statistics
  const statistics = generateMigrationStatistics(results)
  
  return {
    summary,
    results,
    categories,
    recommendations,
    statistics
  }
}

/**
 * Find similar symbols for failed migrations
 * 
 * @param symbolName - The symbol to find alternatives for
 * @param limit - Maximum number of alternatives
 * @returns Array of similar symbol names
 */
function findSimilarSymbols(symbolName: string, limit: number = 5): string[] {
  const allSymbols = getAllSupportedSFSymbols()
  const similarities: Array<{ symbol: string; score: number }> = []
  
  const symbolLower = symbolName.toLowerCase()
  
  allSymbols.forEach(symbol => {
    let score = 0
    const symbolLowerCase = symbol.toLowerCase()
    
    // Exact substring match gets high score
    if (symbolLowerCase.includes(symbolLower) || symbolLower.includes(symbolLowerCase)) {
      score += 50
    }
    
    // Word boundary matches
    const symbolWords = symbolLowerCase.split(/[._\-\s]/)
    const targetWords = symbolLower.split(/[._\-\s]/)
    
    symbolWords.forEach(word => {
      if (targetWords.includes(word)) {
        score += 20
      }
    })
    
    // Character similarity (simple Levenshtein approximation)
    const maxLength = Math.max(symbolLowerCase.length, symbolLower.length)
    const commonChars = [...symbolLowerCase].filter(char => symbolLower.includes(char)).length
    score += (commonChars / maxLength) * 10
    
    if (score > 0) {
      similarities.push({ symbol, score })
    }
  })
  
  return similarities
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(item => item.symbol)
}

/**
 * Generate project-level recommendations
 */
function generateProjectRecommendations(
  results: SymbolMigrationResult[],
  options: MigrationOptions
): ProjectMigrationAnalysis['recommendations'] {
  const recommendations: ProjectMigrationAnalysis['recommendations'] = []
  
  // High priority: Failed migrations
  const failedSymbols = results.filter(r => r.status === 'failed').map(r => r.original)
  if (failedSymbols.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Address failed migrations',
      description: `${failedSymbols.length} symbols have no direct mapping and need manual review`,
      affectedSymbols: failedSymbols
    })
  }
  
  // Medium priority: Low confidence migrations
  const lowConfidenceSymbols = results
    .filter(r => r.confidence < options.confidenceThreshold && r.status !== 'failed')
    .map(r => r.original)
  
  if (lowConfidenceSymbols.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Review low confidence migrations',
      description: `${lowConfidenceSymbols.length} symbols have low confidence mappings and should be visually verified`,
      affectedSymbols: lowConfidenceSymbols
    })
  }
  
  // Medium priority: Variant issues
  const variantIssueSymbols = results
    .filter(r => r.issues.some(issue => issue.includes('variant')))
    .map(r => r.original)
    
  if (variantIssueSymbols.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Address variant compatibility',
      description: `${variantIssueSymbols.length} symbols use variants that may not render as expected`,
      affectedSymbols: variantIssueSymbols
    })
  }
  
  // Low priority: Deprecated symbols
  const deprecatedSymbols = results
    .filter(r => r.issues.some(issue => issue.includes('deprecated')))
    .map(r => r.original)
    
  if (deprecatedSymbols.length > 0) {
    recommendations.push({
      priority: 'low',
      action: 'Update deprecated symbols',
      description: `${deprecatedSymbols.length} symbols are deprecated and should be updated`,
      affectedSymbols: deprecatedSymbols
    })
  }
  
  return recommendations
}

/**
 * Generate migration statistics
 */
function generateMigrationStatistics(
  results: SymbolMigrationResult[]
): ProjectMigrationAnalysis['statistics'] {
  // Most common issues
  const issueCount: Record<string, number> = {}
  results.forEach(result => {
    result.issues.forEach(issue => {
      issueCount[issue] = (issueCount[issue] || 0) + 1
    })
  })
  
  const mostCommonIssues = Object.entries(issueCount)
    .map(([issue, count]) => ({ issue, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  // Category distribution
  const categoryCount: Record<string, number> = {}
  results.forEach(result => {
    if (result.category) {
      categoryCount[result.category] = (categoryCount[result.category] || 0) + 1
    }
  })
  
  const categoryDistribution = Object.entries(categoryCount)
    .map(([category, count]) => ({ category: category as SymbolCategory, count }))
    .sort((a, b) => b.count - a.count)
  
  // Confidence distribution
  const confidenceRanges = [
    { range: '90-100%', min: 90, max: 100 },
    { range: '80-89%', min: 80, max: 89 },
    { range: '70-79%', min: 70, max: 79 },
    { range: '60-69%', min: 60, max: 69 },
    { range: '0-59%', min: 0, max: 59 }
  ]
  
  const confidenceDistribution = confidenceRanges.map(range => ({
    range: range.range,
    count: results.filter(r => r.confidence >= range.min && r.confidence <= range.max).length
  }))
  
  return {
    mostCommonIssues,
    categoryDistribution,
    confidenceDistribution
  }
}

/**
 * Generate migration code snippets and scripts
 * 
 * @param results - Migration analysis results
 * @param format - Output format
 * @returns Generated migration code
 */
export function generateMigrationCode(
  results: SymbolMigrationResult[],
  format: 'typescript' | 'javascript' | 'json' | 'css' | 'markdown' = 'typescript'
): string {
  switch (format) {
    case 'typescript':
      return generateTypeScriptMigration(results)
    
    case 'javascript':
      return generateJavaScriptMigration(results)
    
    case 'json':
      return generateJSONMigration(results)
    
    case 'css':
      return generateCSSMigration(results)
    
    case 'markdown':
      return generateMarkdownMigration(results)
    
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

/**
 * Generate TypeScript migration code
 */
function generateTypeScriptMigration(results: SymbolMigrationResult[]): string {
  const successfulMigrations = results.filter(r => r.status === 'success' || r.status === 'partial')
  
  const mappingEntries = successfulMigrations.map(result => 
    `  '${result.original}': '${result.target}'`
  ).join(',\n')
  
  return `// Auto-generated SF Symbol to Lucide migration mapping
export const SF_SYMBOL_MIGRATION_MAP = {
${mappingEntries}
} as const

// Usage example:
import { Image } from '@tachui/symbols'

// Before:
// const icon = Symbol('heart.fill')

// After:
const sfSymbolName = 'heart.fill'
const lucideName = SF_SYMBOL_MIGRATION_MAP[sfSymbolName] || 'help-circle'
const icon = Image({ systemName: sfSymbolName })

// The Image component automatically handles the mapping
`
}

/**
 * Generate JavaScript migration code
 */
function generateJavaScriptMigration(results: SymbolMigrationResult[]): string {
  const successfulMigrations = results.filter(r => r.status === 'success' || r.status === 'partial')
  
  const mappingEntries = successfulMigrations.map(result => 
    `  '${result.original}': '${result.target}'`
  ).join(',\n')
  
  return `// Auto-generated SF Symbol to Lucide migration mapping
const SF_SYMBOL_MIGRATION_MAP = {
${mappingEntries}
}

// Usage example:
const { Image } = require('@tachui/symbols')

// Migration helper function
function migrateSymbol(sfSymbolName) {
  return SF_SYMBOL_MIGRATION_MAP[sfSymbolName] || 'help-circle'
}

// Usage
const icon = Image({ systemName: 'heart.fill' })
`
}

/**
 * Generate JSON migration mapping
 */
function generateJSONMigration(results: SymbolMigrationResult[]): string {
  const mapping: Record<string, any> = {}
  
  results.forEach(result => {
    mapping[result.original] = {
      target: result.target,
      status: result.status,
      confidence: result.confidence,
      issues: result.issues,
      recommendations: result.recommendations,
      alternatives: result.alternatives
    }
  })
  
  return JSON.stringify({ symbolMigrationMapping: mapping }, null, 2)
}

/**
 * Generate CSS migration styles
 */
function generateCSSMigration(_results: SymbolMigrationResult[]): string {
  return `/* Auto-generated SF Symbol migration styles */
:root {
  /* Symbol weight variables */
  --symbol-weight-thin: 200;
  --symbol-weight-light: 300;
  --symbol-weight-regular: 400;
  --symbol-weight-medium: 500;
  --symbol-weight-bold: 700;
  
  /* Symbol stroke width variables */
  --symbol-stroke-thin: 1px;
  --symbol-stroke-light: 1.25px;
  --symbol-stroke-regular: 1.5px;
  --symbol-stroke-medium: 1.75px;
  --symbol-stroke-bold: 2px;
}

/* Migration utility classes */
.sf-symbol {
  font-family: inherit;
  font-weight: var(--symbol-weight-regular);
}

.sf-symbol--thin { font-weight: var(--symbol-weight-thin); }
.sf-symbol--light { font-weight: var(--symbol-weight-light); }
.sf-symbol--regular { font-weight: var(--symbol-weight-regular); }
.sf-symbol--medium { font-weight: var(--symbol-weight-medium); }
.sf-symbol--bold { font-weight: var(--symbol-weight-bold); }

/* SVG symbol styling */
.sf-symbol svg {
  stroke: currentColor;
  fill: none;
  stroke-width: var(--symbol-stroke-regular);
}

.sf-symbol--filled svg {
  fill: currentColor;
  stroke: none;
}
`
}

/**
 * Generate Markdown migration report
 */
function generateMarkdownMigration(results: SymbolMigrationResult[]): string {
  const successful = results.filter(r => r.status === 'success')
  const partial = results.filter(r => r.status === 'partial')
  const failed = results.filter(r => r.status === 'failed')
  
  let markdown = `# SF Symbol Migration Report

## Summary

- **Total Symbols**: ${results.length}
- **Successful Migrations**: ${successful.length}
- **Partial Migrations**: ${partial.length}
- **Failed Migrations**: ${failed.length}

## Successful Migrations

| SF Symbol | Lucide Icon | Confidence |
|-----------|-------------|------------|
`

  successful.forEach(result => {
    markdown += `| \`${result.original}\` | \`${result.target}\` | ${result.confidence}% |\n`
  })

  if (partial.length > 0) {
    markdown += `\n## Partial Migrations (Review Recommended)

| SF Symbol | Lucide Icon | Confidence | Issues |
|-----------|-------------|------------|---------|
`

    partial.forEach(result => {
      markdown += `| \`${result.original}\` | \`${result.target}\` | ${result.confidence}% | ${result.issues.join(', ')} |\n`
    })
  }

  if (failed.length > 0) {
    markdown += `\n## Failed Migrations (Manual Review Required)

| SF Symbol | Alternatives | Issues |
|-----------|--------------|---------|
`

    failed.forEach(result => {
      const alternatives = result.alternatives.length > 0 ? result.alternatives.join(', ') : 'None found'
      markdown += `| \`${result.original}\` | ${alternatives} | ${result.issues.join(', ')} |\n`
    })
  }

  return markdown
}

/**
 * Validate migration results
 * 
 * @param results - Migration analysis results
 * @returns Validation report
 */
export interface MigrationValidation {
  isValid: boolean
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export function validateMigration(results: SymbolMigrationResult[]): MigrationValidation {
  const validation: MigrationValidation = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  }
  
  // Check for critical issues
  const failedCount = results.filter(r => r.status === 'failed').length
  if (failedCount > results.length * 0.3) { // More than 30% failed
    validation.isValid = false
    validation.errors.push(`High failure rate: ${failedCount}/${results.length} symbols failed to migrate`)
  }
  
  // Check confidence levels
  const lowConfidenceCount = results.filter(r => r.confidence < 70).length
  if (lowConfidenceCount > results.length * 0.5) { // More than 50% low confidence
    validation.warnings.push(`Many low-confidence migrations: ${lowConfidenceCount}/${results.length} symbols`)
  }
  
  // Check for common issues
  const variantIssues = results.filter(r => r.issues.some(i => i.toLowerCase().includes('variant'))).length
  if (variantIssues > 0) {
    validation.suggestions.push(`Consider implementing custom variant handling for ${variantIssues} symbols`)
  }
  
  return validation
}