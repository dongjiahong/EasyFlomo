
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Note } from '../types';
import NoteImage from './NoteImage';

interface NoteCardProps {
  note: Note;
  onDelete?: (id: string) => void;
}

const NoteCard: React.FC<NoteCardProps> = ({ note, onDelete }) => {
  
  const processedContent = useMemo(() => {
    return note.content.replace(/(^|\s)(#[\w\u4e00-\u9fa5]+(?:\/[\w\u4e00-\u9fa5]+)*)/g, '$1[$2](tag:$2)');
  }, [note.content]);

  return (
    <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 group border border-gray-100">
      {/* Header: Date & Options */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400 font-mono select-none">
          {note.createdAt}
        </span>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onDelete && (
                <button 
                    onClick={() => {
                        if (window.confirm('确定要删除这条笔记吗？（将在同步时移入回收站）')) {
                            onDelete(note.id);
                        }
                    }}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                    title="删除笔记"
                >
                    <Trash2 size={16} />
                </button>
            )}
            <button className="text-gray-300 hover:text-gray-600 transition-colors">
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
