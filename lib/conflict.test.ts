
import { describe, it, expect } from 'vitest';
import { resolveConflict } from './sync';
import { Note } from '../types';

describe('resolveConflict', () => {
  const baseNote: Note = {
    id: 'note-1',
    content: 'Original content',
    createdAt: '2025-01-01T00:00:00Z',
    timestamp: 1000,
    updatedAt: 1000,
  };

  it('should return local note if local is newer', () => {
    const local: Note = { ...baseNote, content: 'local', updatedAt: 2000 };
    const remote: Note = { ...baseNote, content: 'remote', updatedAt: 1500 };
    
    const result = resolveConflict(local, remote);
    expect(result).toEqual(local);
  });

  it('should return remote note if remote is newer', () => {
    const local: Note = { ...baseNote, content: 'local', updatedAt: 1500 };
    const remote: Note = { ...baseNote, content: 'remote', updatedAt: 2000 };
    
    const result = resolveConflict(local, remote);
    expect(result).toEqual(remote);
  });

  it('should return local note if timestamps are equal (default)', () => {
    const local: Note = { ...baseNote, content: 'local', updatedAt: 2000 };
    const remote: Note = { ...baseNote, content: 'remote', updatedAt: 2000 };
    
    const result = resolveConflict(local, remote);
    expect(result).toEqual(local);
  });

  it('should handle missing updatedAt (treat as 0)', () => {
    const local: Note = { ...baseNote, content: 'local', updatedAt: undefined };
    const remote: Note = { ...baseNote, content: 'remote', updatedAt: 100 };
    
    const result = resolveConflict(local, remote);
    expect(result).toEqual(remote);
  });
});
