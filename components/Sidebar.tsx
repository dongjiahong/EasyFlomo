import React, { useState } from 'react';
import { 
  LayoutGrid, 
  RotateCcw, 
  BrainCircuit, 
  Dices, 
  Hash,
  Settings,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Trash2
} from 'lucide-react';
import Heatmap from './Heatmap';
import { UserStats, TagNode } from '../types';
import { db } from '../lib/db';

interface SidebarProps {
  stats: UserStats;
  tags: TagNode[];
  heatmapData: Map<string, number>;
  selectedDate: string | null;
  onHeatmapClick: (date: string) => void;
  onTagClick: (tag: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenTrash: () => void;
  activeView: 'all' | 'random';
  onViewChange: (view: 'all' | 'random') => void;
  onOpenDailyReview: () => void;
  onOpenAIInsight: () => void;
  onSync: () => Promise<void>;
}

// Recursive Tag Component
const TagItem: React.FC<{ node: TagNode; depth?: number; onTagClick: (tag: string) => void }> = ({ node, depth = 0, onTagClick }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="select-none">
      <div 
        className={`
          flex items-center justify-between px-3 py-1.5 
          text-gray-700 hover:bg-gray-100 rounded-md text-sm cursor-pointer group
        `}
        style={{ paddingLeft: `${depth * 12 + 12}px` }}
        onClick={() => onTagClick(node.fullPath)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {hasChildren && (
             <span 
               onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
               className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
             >
               {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
             </span>
          )}
          {!hasChildren && <Hash size={14} className="text-gray-400 shrink-0" />}
          
          <span className="truncate">{node.name}</span>
        </div>
        
        {node.count > 0 && (
          <span className="text-xs text-gray-400 group-hover:text-gray-500">{node.count}</span>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div>
          {node.children.map(child => (
            <TagItem key={child.id} node={child} depth={depth + 1} onTagClick={onTagClick} />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  stats, 
  tags, 
  heatmapData,
  selectedDate,
  onHeatmapClick,
  onTagClick,
  isOpen, 
  onClose, 
  onOpenSettings,
  onOpenTrash,
  activeView,
  onViewChange,
  onOpenDailyReview,
  onOpenAIInsight,
  onSync
}) => {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const NavButton = ({ 
    isActive, 
    onClick,
    icon: Icon, 
    label 
  }: { 
    isActive?: boolean;
    onClick: () => void; 
    icon: React.ElementType; 
    label: string 
  }) => {
    return (
      <button 
        onClick={onClick}
        className={`
          flex items-center gap-3 px-3 py-2 rounded-md font-medium w-full transition-all duration-200
          ${isActive 
            ? 'bg-flomo-green text-white shadow-sm shadow-emerald-200' 
            : 'text-gray-600 hover:bg-gray-100'}
        `}
      >
        <Icon size={18} />
        <span>{label}</span>
      </button>
    );
  }

  const handleNav = (action: () => void) => {
    action();
    if (window.innerWidth < 768) onClose();
  }

  const handleSyncClick = async () => {
    const settings = await db.getSettings();
    if (!settings?.webdav?.url || !settings?.webdav?.username) {
        alert("请先在设置中配置 WebDAV 信息！");
        onOpenSettings();
        return;
    }

    setSyncStatus('loading');
    try {
        await onSync();
        setSyncStatus('success');
        setTimeout(() => setSyncStatus('idle'), 2000);
    } catch (e: any) {
        console.error(e);
        setSyncStatus('error');
        alert(`同步失败: ${e.message}`);
        setTimeout(() => setSyncStatus('idle'), 3000);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-20 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Content */}
      <aside 
        className={`
          absolute md:relative h-full w-64 bg-gray-50
          flex flex-col border-r border-gray-200
          transition-transform duration-300 z-30
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          overflow-hidden
        `}
      >
        {/* Fixed Top Section */}
        <div className="shrink-0 pt-6 px-4">
            {/* User Profile Header */}
            <div className="flex items-center justify-between mb-8">
              <button 
                  onClick={onOpenTrash} 
                  className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-md transition-colors"
                  title="废纸篓"
              >
                  <Trash2 size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSyncClick} 
                  className={`
                    p-1.5 rounded-md transition-all relative
                    ${syncStatus === 'success' ? 'text-green-600 bg-green-50' : ''}
                    ${syncStatus === 'error' ? 'text-red-500 bg-red-50' : ''}
                    ${syncStatus === 'idle' || syncStatus === 'loading' ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-200' : ''}
                  `}
                  title="同步/刷新"
                  disabled={syncStatus === 'loading'}
                >
                    {syncStatus === 'loading' && <RefreshCw size={16} className="animate-spin text-flomo-green" />}
                    {syncStatus === 'success' && <CheckCircle2 size={16} />}
                    {syncStatus === 'error' && <AlertCircle size={16} />}
                    {syncStatus === 'idle' && <RefreshCw size={16} />}
                </button>
                <button 
                  onClick={onOpenSettings} 
                  className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-200 rounded-md transition-colors"
                  title="设置"
                >
                    <Settings size={16} />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 mb-8 text-center select-none">
            <div>
                <div className="text-xl font-bold text-gray-600">{stats.noteCount}</div>
                <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">笔记</div>
            </div>
            <div>
                <div className="text-xl font-bold text-gray-600">{stats.tagCount}</div>
                <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">标签</div>
            </div>
            <div>
                <div className="text-xl font-bold text-gray-600">{stats.dayCount}</div>
                <div className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider">天</div>
            </div>
            </div>

            {/* Heatmap */}
            <Heatmap 
              activityData={heatmapData} 
              selectedDate={selectedDate}
              onDateClick={onHeatmapClick}
            />

            {/* Navigation Menu */}
            <nav className="flex flex-col gap-1 mb-8">
              <NavButton 
                isActive={activeView === 'all'} 
                onClick={() => handleNav(() => onViewChange('all'))} 
                icon={LayoutGrid} 
                label="全部笔记" 
              />
              <NavButton 
                onClick={() => handleNav(onOpenDailyReview)} 
                icon={RotateCcw} 
                label="每日总结" 
              />
              <NavButton 
                onClick={() => handleNav(onOpenAIInsight)} 
                icon={BrainCircuit} 
                label="AI 洞察" 
              />
              <NavButton 
                isActive={activeView === 'random'}
                onClick={() => handleNav(() => onViewChange('random'))} 
                icon={Dices} 
                label="随机漫步" 
              />
            </nav>

            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-3">标签</h3>
        </div>

        {/* Scrollable Tags Section */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 scroll-smooth">
            {/* Tags Section */}
            <div className="space-y-0.5">
                {tags.length === 0 && (
                    <div className="text-xs text-gray-400 px-3">暂无标签</div>
                )}
                {tags.map(node => (
                    <TagItem key={node.id} node={node} onTagClick={onTagClick} />
                ))}
            </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;