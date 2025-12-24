// @vitest-environment jsdom
import { render, screen, cleanup } from '@testing-library/react';
import Toast from './Toast';
import { describe, it, expect, afterEach } from 'vitest';
import React from 'react';

describe('Toast Component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders with top-right positioning classes', () => {
    render(<Toast message="Test Message" onClose={() => {}} />);
    const toastElement = screen.getByText('Test Message').parentElement;
    
    expect(toastElement).toBeDefined();
    if (toastElement) {
        const classList = toastElement.className;
        
        // Expecting top-4 (New Requirement)
        // We use string includes because we don't have toHaveClass
        expect(classList).toContain('top-4');
        expect(classList).toContain('right-4');
        
        // Should NOT have bottom-4
        expect(classList).not.toContain('bottom-4');
    }
  });
});