
export interface Note {
  id: string;
  content: string; // Markdown content
  createdAt: string; // ISO String
  timestamp: number; // For sorting
  tags?: string[];
  // 存储关联的资源ID，方便删除笔记时清理资源
  assetIds?: string[];
  
  // Sync & Delete fields
  updatedAt?: number; // Timestamp for conflict resolution
  isDeleted?: boolean; // Soft delete flag (Tombstone)
  deletedAt?: number; // When it was deleted
}

export interface UserStats {
  noteCount: number;
  tagCount: number;
  dayCount: number;
}

export interface Tag {
  id: string;
  name: string;
  isPinned?: boolean;
  count?: number;
}

export interface TagNode {
  id: string;
  name: string;
  fullPath: string; // "parent/child"
  count: number;
  children: TagNode[];
  isPinned?: boolean;
}

export interface Asset {
  id: string;
  blob: Blob;
  mimeType: string;
  createdAt: number;
}

export interface AIConfig {
  provider: 'gemini' | 'openai';
  url: string;
  apiKey: string;
  model: string;
  dailyPrompt?: string; // Custom prompt for daily review
  insightPrompt?: string; // Custom prompt for insights
}

export interface WebDAVConfig {
  url: string;
  username: string;
  password?: string;
}

export interface AppSettings {
  id: 'user_settings';
  ai: AIConfig;
  webdav: WebDAVConfig;
}
