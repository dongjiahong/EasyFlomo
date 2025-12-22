
/** @vitest-environment jsdom */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import NoteInput from './NoteInput';
import React from 'react';

describe('NoteInput - Commands', () => {
  it('should trigger onFreeze when content is /freeze and submitted', async () => {
    const onAddNote = vi.fn();
    const onUploadAsset = vi.fn();
    const onFreeze = vi.fn();
    
    render(<NoteInput onAddNote={onAddNote} onUploadAsset={onUploadAsset} onFreeze={onFreeze} />);
    
    const textarea = screen.getByPlaceholderText(/现在的想法是/i);
    fireEvent.change(textarea, { target: { value: '/freeze' } });
    
    // Click send button
    const sendButton = screen.getByTitle(/标签 #/i).parentElement?.parentElement?.querySelector('button:last-child') as HTMLButtonElement;
    // Better way to find send button: it has Send icon. 
    // In my previous read, it's the only button with Send icon or isSubmitting state.
    
    fireEvent.click(sendButton);
    
    expect(onFreeze).toHaveBeenCalled();
    expect(onAddNote).not.toHaveBeenCalled();
  });
});
