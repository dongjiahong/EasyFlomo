import React, { useMemo, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { MoreHorizontal, Trash2, Save, X, AlertTriangle, Snowflake } from 'lucide-react';
import { Note } from '../types';
import NoteImage from './NoteImage';

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, content: string) => Promise<void>;
  onFreeze?: (note: Note) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete, onUpdate, onFreeze }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(note.content);
  const [deleteStep, setDeleteStep] = useState<0 | 1>(0); // 0: idle, 1: confirm
  
  const isFrozen = note.isFrozen;

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
    const editBorderClass = isFrozen ? 'border-blue-400 shadow-blue-50' : 'border-flomo-green';
    const saveBtnClass = isFrozen ? 'bg-blue-500 hover:bg-blue-600' : 'bg-flomo-green hover:bg-flomo-hover';

    return (
        <div className={`bg-white rounded-xl p-5 shadow-md border-2 ${editBorderClass} transition-shadow duration-200`}>
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
                    className={`px-3 py-1.5 text-xs text-white rounded flex items-center gap-1 shadow-sm transition-colors ${saveBtnClass}`}
                >
                    <Save size={14} /> 保存
                </button>
            </div>
        </div>
    );
  }

  const cardClass = isFrozen 
    ? "bg-blue-50/30 rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group border border-blue-100/50"
    : "bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-all duration-200 group border border-gray-100";

  return (
    <div 
        className={cardClass}
        onDoubleClick={() => { if(onUpdate) setIsEditing(true); }}
    >
      {/* Header: Date & Options */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-mono select-none">
            {note.createdAt}
            </span>
            {isFrozen && (
                <span className="flex items-center gap-1 text-[10px] bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded uppercase font-bold tracking-tight">
                    <Snowflake size={10} /> Frozen
                </span>
            )}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onFreeze && !isFrozen && (
                <button 
                    onClick={() => onFreeze(note)}
                    className="text-gray-300 hover:text-blue-500 hover:bg-blue-50 p-1 rounded transition-colors"
                    title="冷冻心流"
                >
                    <Snowflake size={16} />
                </button>
            )}
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
                    const tagClass = isFrozen 
                        ? "inline-block bg-blue-100 text-blue-500 px-2 py-0.5 rounded-full text-xs font-medium mx-0.5 cursor-pointer hover:bg-blue-200 transition-colors border border-blue-200 no-underline"
                        : "inline-block bg-green-50 text-flomo-green px-2 py-0.5 rounded-full text-xs font-medium mx-0.5 cursor-pointer hover:bg-green-100 transition-colors border border-green-100 no-underline";
                    return (
                        <span className={tagClass}>
                           {children}
                        </span>
                    )
                }
                const linkClass = isFrozen ? "text-blue-500 hover:underline" : "text-flomo-green hover:underline";
                return <a href={href} className={linkClass} {...props}>{children}</a>
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
