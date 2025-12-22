
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebDAVClient } from './webdav';

// Mock global fetch
const globalFetch = vi.fn();
global.fetch = globalFetch;

// Mock DOMParser for listFiles
global.DOMParser = class {
  parseFromString() {
    return {
      querySelectorAll: () => [],
    };
  }
} as any;

describe('WebDAVClient', () => {
  let client: WebDAVClient;

  beforeEach(() => {
    client = new WebDAVClient({
      url: 'https://dav.example.com',
      username: 'user',
      password: 'pass',
    });
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should retry failed requests on network error', async () => {
    // Mock fetch to fail twice then succeed
    globalFetch
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockRejectedValueOnce(new Error('Network Error'))
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('success'),
        status: 200,
      });

    await client.get('test.txt');

    expect(globalFetch).toHaveBeenCalledTimes(3);
  });

  it('should retry on 5xx server errors', async () => {
    // Mock fetch to return 500 then 200
    globalFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('success'),
        status: 200,
      });

    await client.get('test.txt');

    expect(globalFetch).toHaveBeenCalledTimes(2);
  });

  it('should NOT retry on 4xx client errors (except 429 usually, but lets stick to basic)', async () => {
    // Mock fetch to return 404
    globalFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    try {
      await client.get('test.txt');
    } catch (e) {
      // Expected
    }

    expect(globalFetch).toHaveBeenCalledTimes(1);
  });
});
