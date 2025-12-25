// @vitest-environment jsdom
import { renderHook, waitFor, act } from '@testing-library/react';
import { useNotes } from './useNotes';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock db
let mockSettingsStore = {
  webdav: { url: 'http://test', username: 'test', password: 'test' },
  ai: { 
    provider: 'openai', 
    openai: {
        url: 'https://api.openai.com/v1', 
        apiKey: 'sk-test', 
        model: 'gpt-4o'
    },
    gemini: {
        apiKey: 'gemini-key',
        model: 'gemini-3-flash-preview'
    }
  }
};

vi.mock('../lib/db', () => ({
  db: {
    init: vi.fn().mockResolvedValue(undefined),
    cleanupTrash: vi.fn().mockResolvedValue(undefined),
    getAllNotes: vi.fn().mockResolvedValue([]),
    getSettings: vi.fn().mockImplementation(() => Promise.resolve(mockSettingsStore)),
    addNote: vi.fn().mockResolvedValue(undefined),
    updateNote: vi.fn().mockResolvedValue(undefined),
    saveSettings: vi.fn().mockImplementation((newSettings) => {
        mockSettingsStore = { ...mockSettingsStore, ...newSettings }; 
        return Promise.resolve();
    })
  }
}));

// Mock syncNotes
vi.mock('../lib/sync', () => ({
  syncNotes: vi.fn().mockResolvedValue(undefined)
}));

describe('useNotes AI Configuration', () => {
  const globalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ choices: [{ message: { content: 'AI Response' } }] }),
        ok: true
    });
  });

  afterEach(() => {
    global.fetch = globalFetch;
  });

  it('uses configured OpenAI URL and Model', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 1. Update Settings to custom values
    await act(async () => {
        await result.current.updateSettings({
            ...result.current.settings,
            ai: {
                ...result.current.settings.ai,
                provider: 'openai' as const,
                openai: {
                    url: 'https://custom-api.com/v1',
                    model: 'custom-model-v1',
                    apiKey: 'sk-custom'
                }
            }
        });
    });

    // 2. Call generateAIResponse
    await act(async () => {
        await result.current.generateAIResponse('Test Prompt');
    });

    // 3. Verify fetch was called with correct URL and Body
    expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-api.com/v1/chat/completions',
        expect.objectContaining({
            body: expect.stringContaining('"model":"custom-model-v1"'),
            headers: expect.objectContaining({
                'Authorization': 'Bearer sk-custom'
            })
        })
    );
  });

  it('correctly handles switching between providers', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 1. Switch to Gemini
    await act(async () => {
        await result.current.updateSettings({
            ...result.current.settings,
            ai: { ...result.current.settings.ai, provider: 'gemini' }
        });
    });

    // 2. Switch back to OpenAI with custom config
    await act(async () => {
        await result.current.updateSettings({
            ...result.current.settings,
            ai: { 
                ...result.current.settings.ai, 
                provider: 'openai', 
                openai: {
                    url: 'https://custom-openai.com/v1', 
                    model: 'custom-gpt',
                    apiKey: 'openai-key'
                }
            }
        });
    });

    // 3. Call generateAIResponse
    await act(async () => {
        await result.current.generateAIResponse('Test Prompt');
    });

    // 4. Verify fetch uses OpenAI config
    expect(global.fetch).toHaveBeenCalledWith(
        'https://custom-openai.com/v1/chat/completions',
        expect.objectContaining({
            body: expect.stringContaining('"model":"custom-gpt"')
        })
    );
  });

  it('uses configured Gemini Model', async () => {
    const { result } = renderHook(() => useNotes());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 1. Update Settings to custom Gemini model
    await act(async () => {
        await result.current.updateSettings({
            ...result.current.settings,
            ai: {
                ...result.current.settings.ai,
                provider: 'gemini',
                gemini: {
                    model: 'gemini-1.5-pro',
                    apiKey: 'gemini-key'
                }
            }
        });
    });

    // 2. Call generateAIResponse
    await act(async () => {
        await result.current.generateAIResponse('Test Prompt');
    });

    // 3. Verify fetch was called with correct URL containing the model
    expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/models/gemini-1.5-pro:generateContent'),
        expect.any(Object)
    );
  });
});