
import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MoreHorizontal, Trash2, Save, X, AlertTriangle } from 'lucide-react';
import { Note } from '../types';
import NoteImage from './NoteImage';

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: string) => Promise<void>;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0); // 0: idle, 1: confirm
  
  // Reset delete step if user moves away
  useEffect(() => {
      if (deleteStep === 1) {
          const timer = setTimeout(() => setDeleteStep(0), 3000);
          return () => clearTimeout(timer);
      }
  }, [deleteStep]);

  const processedContent = useMemo(() => {
    // Only process tags if NOT editing
    return note.content.replace(/(^|\s)(#[\w\u4e00-\u9fa5]+(?:\/[\w\u4e00-\u9fa5]+)*)/g, '$1[$2](tag:$2)');
  }, [note.content]);

  const handleSave = async () => {
    if (onUpdate && editContent.trim() !== note.content) {
        await onUpdate(note.id, editContent);
    }
    setIsEditing(false);
  };

  const handleDeleteClick = () => {
      if (!onDelete) return;
      if (deleteStep === 0) {
          setDeleteStep(1);
      } else {
          onDelete(note.id);
      }
  };

  if (isEditing) {
    return (
        <div className="bg-white rounded-xl p-5 shadow-md border-2 border-flomo-green transition-shadow duration-200">
            <textarea 
                className="w-full h-auto min-h-[120px] resize-none outline-none text-gray-700 text-sm font-mono leading-relaxed bg-transparent"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                        handleSave();
                    }
                    if (e.key === 'Escape') {
                        setIsEditing(false);
                        setEditContent(note.content);
                    }
                }}
            />
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                <button 
                    onClick={() => { setIsEditing(false); setEditContent(note.content); }}
                    className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded flex items-center gap-1"
                >
                    <X size={14} /> 取消
                </button>
                <button 
                    onClick={handleSave}
                    className="px-3 py-1.5 text-xs text-white bg-flomo-green hover:bg-flomo-hover rounded flex items-center gap-1 shadow-sm"
                >
                    <Save size={14} /> 保存
                </button>
            </div>
        </div>
    );
  }

  return (
    <div 
        className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group border border-gray-100"
        onDoubleClick={() => { if(onUpdate) setIsEditing(true); }}
    >
      {/* Header: Date & Options */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400 font-mono select-none">
          {note.createdAt}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && (
                <button 
                    onClick={handleDeleteClick}
                    className={`transition-colors p-1 rounded ${
                        deleteStep === 1 
                        ? 'text-red-600 bg-red-50 animate-pulse' 
                        : 'text-gray-300 hover:text-red-500 hover:bg-gray-50'
                    }`}
                    title={deleteStep === 1 ? "再次点击确认删除" : "删除笔记"}
                >
                    {deleteStep === 1 ? <AlertTriangle size={16} /> : <Trash2 size={16} />}
                </button>
            )}
            <button className="text-gray-300 hover:text-gray-600 transition-colors cursor-move">
                <MoreHorizontal size={18} />
            </button>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm max-w-none text-gray-800 leading-relaxed break-words prose-p:mb-2 prose-p:last:mb-0 prose-a:no-underline prose-img:rounded-lg">
        <ReactMarkdown
          urlTransform={(url) => url}
          components={{
            img: ({node, ...props}) => <NoteImage src={props.src} alt={props.alt} />,
            a: ({node, href, children, ...props}) => {
                if (href && href.startsWith('tag:')) {
                    return (
                        <span className="inline-block bg-green-50 text-flomo-green px-2 py-0.5 rounded-full text-xs font-medium mx-0.5 cursor-pointer hover:bg-green-100 transition-colors border border-green-100 no-underline">
                           {children}
                        </span>
                    )
                }
                return <a href={href} className="text-flomo-green hover:underline" {...props}>{children}</a>
            },
            p: ({node, children, ...props}) => <p className="mb-1 last:mb-0" {...props}>{children}</p>
          }}
        >
          {processedContent}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default NoteCard;
