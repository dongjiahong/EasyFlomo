
import { useState, useEffect, useCallback } from 'react';
import { Note, UserStats, TagNode, AppSettings, FlowSnapshot } from '../types';
import { db } from '../lib/db';
import { syncNotes } from '../lib/sync';

const DEFAULT_SETTINGS: AppSettings = {
  id: 'user_settings',
  ai: {
    provider: 'openai',
    url: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
    dailyPrompt: '请阅读我今天记录的以下笔记，并为我生成一份每日总结。\n总结今天的主要想法、活动或情绪，并提出任何值得进一步思考的点。\n',
    insightPrompt: '随机抽取了我最近的 10 条笔记，请阅读并帮我进行回顾。\n请根据这些内容，给出一个简短的洞察、总结，或者发现它们之间潜在的联系。\n风格保持轻松、启发性。'
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
  const [allTagNames, setAllTagNames] = useState<string[]>([]);
  const [heatmapData, setHeatmapData] = useState<Map<string, number>>(new Map());
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [trashedNotes, setTrashedNotes] = useState<Note[]>([]); // Store actual trashed notes

  // 加载数据
  const loadData = useCallback(async () => {
    try {
      // Load Notes
      const allNotes = await db.getAllNotes();
      
      // Filter out deleted notes (Tombstones)
      const visibleNotes = allNotes.filter(n => !n.isDeleted);
      const deletedNotes = allNotes.filter(n => n.isDeleted);
      
      // Sort trashed notes by deletedAt (most recent first) or timestamp
      deletedNotes.sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
      setTrashedNotes(deletedNotes);

      // 按时间倒序
      visibleNotes.sort((a, b) => b.timestamp - a.timestamp);
      
      setNotes(visibleNotes);
      calculateStatsAndTags(visibleNotes);

      // Load Settings
      const savedSettings = await db.getSettings();
      if (savedSettings) {
        setSettings({
            ...DEFAULT_SETTINGS,
            ...savedSettings,
            ai: { ...DEFAULT_SETTINGS.ai, ...savedSettings.ai } // Ensure new fields exist
        });
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
    setAllTagNames(Array.from(tagCounts.keys()).sort());

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

  const freezeExistingNote = async (id: string, snapshot: FlowSnapshot, aiOptimizedContent: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const newContent = `${note.content}\n\n---\n\n${aiOptimizedContent}`;
    
    const updatedNote: Note = {
      ...note,
      content: newContent,
      isFrozen: true,
      flowSnapshot: snapshot,
      updatedAt: Date.now()
    };
    
    await db.updateNote(updatedNote);
    await loadData();
  };

  const addFrozenNote = async (snapshot: FlowSnapshot, aiOptimizedContent?: string) => {
    const now = new Date();
    
    // Fallback content format if AI is not used or fails
    const fallbackContent = `❄️ **心流冷冻存档**\n\n### 🧠 思维内存\n${snapshot.mentalRam || '无'}\n\n### ⚡ 逻辑快照\n${snapshot.logicSnapshot || '无'}\n\n### 🎭 当前状态\n${snapshot.state || '无'}\n\n#心流冷冻`;

    const newNote: Note = {
      id: crypto.randomUUID(),
      content: aiOptimizedContent || fallbackContent,
      assetIds: [],
      timestamp: now.getTime(),
      createdAt: now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      updatedAt: now.getTime(),
      isDeleted: false,
      isFrozen: true,
      flowSnapshot: snapshot
    };
    
    await db.addNote(newNote);
    await loadData();
  };

  const unfreezeNote = async (id: string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    
    const updatedNote = {
      ...note,
      isFrozen: false,
      updatedAt: Date.now()
    };
    
    await db.updateNote(updatedNote);
    await loadData();
  };

  const generateResumeBriefing = async (note: Note): Promise<string> => {
    if (!note.flowSnapshot) return "欢迎回来，继续你的心流。";
    
    const prompt = `
你是一个“脑镜像同步助手”。用户刚刚从中断中返回，请根据他上次离开时留下的“心流冷冻快照”，生成一句精炼、硬核、且具有“脑镜像同步”感的欢迎语，帮助他瞬间找回状态。

快照内容：
- 思维内存: ${note.flowSnapshot.mentalRam}
- 逻辑快照: ${note.flowSnapshot.logicSnapshot}
- 当时状态: ${note.flowSnapshot.state}

要求：
1. 极其简练（不超过 60 字）。
2. 采用类似“同步中... 镜像已就绪”或“你上次卡在 X，现在继续吗？”的语气。
3. 重点突出“你上次在哪里”和“为什么”。
4. 不要废话。
`;
    return await generateAIResponse(prompt);
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

  const restoreNote = async (id: string) => {
    await db.restoreNote(id);
    await loadData();
  };

  const permanentlyDeleteNote = async (id: string) => {
    await db.hardDeleteNote(id);
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

  const generateFlowSnapshotContent = async (snapshot: FlowSnapshot, context?: string): Promise<string> => {
    const prompt = `
你是一个硬核、客观、去情感化的“心流状态记录员”。你的任务是将用户的碎片化输入整理成一份日后能精准还原逻辑的“现场存档”。

${context ? `背景信息（原笔记内容）：\n${context}\n` : ''}

输入内容：
- 思维内存 (Mental RAM): ${snapshot.mentalRam}
- 逻辑快照 (Logic Snapshot): ${snapshot.logicSnapshot}
- 当前状态 (State): ${snapshot.state}

请按照以下要求输出：
1. 保持客观、冷峻、手术刀般的语调。
2. 逻辑严密，重点突出。
3. 输出格式为 Markdown，包含三个固定标题：🧠 思维内存、⚡ 逻辑快照、🎭 状态追踪。
4. 如果输入太短，请根据语境进行合理的硬核补充，但不要捏造事实。
5. 结尾加上 #心流冷冻 标签。

输出示例：
🧠 思维内存
- 当前卡在 WebDAV 同步冲突处理逻辑。
- 待验证：ETag 是否在所有服务器上一致。

⚡ 逻辑快照
- 暂时采用“本地优先”策略，因为用户手动保存动作具有更高的意图权重。

🎭 状态追踪
- 能量中等，思维略有发散，需断点保护。

#心流冷冻
`;
    return await generateAIResponse(prompt);
  };

  const analyzeFlowSnapshot = async (snapshot: FlowSnapshot, context?: string): Promise<string | null> => {
    // Logic for deep questioning
    if (!snapshot.mentalRam || !snapshot.logicSnapshot) return null;
    
    // If input is too short (e.g. less than 10 chars), ask for more context
    if (snapshot.mentalRam.length < 10 || snapshot.logicSnapshot.length < 10) {
        const prompt = `
你是一个引导员。用户正在尝试冷冻心流，但输入的内容过于模糊。
${context ? `背景信息（原笔记内容）：\n${context}\n` : ''}
思维内存: ${snapshot.mentalRam}
逻辑快照: ${snapshot.logicSnapshot}

请根据这些模糊的信息（结合背景），提出一个具体的“深度追问”，强迫用户闭环逻辑。只需返回问题本身，不要有其他废话。
例如：如果你说“代码报错”，我会追问“具体的错误码是什么，以及你怀疑的第一个嫌疑点在哪里？”
`;
        return await generateAIResponse(prompt);
    }
    return null;
  };

  return {
    notes,
    stats,
    tags,
    allTagNames, // Exported for autocomplete
    heatmapData,
    settings,
    isLoading,
    trashedNotes,
    addNote,
    addFrozenNote,
    freezeExistingNote,
    unfreezeNote,
    updateNoteContent,
    deleteNote,
    restoreNote,
    permanentlyDeleteNote,
    clearTrash,
    uploadAsset,
    updateSettings,
    getTodayNotes,
    getRandomNotes,
    generateAIResponse,
    generateFlowSnapshotContent,
    analyzeFlowSnapshot,
    generateResumeBriefing,
    refresh: sync
  };
}
