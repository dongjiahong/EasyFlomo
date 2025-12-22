
import { db } from './db';
import { Note } from '../types';
import { describe, it, expect, beforeEach } from 'vitest';

// Mock IndexedDB
import 'fake-indexeddb/auto';

describe('FlomoDB - Cryopod', () => {
  const frozenNote: Note = {
    id: 'frozen-1',
    content: 'Frozen content',
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    isFrozen: true,
    flowSnapshot: {
      mentalRam: 'Test RAM',
      logicSnapshot: 'Test Logic',
      state: 'Test State'
    }
  };

  const normalNote: Note = {
    id: 'normal-1',
    content: 'Normal content',
    createdAt: new Date().toISOString(),
    timestamp: Date.now(),
    isFrozen: false
  };

  beforeEach(async () => {
    // Reset DB state if possible, or just use unique IDs
    // Since db is a singleton and tests run in parallel or sequence, 
    // we might need to be careful. But unit tests usually run in fresh environment or we can mock.
    // 'fake-indexeddb/auto' mocks the global object.
    // But db.initPromise might persist.
    // We'll just try to add notes.
  });

  it('should store and retrieve flowSnapshot data', async () => {
    await db.addNote(frozenNote);
    const retrieved = await db.getNote(frozenNote.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.isFrozen).toBe(true);
    expect(retrieved?.flowSnapshot).toEqual(frozenNote.flowSnapshot);
  });

  it('should retrieve only frozen notes using getFrozenNotes', async () => {
    await db.addNote(frozenNote);
    await db.addNote(normalNote);

    const frozenNotes = await db.getFrozenNotes();
    
    expect(frozenNotes.length).toBeGreaterThanOrEqual(1);
    const found = frozenNotes.find((n: Note) => n.id === frozenNote.id);
    expect(found).toBeDefined();
    
    // Ensure normal note is NOT in the list (or at least filter works)
    const foundNormal = frozenNotes.find((n: Note) => n.id === normalNote.id);
    expect(foundNormal).toBeUndefined();
  });
});
