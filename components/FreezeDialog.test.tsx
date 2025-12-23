// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import FreezeDialog from './FreezeDialog';
import React from 'react';
import { FlowSnapshot } from '../types';

describe('FreezeDialog', () => {
  it('should render inputs when open', () => {
    const onSave = async (snapshot: FlowSnapshot, ai?: string) => {};
    const onClose = () => {};
    const onAnalyze = async (snapshot: FlowSnapshot, context?: string) => null;
    const onOptimize = async (snapshot: FlowSnapshot, context?: string) => "";
    
    render(<FreezeDialog 
        isOpen={true} 
        onSave={onSave} 
        onClose={onClose} 
        onAnalyze={onAnalyze} 
        onOptimize={onOptimize} 
    />);
    
    expect(screen.getByText(/思维内存/i)).toBeDefined();
  });

  it('should render "Next Step Plan" label instead of "Current Status"', () => {
    const onSave = async (snapshot: FlowSnapshot, ai?: string) => {};
    const onClose = () => {};
    const onAnalyze = async (snapshot: FlowSnapshot, context?: string) => null;
    const onOptimize = async (snapshot: FlowSnapshot, context?: string) => "";
    
    render(<FreezeDialog 
        isOpen={true} 
        onSave={onSave} 
        onClose={onClose} 
        onAnalyze={onAnalyze} 
        onOptimize={onOptimize} 
    />);
    
    const elements = screen.getAllByText(/下一步计划 \(Next Step Plan\)/i);
    expect(elements.length).toBeGreaterThan(0);
  });
});