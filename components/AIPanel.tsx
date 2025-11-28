import React from 'react';
import { X, Sparkles, Loader2, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIPanelProps {
  isOpen: boolean;
  title: string;
  content: string;
  isLoading: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, title, content, isLoading, onClose, onRefresh }) => {
  if (!isOpen) return null;

  return (
    // Changed from fixed to absolute, so it centers relative to the parent container (Main View)
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-white/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 flex flex-col max-h-[80%] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-2 text-indigo-700 font-bold">
            <Sparkles size={18} />
            <h3>{title}</h3>
          </div>
          <div className="flex items-center gap-1">
            {onRefresh && (
              <button 
                onClick={onRefresh} 
                disabled={isLoading}
                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors disabled:opacity-50"
                title="刷新/重试"
              >
                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-10 text-indigo-400/80 gap-4">
              <Loader2 size={40} className="animate-spin" />
              <p className="text-sm font-medium">AI 正在思考中...</p>
            </div>
          ) : content ? (
            <div className="markdown-body prose prose-sm prose-indigo max-w-none text-gray-700">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-400 text-sm">
              暂无内容
            </div>
          )}
        </div>
        
        {/* Footer hint */}
        <div className="p-3 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
          由 AI 生成，仅供参考
        </div>
      </div>
    </div>
  );
};

export default AIPanel;