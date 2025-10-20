/**
 * Calculator Tape Utilities
 *
 * Helper functions for managing calculator tape entries
 */

import type { TapeEntry } from '../types/calculator-tape'

/**
 * Maximum number of tape entries to keep in memory
 */
export const MAX_TAPE_ENTRIES = 256

/**
 * Create a tape entry from operation details
 */
export function createTapeEntry(
  leftOperand: number | string,
  operator: string,
  rightOperand: number | string,
  result: number | string,
  historyIndex: number
): TapeEntry {
  return {
    id: Date.now() + Math.random(), // Ensure uniqueness
    operation: `${leftOperand} ${operator} ${rightOperand} = ${result}`,
    timestamp: new Date(),
    historyIndex,
  }
}

/**
 * Calculate the opacity for a tape entry based on its position in history
 * Newer entries (index closer to -1) have higher opacity
 */
export function calculateEntryOpacity(historyIndex: number, newestIndex: number): number {
  const position = Math.abs(newestIndex - historyIndex) // How far back in history
  const fadePercent = position * 10 // 10% fade per position
  return Math.max(0.5, (100 - fadePercent) / 100) // Minimum 50% opacity
}

/**
 * Trim tape entries to maximum allowed, keeping the most recent ones
 */
export function trimTapeEntries(entries: TapeEntry[]): TapeEntry[] {
  if (entries.length <= MAX_TAPE_ENTRIES) {
    return entries
  }
  
  // Keep the most recent MAX_TAPE_ENTRIES
  return entries.slice(-MAX_TAPE_ENTRIES)
}

/**
 * Format operator symbols for display
 */
export function formatOperatorForTape(operator: string): string {
  switch (operator) {
    case '*':
    case '×':
      return '×'
    case '/':
    case '÷':
      return '÷'
    case '+':
      return '+'
    case '-':
      return '-'
    default:
      return operator
  }
}