
import React, { useState, useRef, useEffect } from 'react';
import { Hash, Image as ImageIcon, Type, List, ListOrdered, Send, Loader2 } from 'lucide-react';

interface NoteInputProps {
  onAddNote: (content: string, assetIds: string[]) => Promise<void>;
  onUploadAsset: (file: File) => Promise<string>;
  existingTags?: string[];
}

const NoteInput: React.FC<NoteInputProps> = ({ onAddNote, onUploadAsset, existingTags = [] }) => {
  const [content, setContent] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAssets, setPendingAssets] = useState<string[]>([]);
  
  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [activeTagStart, setActiveTagStart] = useState<number | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onAddNote(content, pendingAssets);
      setContent('');
      setPendingAssets([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showSuggestions) {
        if (e.key === 'Escape') {
            setShowSuggestions(false);
            e.preventDefault();
        }
        // Basic navigation could be added here
    }

    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setContent(val);
      
      // Simple autocomplete trigger logic
      const cursor = e.target.selectionStart;
      // Find the word being typed
      const textBeforeCursor = val.slice(0, cursor);
      const hashIndex = textBeforeCursor.lastIndexOf('#');
      
      if (hashIndex !== -1) {
          // Check if there's a space after the last hash (meaning we left the tag)
          const textAfterHash = textBeforeCursor.slice(hashIndex + 1);
          if (!/\s/.test(textAfterHash)) {
              // We are inside a tag
              const query = textAfterHash.toLowerCase();
              const filtered = existingTags.filter(t => 
                  t.toLowerCase().includes(query) && t.toLowerCase() !== query
              );
              
              if (filtered.length > 0) {
                  setSuggestions(filtered);
                  setShowSuggestions(true);
                  setActiveTagStart(hashIndex);
                  
                  // Calculate position (approximation)
                  // In a real app, use a library like get-caret-coordinates or a hidden div mirror
                  setSuggestionPos({ 
                      top: 40 + (textareaRef.current?.scrollHeight || 0), // Just put it below for now
                      left: 10 
                  });
              } else {
                  setShowSuggestions(false);
              }
          } else {
              setShowSuggestions(false);
          }
      } else {
          setShowSuggestions(false);
      }
  };

  const insertTag = (tag: string) => {
      if (activeTagStart === null || !textareaRef.current) return;
      
      const before = content.slice(0, activeTagStart);
      const afterCursor = content.slice(textareaRef.current.selectionStart);
      
      const newContent = `${before}#${tag} ${afterCursor}`;
      setContent(newContent);
      setShowSuggestions(false);
      
      setTimeout(() => {
          if (textareaRef.current) {
              textareaRef.current.focus();
              const newPos = activeTagStart + tag.length + 2; // +1 for #, +1 for space
              textareaRef.current.setSelectionRange(newPos, newPos);
          }
      }, 0);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      await processFile(file);
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const processFile = async (file: File) => {
    try {
      // Insert placeholder
      const placeholder = `![Uploading ${file.name}...]`;
      insertText(placeholder);
      
      // Upload
      const assetId = await onUploadAsset(file);
      
      // Replace placeholder with custom asset protocol
      const assetMarkdown = `\n![](asset://${assetId})\n`;
      setContent(prev => prev.replace(placeholder, assetMarkdown));
      setPendingAssets(prev => [...prev, assetId]);
    } catch (err) {
      console.error("Upload failed", err);
      alert("图片上传失败");
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          await processFile(file);
        }
      }
    }
  };

  const insertText = (text: string) => {
    if (!textareaRef.current) return;
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const newContent = content.substring(0, start) + text + content.substring(end);
    setContent(newContent);
    // Restore focus and cursor
    setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.selectionStart = start + text.length;
            textareaRef.current.selectionEnd = start + text.length;
        }
    }, 0);
  };

  return (
    <div 
      className={`
        bg-white rounded-xl transition-all duration-200
        border-2 relative
        ${isFocused ? 'border-flomo-green shadow-[0_0_0_2px_rgba(60,179,113,0.1)]' : 'border-transparent shadow-sm'}
      `}
    >
      <input 
        id="asset-upload-input"
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*"
        onChange={handleFileSelect}
      />

      <div className="p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
              setIsFocused(false);
              // Delay hide to allow click on suggestion
              setTimeout(() => setShowSuggestions(false), 200);
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="现在的想法是... (支持粘贴图片，输入 # 插入标签)"
          className="w-full resize-none outline-none text-gray-700 placeholder-gray-400 min-h-[60px] max-h-[400px]"
          rows={1}
        />
        
        {/* Suggestion Box (Simplified positioning for now) */}
        {showSuggestions && (
            <div className="absolute left-4 bottom-14 bg-white border border-gray-200 shadow-lg rounded-lg max-h-40 overflow-y-auto z-20 min-w-[150px]">
                {suggestions.map(tag => (
                    <div 
                        key={tag}
                        onClick={() => insertTag(tag)}
                        className="px-3 py-2 hover:bg-green-50 text-sm text-gray-700 cursor-pointer flex items-center gap-2"
                    >
                        <Hash size={14} className="text-gray-400" />
                        {tag}
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className={`px-2 pb-2 flex items-center justify-between ${isFocused || content ? 'opacity-100' : 'opacity-60'}`}>
        <div className="flex items-center gap-1 text-gray-400">
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="标签 #" onClick={() => insertText("#")}>
            <Hash size={18} />
          </button>
          
          <label 
            htmlFor="asset-upload-input"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer text-gray-400" 
            title="插入图片"
          >
            <ImageIcon size={18} />
          </label>
          
          <div className="w-px h-4 bg-gray-200 mx-1"></div>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="加粗" onClick={() => insertText("**bold**")}>
            <Type size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="无序列表" onClick={() => insertText("\n- ")}>
            <List size={18} />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="有序列表" onClick={() => insertText("\n1. ")}>
            <ListOrdered size={18} />
          </button>
        </div>

        <button 
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`
            p-2 rounded-lg transition-all duration-200 flex items-center
            ${content.trim() && !isSubmitting
              ? 'bg-flomo-green text-white shadow-md hover:bg-flomo-hover cursor-pointer' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
          `}
        >
          {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
        </button>
      </div>
    </div>
  );
};

export default NoteInput;
