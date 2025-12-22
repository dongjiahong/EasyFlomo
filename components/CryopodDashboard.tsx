
import React, { useState, useEffect } from 'react';
import { Snowflake, Play, Loader2, Sparkles, ChevronRight } from 'lucide-react';
import { Note } from '../types';

interface CryopodDashboardProps {
  frozenNote: Note | null;
  onThaw: (id: string) => Promise<void>;
  onGenerateBriefing: (note: Note) => Promise<string>;
}

const CryopodDashboard: React.FC<CryopodDashboardProps> = ({ frozenNote, onThaw, onGenerateBriefing }) => {
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThawing, setIsThawing] = useState(false);

  useEffect(() => {
    if (frozenNote) {
      handleRefreshBriefing();
    } else {
        setBriefing('');
    }
  }, [frozenNote?.id]);

  const handleRefreshBriefing = async () => {
    if (!frozenNote) return;
    setIsLoading(true);
    try {
        const result = await onGenerateBriefing(frozenNote);
        setBriefing(result);
    } catch (e) {
        console.error(e);
        setBriefing('脑镜像同步失败，请手动查看笔记内容。');
    } finally {
        setIsLoading(false);
    }
  };

  const handleThaw = async () => {
    if (!frozenNote) return;
    setIsThawing(true);
    try {
        await onThaw(frozenNote.id);
    } finally {
        setIsThawing(false);
    }
  };

  if (!frozenNote) return null;

  return (
    <div className="bg-blue-600 rounded-xl p-4 md:p-5 shadow-lg shadow-blue-200 border border-blue-500 animate-in fade-in slide-in-from-top-4 duration-500 mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Left Side: Icon & Title */}
        <div className="flex items-center gap-3 shrink-0">
            <div className="p-3 bg-white/20 rounded-full text-white animate-pulse">
                <Snowflake size={24} />
            </div>
            <div>
                <h3 className="text-white font-bold text-sm uppercase tracking-widest">心流冷冻中</h3>
                <p className="text-blue-100 text-[10px] opacity-80">DETECTED: ACTIVE_CONTEXT_SNAPSHOT</p>
            </div>
        </div>

        {/* Middle: AI Briefing */}
        <div className="flex-1 bg-black/10 rounded-lg p-3 border border-white/5 relative group">
            {isLoading ? (
                <div className="flex items-center gap-2 text-blue-100 text-xs italic py-1">
                    <Loader2 size={12} className="animate-spin" /> 正在同步脑镜像内存...
                </div>
            ) : (
                <div className="text-white text-sm leading-relaxed pr-6">
                    <Sparkles size={12} className="inline-block mr-2 text-blue-300" />
                    {briefing || "脑镜像已就绪。"}
                </div>
            )}
            
            {!isLoading && (
                <button 
                    onClick={handleRefreshBriefing}
                    className="absolute right-2 top-2 text-white/40 hover:text-white transition-colors"
                    title="刷新简报"
                >
                    <Sparkles size={14} />
                </button>
            )}
        </div>

        {/* Right Side: Action Button */}
        <button 
            onClick={handleThaw}
            disabled={isThawing}
            className="bg-white text-blue-600 hover:bg-blue-50 px-5 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
            {isThawing ? (
                <Loader2 size={18} className="animate-spin" />
            ) : (
                <>
                    <Play size={18} fill="currentColor" />
                    立即解冻
                </>
            )}
        </button>
      </div>
    </div>
  );
};

export default CryopodDashboard;
