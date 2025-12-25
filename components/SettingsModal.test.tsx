// @vitest-environment jsdom
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsModal from './SettingsModal';
import { describe, it, expect, vi } from 'vitest';
import { AppSettings } from '../types';
import React from 'react';

const mockSettings: AppSettings = {
  id: 'user_settings',
  ai: {
    provider: 'gemini',
    openai: { url: '', apiKey: '', model: '' },
    gemini: { apiKey: 'gemini-key', model: 'gemini-3-flash-preview' },
    dailyPrompt: '',
    insightPrompt: ''
  },
  webdav: { url: '', username: '', password: '' }
};

describe('SettingsModal', () => {
  it('renders Gemini Model input field when provider is gemini', () => {
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={vi.fn()} 
        settings={mockSettings} 
        onSave={vi.fn()} 
      />
    );
    
    expect(screen.getByLabelText(/Gemini Model/i)).toBeDefined();
  });

  it('allows changing Gemini model and saves the value', async () => {
    const onSave = vi.fn().mockImplementation(() => Promise.resolve());
    render(
      <SettingsModal 
        isOpen={true} 
        onClose={vi.fn()} 
        settings={mockSettings} 
        onSave={onSave} 
      />
    );

    const modelInput = screen.getByLabelText(/Gemini Model/i);
    fireEvent.change(modelInput, { target: { value: 'gemini-1.5-pro' } });

    const saveButton = screen.getAllByRole('button', { name: /保存/i })[0];
    
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    }, { timeout: 2000 });

    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      ai: expect.objectContaining({
        provider: 'gemini',
        gemini: expect.objectContaining({
          model: 'gemini-1.5-pro'
        })
      })
    }));
  });
});
