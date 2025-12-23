// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import CryopodDashboard from './CryopodDashboard';
import React from 'react';
import { Note } from '../types';

describe('CryopodDashboard', () => {
    afterEach(cleanup);

    it('should render list of frozen notes', () => {
        const notes: Note[] = [
            { id: '1', content: 'Note 1', isFrozen: true, createdAt: '', timestamp: 0 },
            { id: '2', content: 'Note 2', isFrozen: true, createdAt: '', timestamp: 0 }
        ];
        const onThaw = vi.fn();

        // @ts-ignore - Prop mismatch until implementation update
        render(<CryopodDashboard frozenNotes={notes} onThaw={onThaw} />);

        expect(screen.getByText(/Note 1/)).toBeDefined();
        expect(screen.getByText(/Note 2/)).toBeDefined();
        expect(screen.getByText(/心流冷冻舱 \(2\)/)).toBeDefined();
    });
});
