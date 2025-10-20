import { ObservableObjectBase } from '@tachui/core/state'
import { createSignal } from '@tachui/core/reactive'
import type { TapeEntry } from '../types/calculator-tape'

export class AppStateStore extends ObservableObjectBase {
  private _tapeDisplaySignal = createSignal(false)
  private _tapeEntriesSignal = createSignal<TapeEntry[]>([])
  private _nextEntryId: number = 1
  private _nextHistoryIndex: number = -1

  get tapeDisplay() {
    return this._tapeDisplaySignal[0].peek()  // Use peek() for non-reactive access
  }

  get tapeEntries() {
    return this._tapeEntriesSignal[0].peek()  // Use peek() for non-reactive access
  }

  // Reactive getter functions for components
  getTapeDisplaySignal = () => this._tapeDisplaySignal[0]()
  getTapeEntriesSignal = () => this._tapeEntriesSignal[0]()

  // Actual signal getters for reactive components
  get tapeDisplaySignal() { return this._tapeDisplaySignal[0] }
  get tapeEntriesSignal() { return this._tapeEntriesSignal[0] }

  toggleTape(): void {
    const currentValue = this._tapeDisplaySignal[0].peek()  // Use peek() to avoid reactive subscription
    this._tapeDisplaySignal[1](!currentValue)
  }

  addTapeEntry(operation: string): void {
    const entry: TapeEntry = {
      id: this._nextEntryId++,
      operation,
      timestamp: new Date(),
      historyIndex: this._nextHistoryIndex--
    }

    const currentEntries = this._tapeEntriesSignal[0]()
    this._tapeEntriesSignal[1]([...currentEntries, entry].slice(-256)) // Keep last 256 entries
  }

  clearTape(): void {
    this._tapeEntriesSignal[1]([])
    this._nextEntryId = 1
    this._nextHistoryIndex = -1
  }
}
