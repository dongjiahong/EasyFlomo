
import { Note, Asset, AppSettings } from '../types';

const DB_NAME = 'flomo_clone_db';
const DB_VERSION = 3; // Upgraded for synced_assets and schema changes

class FlomoDB {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return Promise.resolve();
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[DB] Init Error', request.error);
        this.initPromise = null;
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Notes Store
        if (!db.objectStoreNames.contains('notes')) {
          const noteStore = db.createObjectStore('notes', { keyPath: 'id' });
          noteStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Assets Store (for Blobs)
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }

        // Settings Store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'id' });
        }

        // Synced Assets Store (Track what has been uploaded to WebDAV)
        if (!db.objectStoreNames.contains('synced_assets')) {
          db.createObjectStore('synced_assets', { keyPath: 'id' });
        }
      };
    });

    return this.initPromise;
  }

  // --- Notes Operations ---

  async addNote(note: Note): Promise<void> {
    await this.ensureInit();
    const noteWithMeta = {
        ...note,
        updatedAt: Date.now(), // Set initial update time
        isDeleted: false
    };
    await this.tx('notes', 'readwrite', (store) => store.put(noteWithMeta));
  }

  async updateNote(note: Note): Promise<void> {
    await this.ensureInit();
    // Use the provided updatedAt if synced, otherwise update it
    const updatedNote = {
        ...note,
        updatedAt: note.updatedAt || Date.now()
    };
    await this.tx('notes', 'readwrite', (store) => store.put(updatedNote));
  }

  // Tombstone deletion
  async softDeleteNote(id: string): Promise<void> {
    await this.ensureInit();
    const note = await this.getNote(id);
    if (note) {
        note.isDeleted = true;
        note.deletedAt = Date.now();
        note.updatedAt = Date.now(); // Mark as updated so it syncs
        await this.tx('notes', 'readwrite', (store) => store.put(note));
    }
  }

  async hardDeleteNote(id: string): Promise<void> {
    await this.ensureInit();
    await this.tx('notes', 'readwrite', (store) => store.delete(id));
  }

  async getNote(id: string): Promise<Note | undefined> {
    await this.ensureInit();
    return this.tx('notes', 'readonly', (store) => store.get(id));
  }

  async getAllNotes(): Promise<Note[]> {
    await this.ensureInit();
    return this.tx('notes', 'readonly', (store) => store.getAll());
  }

  // Clean up items deleted more than 30 days ago
  async cleanupTrash(): Promise<void> {
    await this.ensureInit();
    const notes = await this.getAllNotes();
    const now = Date.now();
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

    for (const note of notes) {
        if (note.isDeleted && note.deletedAt && (now - note.deletedAt > THIRTY_DAYS)) {
            await this.hardDeleteNote(note.id);
        }
    }
  }

  // --- Assets Operations ---

  async addAsset(blob: Blob): Promise<string> {
    await this.ensureInit();
    const id = crypto.randomUUID();
    const asset: Asset = {
      id,
      blob,
      mimeType: blob.type,
      createdAt: Date.now()
    };
    await this.tx('assets', 'readwrite', (store) => store.put(asset));
    return id;
  }

  // Save an asset with a specific ID (from Sync)
  async saveSyncedAsset(id: string, blob: Blob): Promise<void> {
    await this.ensureInit();
    const asset: Asset = {
        id,
        blob,
        mimeType: blob.type,
        createdAt: Date.now()
    };
    await this.tx('assets', 'readwrite', (store) => store.put(asset));
    // Also mark as synced since it came from the server
    await this.markAssetSynced(id);
  }

  async getAsset(id: string): Promise<Asset | undefined> {
    await this.ensureInit();
    const result = await this.tx<Asset>('assets', 'readonly', (store) => store.get(id));
    return result;
  }

  // --- Sync State for Assets ---
  
  async markAssetSynced(id: string): Promise<void> {
    await this.ensureInit();
    await this.tx('synced_assets', 'readwrite', (store) => store.put({ id }));
  }

  async isAssetSynced(id: string): Promise<boolean> {
    await this.ensureInit();
    const result = await this.tx('synced_assets', 'readonly', (store) => store.get(id));
    return !!result;
  }

  // --- Settings Operations ---

  async saveSettings(settings: AppSettings): Promise<void> {
    await this.ensureInit();
    await this.tx('settings', 'readwrite', (store) => store.put(settings));
  }

  async getSettings(): Promise<AppSettings | undefined> {
    await this.ensureInit();
    return this.tx('settings', 'readonly', (store) => store.get('user_settings'));
  }

  // --- Helpers ---

  private async ensureInit() {
    if (!this.db) await this.init();
  }

  private tx<T>(
    storeName: string, 
    mode: IDBTransactionMode, 
    callback: (store: IDBObjectStore) => IDBRequest<T>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not initialized');
      const transaction = this.db.transaction(storeName, mode);
      const store = transaction.objectStore(storeName);
      const request = callback(store);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

export const db = new FlomoDB();
