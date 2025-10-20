/**
 * Calculator Tape Types
 *
 * Type definitions for the calculator tape feature
 */

export interface TapeEntry {
  /** Unique identifier for the tape entry */
  id: number
  /** The operation string displayed on tape (e.g., "12 + 8 = 20") */
  operation: string
  /** Timestamp when operation was performed */
  timestamp: Date
  /** Negative history index (-1, -2, -3...) */
  historyIndex: number
}

export interface TapeState {
  /** All tape entries */
  entries: TapeEntry[]
  /** Whether the tape is currently visible */
  visible: boolean
  /** Next history index to assign */
  nextHistoryIndex: number
}

export type TapeAction = 
  | { type: 'ADD_ENTRY'; entry: Omit<TapeEntry, 'id' | 'timestamp' | 'historyIndex'> }
  | { type: 'CLEAR_TAPE' }
  | { type: 'TOGGLE_VISIBILITY' }
  | { type: 'SET_VISIBILITY'; visible: boolean }