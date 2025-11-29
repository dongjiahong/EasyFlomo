
import React, { useState, useEffect } from 'react';
import { Menu, Search, Filter, Loader2, Dices, X } from 'lucide-react';
import Sidebar from './components/Sidebar';
import NoteInput from './components/NoteInput';
import NoteCard from './components/NoteCard';
import SettingsModal from './components/SettingsModal';
import AIPanel from './components/AIPanel';
import { useNotes } from './hooks/useNotes';
import { Note } from './types';

interface AIPanelState {
  type: 'summary' | 'insight' | null;
  isOpen: boolean;
  content: string;
  loading: boolean;
}

function App() {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [activeView, setActiveView] = useState<'all' | 'random'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearchBar, setShowMobileSearchBar] = useState(false);
  
  // AI Panel State
  const [aiPanel, setAiPanel] = useState<AIPanelState>({
    type: null,
    isOpen: false,
    content: '',
    loading: false
  });

  const [displayNotes, setDisplayNotes] = useState<Note[]>([]);

  // Use custom hook for data management
  const { 
    notes, 
    stats, 
    tags, 
    allTagNames, // For autocomplete
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
    refresh,
    trashCount // Extract trashCount
  } = useNotes();

  // Handle View & Filter Changes
  useEffect(() => {
    if (activeView === 'random') {
      setDisplayNotes(getRandomNotes(5));
      return;
    }

    if (activeView === 'all') {
      let filtered = notes;

      // 1. Date Filter
      if (selectedDate) {
        filtered = filtered.filter(n => {
           const d = new Date(n.timestamp);
           const dateStr = d.toISOString().split('T')[0];
           return dateStr === selectedDate;
        });
      }

      // 2. Search Filter
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(n => n.content.toLowerCase().includes(q));
      }

      setDisplayNotes(filtered);
    }
  }, [activeView, selectedDate, searchQuery, notes]);

  // Handle Heatmap Click
  const handleHeatmapClick = (date: string) => {
    // Toggle selection
    if (selectedDate === date) {
      setSelectedDate(null);
    } else {
      setSelectedDate(date);
      setActiveView('all'); // Force switch to all to show filtered list
    }
    // Close sidebar on mobile if clicked
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // Handle Tag Click
  const handleTagClick = (tag: string) => {
      setSearchQuery(`#${tag}`);
      setActiveView('all');
      setSelectedDate(null);
      if (window.innerWidth < 768) setSidebarOpen(false);
  };

  // AI Actions
  const handleOpenDailyReview = async () => {
    setAiPanel({ type: 'summary', isOpen: true, content: '', loading: true });
    
    const todayNotes = getTodayNotes();
    if (todayNotes.length === 0) {
      setAiPanel({ 
        type: 'summary', 
        isOpen: true, 
        content: '今天还没有写任何笔记，快去记录一下吧！', 
        loading: false 
      });
      return;
    }

    const defaultPrompt = `
请阅读我今天记录的以下笔记，并为我生成一份每日总结。
总结今天的主要想法、活动或情绪，并提出任何值得进一步思考的点。

今日笔记：
${todayNotes.map(n => `- ${n.content}`).join('\n')}
    `;

    // Use custom prompt from settings if available, inserting notes
    let prompt = defaultPrompt;
    if (settings.ai.dailyPrompt) {
        prompt = `${settings.ai.dailyPrompt}\n\n今日笔记：\n${todayNotes.map(n => `- ${n.content}`).join('\n')}`;
    }

    const result = await generateAIResponse(prompt);
    setAiPanel(prev => ({ ...prev, content: result, loading: false }));
  };

  const handleOpenAIInsight = async () => {
    setAiPanel({ type: 'insight', isOpen: true, content: '', loading: true });
    
    const randomNotes = getRandomNotes(10);
    if (randomNotes.length === 0) {
       setAiPanel({ 
        type: 'insight', 
        isOpen: true, 
        content: '笔记数量不足，无法生成洞察。', 
        loading: false 
      });
      return;
    }

    const defaultPrompt = `
随机抽取了我最近的 10 条笔记，请阅读并帮我进行回顾。
请根据这些内容，给出一个简短的洞察、总结，或者发现它们之间潜在的联系。
风格保持轻松、启发性。

笔记内容：
${randomNotes.map(n => `- ${n.content}`).join('\n')}
    `;

    // Use custom prompt from settings if available
    let prompt = defaultPrompt;
    if (settings.ai.insightPrompt) {
        prompt = `${settings.ai.insightPrompt}\n\n笔记内容：\n${randomNotes.map(n => `- ${n.content}`).join('\n')}`;
    }

    const result = await generateAIResponse(prompt);
    setAiPanel(prev => ({ ...prev, content: result, loading: false }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F2F2F2] text-flomo-green">
        <Loader2 size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#F2F2F2] p-0 md:p-6 overflow-hidden">
      
      {/* Centered App Container */}
      <div className="w-full max-w-6xl h-full md:h-[90vh] bg-white md:rounded-2xl shadow-xl flex overflow-hidden border border-gray-200">
        
        {/* Left Sidebar */}
        <Sidebar 
          stats={stats} 
          tags={tags} 
          heatmapData={heatmapData}
          selectedDate={selectedDate}
          onHeatmapClick={handleHeatmapClick}
          onTagClick={handleTagClick}
          isOpen={isSidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onOpenSettings={() => setSettingsOpen(true)}
          activeView={activeView}
          onViewChange={(v) => { setActiveView(v); setSelectedDate(null); setSearchQuery(''); }}
          onOpenDailyReview={handleOpenDailyReview}
          onOpenAIInsight={handleOpenAIInsight}
          onSync={refresh}
        />

        {/* Right Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-white relative">
          
                    {/* Header */}
                    <header className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm py-4 border-b border-gray-100">
                                  <div className="max-w-3xl mx-auto w-full px-4 md:px-8 flex items-center justify-between gap-4">
                                    {/* Mobile search bar visible on small screens when state is true */}
                                    {showMobileSearchBar && (
                                      <div className="flex flex-1 items-center relative max-w-xs mx-auto">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                          type="text"
                                          placeholder="搜索笔记..."
                                          className="w-full bg-gray-100 hover:bg-white focus:bg-white border border-transparent focus:border-flomo-green/30 rounded-full py-1.5 pl-9 pr-10 outline-none transition-all duration-200 placeholder-gray-400 text-sm"
                                          value={searchQuery}
                                          onChange={(e) => setSearchQuery(e.target.value)}
                                          autoFocus // Added for better UX
                                        />
                                        {searchQuery && (
                                            <button
                                              onClick={() => setSearchQuery('')}
                                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                <X size={14} />
                                            </button>
                                        )}
                                      </div>
                                    )}
                      
                                    {/* Default header content for mobile, hidden when search bar is active */}
                                    {!showMobileSearchBar && (
                                      <>
                                        <div className="flex items-center gap-3">
                                          <button
                                            className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-md"
                                            onClick={() => setSidebarOpen(true)}
                                          >
                                            <Menu size={20} />
                                          </button>
                                          <div className="flex items-center gap-1 cursor-pointer hover:bg-gray-50 px-2 py-1 rounded-md transition-colors select-none">
                                            <span className="font-bold text-lg text-gray-800 tracking-tight">
                                              {activeView === 'all' && (selectedDate ? `筛选: ${selectedDate}` : (searchQuery ? `搜索: ${searchQuery}` : 'EasyFlomo'))}
                                              {activeView === 'random' && '随机漫步'}
                                            </span>
                                          </div>
                                        </div>
                      
                                        {/* PC Search Bar (remains hidden on mobile, visible on desktop) */}
                                        <div className="flex-1 max-w-xs hidden md:block">
                                          {activeView === 'all' && !selectedDate && (
                                            <div className="relative group">
                                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-flomo-green transition-colors" size={16} />
                                              <input
                                                type="text"
                                                placeholder="搜索笔记..."
                                                className="w-full bg-gray-100 hover:bg-white focus:bg-white border border-transparent focus:border-flomo-green/30 rounded-full py-1.5 pl-9 pr-10 outline-none transition-all duration-200 placeholder-gray-400 text-sm"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                              />
                                              {searchQuery && (
                                                  <button
                                                    onClick={() => setSearchQuery('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                  >
                                                      <X size={14} />
                                                  </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                      
                                    {/* Mobile Search/Close Button (always on right of mobile header) */}
                                    <div className="md:hidden">
                                      {activeView === 'all' && (
                                        <button
                                          onClick={() => setShowMobileSearchBar(!showMobileSearchBar)}
                                          className="p-2 -mr-2 text-gray-500 hover:bg-gray-100 rounded-md"
                                        >
                                          {showMobileSearchBar ? <X size={20} /> : <Search size={20} />}
                                        </button>
                                      )}
                                    </div>
                                  </div>                    </header>
          {/* Content Scroll Area */}
          <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 scroll-smooth">
            <div className="max-w-3xl mx-auto w-full space-y-6 pt-6">
              
              {/* Input */}
              {activeView === 'all' && !selectedDate && !searchQuery && (
                <NoteInput 
                    onAddNote={addNote} 
                    onUploadAsset={uploadAsset} 
                    existingTags={allTagNames}
                />
              )}

              {/* Clear Filter Banner */}
              {selectedDate && (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-700 px-4 py-3 rounded-lg border border-emerald-100 mb-4 animate-in fade-in slide-in-from-top-2">
                  <span className="text-sm">正在显示 <b>{selectedDate}</b> 的笔记</span>
                  <button 
                    onClick={() => setSelectedDate(null)}
                    className="text-xs bg-white border border-emerald-200 px-2 py-1 rounded hover:bg-emerald-100 transition-colors"
                  >
                    清除筛选
                  </button>
                </div>
              )}

              {/* VIEW: RANDOM Header */}
              {activeView === 'random' && (
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">回顾 5 条</h3>
                  <button 
                    onClick={() => setDisplayNotes(getRandomNotes(5))}
                    className="flex items-center gap-1 text-flomo-green text-xs hover:bg-green-50 px-2 py-1 rounded"
                  >
                    <Dices size={14} /> 换一批
                  </button>
                </div>
              )}

              {/* Note List */}
              <div className="space-y-4">
                {displayNotes.length === 0 ? (
                  <div className="text-center py-20 text-gray-400 select-none">
                    <p>{activeView === 'all' ? (selectedDate || searchQuery ? '没有找到相关笔记' : '还没有笔记，记录下此刻的想法吧 ✨') : '没有更多内容了'}</p>
                  </div>
                ) : (
                  displayNotes.map(note => (
                    <NoteCard 
                        key={note.id} 
                        note={note} 
                        onDelete={deleteNote} 
                        onUpdate={updateNoteContent}
                    />
                  ))
                )}
              </div>

              {/* End of list indicator */}
              {displayNotes.length > 0 && (
                <div className="text-center text-gray-300 text-xs py-8 select-none">
                  - End -
                </div>
              )}

            </div>
          </div>

          <AIPanel 
            isOpen={aiPanel.isOpen}
            title={aiPanel.type === 'summary' ? '今日总结' : 'AI 随机洞察'}
            content={aiPanel.content}
            isLoading={aiPanel.loading}
            onClose={() => setAiPanel(prev => ({ ...prev, isOpen: false }))}
            onRefresh={aiPanel.type === 'summary' ? handleOpenDailyReview : handleOpenAIInsight}
          />
          
        </main>
      </div>

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onSave={updateSettings}
        onClearTrash={clearTrash}
        trashCount={trashCount}
      />

    </div>
  );
}

export default App;
