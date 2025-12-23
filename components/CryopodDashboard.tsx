import React from 'react';
import { Snowflake } from 'lucide-react';
import { Note } from '../types';
import NoteCard from './NoteCard';

interface CryopodDashboardProps {
  frozenNotes: Note[];
  onThaw: (id: string) => Promise<void>;
}

const CryopodDashboard: React.FC<CryopodDashboardProps> = ({ frozenNotes, onThaw }) => {
  if (!frozenNotes || frozenNotes.length === 0) return null;

  return (
    <div className="bg-blue-600/5 rounded-xl p-4 md:p-5 border border-blue-200 mb-6 space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
        <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-xs uppercase tracking-wider px-1">
            <Snowflake size={14} />
            <span>心流冷冻舱 ({frozenNotes.length})</span>
        </div>
        
        <div className="space-y-2">
            {frozenNotes.map(note => (
                <NoteCard 
                    key={note.id} 
                    note={note} 
                    onThaw={onThaw} 
                    isCompact={true} 
                />
            ))}
        </div>
    </div>
  );
};

export default CryopodDashboard;