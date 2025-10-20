/**
 * AppStateStore Tests
 *
 * Tests for the calculator app's global state management
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AppStateStore } from '../store/AppStateStore'

describe('AppStateStore', () => {
  let store: AppStateStore

  beforeEach(() => {
    store = new AppStateStore()
  })

  describe('Tape Display Management', () => {
    it('should initialize with tape display false', () => {
      expect(store.tapeDisplay).toBe(false)
    })

    it('should toggle tape display state', () => {
      expect(store.tapeDisplay).toBe(false)
      
      store.toggleTape()
      expect(store.tapeDisplay).toBe(true)
      
      store.toggleTape()
      expect(store.tapeDisplay).toBe(false)
    })
  })

  describe('Tape Entries Management', () => {
    it('should initialize with empty tape entries', () => {
      expect(store.tapeEntries).toEqual([])
    })

    it('should add tape entries with proper structure', () => {
      store.addTapeEntry('12 + 8 = 20')
      
      const entries = store.tapeEntries
      expect(entries).toHaveLength(1)
      expect(entries[0]).toMatchObject({
        id: 1,
        operation: '12 + 8 = 20',
        historyIndex: -1
      })
      expect(entries[0].timestamp).toBeInstanceOf(Date)
    })

    it('should add multiple tape entries with correct IDs and history indices', () => {
      store.addTapeEntry('5 + 3 = 8')
      store.addTapeEntry('8 × 2 = 16')
      store.addTapeEntry('16 - 4 = 12')
      
      const entries = store.tapeEntries
      expect(entries).toHaveLength(3)
      
      expect(entries[0].id).toBe(1)
      expect(entries[0].historyIndex).toBe(-1)
      expect(entries[0].operation).toBe('5 + 3 = 8')
      
      expect(entries[1].id).toBe(2)
      expect(entries[1].historyIndex).toBe(-2)
      expect(entries[1].operation).toBe('8 × 2 = 16')
      
      expect(entries[2].id).toBe(3)
      expect(entries[2].historyIndex).toBe(-3)
      expect(entries[2].operation).toBe('16 - 4 = 12')
    })

    it('should limit tape entries to 256 maximum', () => {
      // Add 300 entries to test the limit
      for (let i = 1; i <= 300; i++) {
        store.addTapeEntry(`${i} + ${i} = ${i * 2}`)
      }
      
      const entries = store.tapeEntries
      expect(entries).toHaveLength(256)
      
      // Should have the last 256 entries (45-300)
      expect(entries[0].operation).toBe('45 + 45 = 90')
      expect(entries[255].operation).toBe('300 + 300 = 600')
    })

    it('should clear all tape entries', () => {
      store.addTapeEntry('5 + 3 = 8')
      store.addTapeEntry('8 × 2 = 16')
      
      expect(store.tapeEntries).toHaveLength(2)
      
      store.clearTape()
      
      expect(store.tapeEntries).toHaveLength(0)
    })

    it('should reset ID and history index when clearing tape', () => {
      store.addTapeEntry('5 + 3 = 8')
      store.addTapeEntry('8 × 2 = 16')
      
      store.clearTape()
      
      // Add new entry - should start from ID 1 and history index -1 again
      store.addTapeEntry('10 + 5 = 15')
      
      const entries = store.tapeEntries
      expect(entries).toHaveLength(1)
      expect(entries[0].id).toBe(1)
      expect(entries[0].historyIndex).toBe(-1)
    })
  })

  describe('Observable Behavior', () => {
    it('should be an observable object', () => {
      expect(store.notifyChange).toBeDefined()
      expect(typeof store.notifyChange).toBe('function')
    })

    it('should extend ObservableObjectBase', () => {
      expect(store.constructor.name).toBe('AppStateStore')
      // Test that it has the methods from ObservableObjectBase
      expect(store.notifyChange).toBeDefined()
    })
  })
})