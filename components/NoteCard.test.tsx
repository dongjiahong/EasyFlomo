// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import NoteCard from './NoteCard';
import React from 'react';
import { Note } from '../types';

describe('NoteCard', () => {
    afterEach(() => {
        cleanup();
    });

    const mockNote: Note = {
        id: '1',
        content: 'This is a long note content that should be collapsed in compact mode.',
        createdAt: '2023-01-01',
        timestamp: 1234567890,
        isFrozen: true,
    };

    it('should render in compact mode when isCompact is true', () => {
        // @ts-ignore - Prop not added yet
        render(<NoteCard note={mockNote} isCompact={true} />);
        
        // We expect the content prose div to have a max-height class
        // NoteCard renders content inside a div with class 'prose'
        const contentElement = screen.getByText(mockNote.content);
        const proseElement = contentElement.closest('.prose');
        
        // We verify that some compaction class is applied
        // We'll use 'max-h-[100px]' or similar as our implementation goal
        // For now, let's just check if the class string contains "max-h" or "line-clamp"
        expect(proseElement?.className).toMatch(/max-h-|line-clamp/);
    });

    it('should expand when clicked in compact mode', () => {
        // @ts-ignore - Prop not added yet
        render(<NoteCard note={mockNote} isCompact={true} />);
        
        const contentElement = screen.getByText(mockNote.content);
        
        // Click the card
        fireEvent.click(contentElement);
        
        // Re-query the element as re-render might have replaced it
        const expandedContentElement = screen.getByText(mockNote.content);
        const proseElement = expandedContentElement.closest('.prose');
        
        expect(proseElement).not.toBeNull();
        if(proseElement) {
             expect(proseElement.className).not.toMatch(/max-h-|line-clamp/);
        }
    });

    it('should call onThaw when thaw button is clicked', () => {
        const onThaw = vi.fn();
        const frozenNote = { ...mockNote, isFrozen: true };
        render(<NoteCard note={frozenNote} onThaw={onThaw} />);
        
        // In default view (not compact), thaw button is in header
        // It has title "解冻心流"
        const thawButton = screen.getByTitle('解冻心流');
        fireEvent.click(thawButton);
        
        expect(onThaw).toHaveBeenCalledWith(frozenNote.id);
    });
});
