
import React, { useState } from 'react';
import { X, Trash2, CheckCircle2, RefreshCcw, AlertTriangle } from 'lucide-react';
import { Note } from '../types';

interface TrashPanelProps {
  isOpen: boolean;
  onClose: () => void;
  trashedNotes: Note[];
  onRestore: (id: string) => Promise<void>;
  onDeletePermanently: (id: string) => Promise<void>;
  onClearTrash: () => Promise<void>;
}

const TrashPanel: React.FC<TrashPanelProps> = ({ 
  isOpen, 
  onClose, 
  trashedNotes, 
  onRestore, 
  onDeletePermanently, 
  onClearTrash 
}) => {
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen) return null;

  const handleClearTrash = async () => {
    if (window.confirm('确定要清空废纸篓吗？所有笔记将永久删除，无法恢复。')) {
      setIsClearing(true);
      await onClearTrash();
      setIsClearing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-xl">
          <div className="flex items-center gap-2">
            <Trash2 className="text-red-500" size={20} />
            <h2 className="text-lg font-bold text-gray-800">废纸篓</h2>
            <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-bold">
              {trashedNotes.length}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 px-4 py-3 flex gap-3 border-b border-blue-100">
            <AlertTriangle size={16} className="text-blue-500 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-700 leading-relaxed">
                <p className="font-bold mb-0.5">关于废纸篓</p>
                <p>笔记删除后保留 30 天，期间可恢复。本地删除会同步到其他设备。清空废纸篓或超过 30 天将永久删除。</p>
            </div>
        </div>

        {/* Toolbar */}
        {trashedNotes.length > 0 && (
             <div className="p-2 border-b bg-white flex justify-end">
                 <button 
                   onClick={handleClearTrash}
                   disabled={isClearing}
                   className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded border border-transparent hover:border-red-100 transition-colors flex items-center gap-1"
                 >
                     <Trash2 size={14} />
                     {isClearing ? '清空中...' : '清空废纸篓'}
                 </button>
             </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
          {trashedNotes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <Trash2 size={48} className="mb-4 opacity-20" />
              <p>废纸篓是空的</p>
            </div>
          ) : (
            trashedNotes.map(note => (
              <div key={note.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm group">
                <div className="text-sm text-gray-800 mb-3 whitespace-pre-wrap break-words max-h-32 overflow-hidden relative">
                    {note.content}
                    <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent" />
                </div>
                
                <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                    <span className="text-[10px] text-gray-400">
                        删除于: {note.deletedAt ? new Date(note.deletedAt).toLocaleDateString() : '未知'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button 
                          onClick={() => onRestore(note.id)}
                          className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="恢复"
                        >
                            <RefreshCcw size={14} />
                        </button>
                        <button 
                           onClick={() => onDeletePermanently(note.id)}
                           className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                           title="彻底删除"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TrashPanel;
