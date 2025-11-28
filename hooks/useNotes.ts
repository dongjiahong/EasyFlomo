
import { useState, useEffect, useCallback } from 'react';
import { Note, UserStats, TagNode, AppSettings } from '../types';
import { db } from '../lib/db';
import { syncNotes } from '../lib/sync';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'user_settings',
  ai: {
    provider: 'openai',
    url: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o'
  },
  webdav: {
    url: window.location.origin + '/webdav-proxy',
    username: '',
    password: ''
  }
};

export function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [stats, setStats] = useState<UserStats>({ noteCount: 0, tagCount: 0, dayCount: 0 });
  const [tags, setTags] = useState<TagNode[]>([]);
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      // Load Notes
      const allNotes = await db.getAllNotes();
      
      // Filter out deleted notes (Tombstones)
      const visibleNotes = allNotes.filter(n => !n.isDeleted);

      // 按时间倒序
      visibleNotes.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotes(visibleNotes);
      calculateStatsAndTags(visibleNotes);

      // Load Settings
      const savedSettings = await db.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('[useNotes] Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始化 DB 和清理垃圾
  useEffect(() => {
    db.init().then(async () => {
        // Auto-cleanup old deleted notes on startup
        await db.cleanupTrash();
        await loadData();
    });
  }, [loadData]);

  // 计算统计信息、热力图数据和提取分级标签
  const calculateStatsAndTags = (currentNotes: Note[]) => {
    const uniqueDays = new Set<string>();
    const activityMap = new Map<string, number>();
    const tagCounts = new Map<string, number>();

    currentNotes.forEach(note => {
      const dateObj = new Date(note.timestamp);
      const dateStr = dateObj.toLocaleDateString('en-CA'); 
      
      uniqueDays.add(dateStr);
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);

      const tagMatches = note.content.match(/#([\w\u4e00-\u9fa5]+(?:\/[\w\u4e00-\u9fa5]+)*)/g);
      if (tagMatches) {
        tagMatches.forEach(fullTag => {
          const tagName = fullTag.substring(1); 
          tagCounts.set(tagName, (tagCounts.get(tagName) || 0) + 1);
        });
      }
    });

    setHeatmapData(activityMap);

    const rootNodes: TagNode[] = [];
    const nodeMap = new Map<string, TagNode>();
    const sortedTags = Array.from(tagCounts.keys()).sort();

    sortedTags.forEach(fullPath => {
      const parts = fullPath.split('/');
      let currentPath = '';
      let parentNode: TagNode | undefined = undefined;

      parts.forEach((part, index) => {
        const isLast = index === parts.length - 1;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        let node = nodeMap.get(currentPath);
        
        if (!node) {
          node = {
            id: `tag-${currentPath}`,
            name: part,
            fullPath: currentPath,
            count: 0,
            children: [],
            isPinned: false
          };
          nodeMap.set(currentPath, node);
          
          if (parentNode) {
            if (!parentNode.children.find(c => c.fullPath === node!.fullPath)) {
               parentNode.children.push(node);
            }
          } else {
             if (!rootNodes.find(n => n.fullPath === node!.fullPath)) {
                rootNodes.push(node);
             }
          }
        }

        if (isLast) {
          node.count = tagCounts.get(fullPath) || 0;
        }

        parentNode = node;
      });
    });

    let dayCount = 0;
    if (currentNotes.length > 0) {
       const firstNoteTime = currentNotes[currentNotes.length - 1].timestamp;
       const now = Date.now();
       dayCount = Math.floor((now - firstNoteTime) / (1000 * 60 * 60 * 24)) + 1;
    }

    setStats({
      noteCount: currentNotes.length,
      tagCount: tagCounts.size,
      dayCount: dayCount || 1
    });

    setTags(rootNodes);
  };

  const addNote = async (content: string, assetIds: string[] = []) => {
    const now = new Date();
    const newNote: Note = {
      id: crypto.randomUUID(),
      content,
      assetIds,
      timestamp: now.getTime(),
      createdAt: now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      updatedAt: now.getTime(),
      isDeleted: false
    };
    
    await db.addNote(newNote);
    await loadData();
  };

  const updateNoteContent = async (id: string, newContent: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const updatedNote = {
      ...note,
      content: newContent,
      updatedAt: Date.now()
    };
    
    await db.updateNote(updatedNote);
    await loadData();
  };

  const deleteNote = async (id: string) => {
    await db.softDeleteNote(id);
    await loadData();
  };

  const clearTrash = async () => {
    await db.deleteAllTrash();
    await loadData();
  };

  const uploadAsset = async (file: File): Promise<string> => {
    return await db.addAsset(file);
  };

  const updateSettings = async (newSettings: AppSettings) => {
    await db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const sync = async () => {
    await syncNotes(settings.webdav, (msg) => {
        // We could expose this state if we want a progress bar
        console.log('[Sync Progress]', msg);
    });
    await loadData();
  };

  // --- Helpers for Views ---

  const getTodayNotes = () => {
    const today = new Date();
    const todayStr = today.toLocaleDateString('en-CA');

    return notes.filter(note => {
      const d = new Date(note.timestamp);
      const noteDateStr = d.toLocaleDateString('en-CA');
      return todayStr === noteDateStr;
    });
  };

  const getRandomNotes = (count = 5) => {
    if (notes.length <= count) return notes;
    const shuffled = [...notes].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const generateAIResponse = async (prompt: string): Promise<string> => {
    if (!settings.ai.apiKey) return "请先在设置中配置 API Key。";

    try {
      if (settings.ai.provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.ai.apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message || data.error.status);
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini 没有返回内容";
      } else {
        const url = `${settings.ai.url.replace(/\/$/, '')}/chat/completions`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.ai.apiKey}`
          },
          body: JSON.stringify({
            model: settings.ai.model || 'gpt-4o',
            messages: [
              { role: "system", content: "你是一个善于思考和总结的助手。" },
              { role: "user", content: prompt }
            ]
          })
        });
        const data = await response.json();
        if (data.error) throw new Error(data.error.message);
        return data.choices?.[0]?.message?.content || "AI 没有返回内容";
      }
    } catch (e: any) {
      console.error("AI Generation Error", e);
      return `生成失败: ${e.message}`;
    }
  };

  return {
    notes,
    stats,
    tags,
    heatmapData,
    settings,
    isLoading,
    addNote,
    updateNoteContent,
    deleteNote,
    clearTrash,
    uploadAsset,
    updateSettings,
    getTodayNotes,
    getRandomNotes,
    generateAIResponse,
    refresh: sync
  };
}
