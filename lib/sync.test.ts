
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { syncNotes } from './sync';
import { db } from './db';
import { WebDAVClient } from './webdav';

// Mock dependencies
vi.mock('./db', () => ({
  db: {
    getDeletionQueue: vi.fn(),
    removeFromDeletionQueue: vi.fn(),
    getAllNotes: vi.fn(),
    updateNote: vi.fn(),
    isAssetSynced: vi.fn(),
    getAsset: vi.fn(),
    saveSyncedAsset: vi.fn(),
    markAssetSynced: vi.fn(),
  },
}));

vi.mock('./webdav', () => {
  const WebDAVClientMock = vi.fn();
  WebDAVClientMock.prototype.exists = vi.fn().mockResolvedValue(true);
  WebDAVClientMock.prototype.mkcol = vi.fn().mockResolvedValue(undefined);
  WebDAVClientMock.prototype.delete = vi.fn().mockResolvedValue(undefined);
  WebDAVClientMock.prototype.listFiles = vi.fn().mockResolvedValue([]);
  WebDAVClientMock.prototype.get = vi.fn().mockResolvedValue('[]');
  WebDAVClientMock.prototype.put = vi.fn().mockResolvedValue(undefined);
  WebDAVClientMock.prototype.getBlob = vi.fn().mockResolvedValue(new Blob([]));
  
  return {
    WebDAVClient: WebDAVClientMock,
  };
});

describe('syncNotes', () => {
  const mockConfig = {
    url: 'https://dav.example.com',
    username: 'user',
    password: 'pass',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (db.getDeletionQueue as any).mockResolvedValue([]);
    (db.getAllNotes as any).mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle authentication errors gracefully', async () => {
    // Override the prototype method for this test
    const existsMock = vi.fn().mockRejectedValue(new Error('WebDAV Authentication Failed'));
    WebDAVClient.prototype.exists = existsMock;

    const onProgress = vi.fn();
    
    await expect(syncNotes(mockConfig, onProgress)).rejects.toThrow('WebDAV Authentication Failed');
  });

  it('should continue sync if one week fails to download', async () => {
     (db.getAllNotes as any).mockResolvedValue([
         { id: '1', content: 'note1', timestamp: Date.now() }
     ]);
     
     // Mock listFiles to return 2 files
     WebDAVClient.prototype.exists = vi.fn().mockResolvedValue(true);
     WebDAVClient.prototype.listFiles = vi.fn().mockResolvedValue([
         { name: '2023-W01.json' },
         { name: '2023-W02.json' }
     ]);
     
     // Mock get to fail once then succeed
     const mockGet = vi.fn()
        .mockRejectedValueOnce(new Error('Failed to download file')) // Fail first
        .mockResolvedValueOnce('[]'); // Succeed second
        
     WebDAVClient.prototype.get = mockGet;

     await syncNotes(mockConfig);
     
     expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('should fail if listFiles fails', async () => {
    WebDAVClient.prototype.listFiles = vi.fn().mockRejectedValue(new Error('Network Error'));
    const onProgress = vi.fn();
    
    await expect(syncNotes(mockConfig, onProgress)).rejects.toThrow('Network Error');
  });
});
