import { ObservableObjectBase } from "@tachui/core/state";
import {
  createSignal,
  type Signal,
  type SignalSetter,
} from "@tachui/core/reactive";
import type { TapeEntry } from "../types/calculator-tape";

export class AppStateStore extends ObservableObjectBase {
  private readonly tapeDisplayPair = createSignal(false) as [
    Signal<boolean>,
    SignalSetter<boolean>,
  ];
  private readonly tapeEntriesPair = createSignal<TapeEntry[]>([]) as [
    Signal<TapeEntry[]>,
    SignalSetter<TapeEntry[]>,
  ];
  private _nextEntryId = 1;
  private _nextHistoryIndex = -1;

  get tapeDisplay(): boolean {
    return this.tapeDisplayPair[0].peek();
  }

  get tapeEntries(): TapeEntry[] {
    return this.tapeEntriesPair[0].peek();
  }

  // Reactive getters for components
  getTapeDisplaySignal = (): Signal<boolean> => this.tapeDisplayPair[0];
  getTapeEntriesSignal = (): Signal<TapeEntry[]> => this.tapeEntriesPair[0];

  // Convenience accessors
  get tapeDisplaySignal(): Signal<boolean> {
    return this.tapeDisplayPair[0];
  }
  get tapeEntriesSignal(): Signal<TapeEntry[]> {
    return this.tapeEntriesPair[0];
  }

  toggleTape(): void {
    const currentValue = this.tapeDisplayPair[0].peek();
    this.tapeDisplayPair[1](!currentValue);
  }

  addTapeEntry(operation: string): void {
    const entry: TapeEntry = {
      id: this._nextEntryId++,
      operation,
      timestamp: new Date(),
      historyIndex: this._nextHistoryIndex--,
    };

    const currentEntries = this.tapeEntriesPair[0]();
    this.tapeEntriesPair[1]([...currentEntries, entry].slice(-256));
  }

  clearTape(): void {
    this.tapeEntriesPair[1]([]);
    this._nextEntryId = 1;
    this._nextHistoryIndex = -1;
  }
}
