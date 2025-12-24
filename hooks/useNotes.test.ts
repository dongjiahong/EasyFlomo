// @vitest-environment jsdom
import { renderHook, waitFor } from '@testing-library/react';
import { useNotes } from './useNotes';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { syncNotes } from '../lib/sync';
import { db } from '../lib/db';
import 'fake-indexeddb/auto';
import React from 'react';

// Mock syncNotes
vi.mock('../lib/sync', () => ({
  syncNotes: vi.fn().mockResolvedValue(undefined)
}));

// Mock db
vi.mock('../lib/db', () => ({
  db: {
    init: vi.fn().mockResolvedValue(undefined),
    cleanupTrash: vi.fn().mockResolvedValue(undefined),
    getAllNotes: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockResolvedValue({
      webdav: { url: 'http://test', username: 'test', password: 'test' },
      ai: { provider: 'openai', url: '', apiKey: '', model: '' }
    }),
    addNote: vi.fn().mockResolvedValue(undefined),
    updateNote: vi.fn().mockResolvedValue(undefined),
  }
}));

describe('useNotes hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset notes in db mock if needed, but here it returns []
    (db.getAllNotes as any).mockResolvedValue([]);
  });

  it('triggers sync after adding a note', async () => {
    const { result } = renderHook(() => useNotes());

    // Wait for initial loading to finish
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Call addNote
    await result.current.addNote('Test note');

    // Expect syncNotes to have been called (it is called inside sync() which is called by addNote)
    // Since sync() is not awaited in addNote, we might need to wait for it.
    await waitFor(() => expect(syncNotes).toHaveBeenCalled());
  });

  it('triggers sync after updating a note', async () => {
    // Mock getAllNotes to return a note so we can update it
    const mockNote = { id: '1', content: 'Initial', timestamp: Date.now() };
    (db.getAllNotes as any).mockResolvedValue([mockNote]);

    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    vi.clearAllMocks();

    // Update note
    await result.current.updateNoteContent('1', 'Updated');

        await waitFor(() => expect(syncNotes).toHaveBeenCalled());

      });

    

      it('triggers sync after freezing a note', async () => {

        const mockNote = { id: '1', content: 'Initial', timestamp: Date.now() };

        (db.getAllNotes as any).mockResolvedValue([mockNote]);

    

        const { result } = renderHook(() => useNotes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

    

        vi.clearAllMocks();

    

        await result.current.freezeExistingNote('1', { mentalRam: '', logicSnapshot: '', state: '' }, 'Optimized');

    

        await waitFor(() => expect(syncNotes).toHaveBeenCalled());

      });

    

      it('triggers sync after unfreezing a note', async () => {

        const mockNote = { id: '1', content: 'Initial', timestamp: Date.now(), isFrozen: true };

        (db.getAllNotes as any).mockResolvedValue([mockNote]);

    

        const { result } = renderHook(() => useNotes());

        await waitFor(() => expect(result.current.isLoading).toBe(false));

    

        vi.clearAllMocks();

    

        await result.current.unfreezeNote('1');

    

        await waitFor(() => expect(syncNotes).toHaveBeenCalled());

      });

    });

    