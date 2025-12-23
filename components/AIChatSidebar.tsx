import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, MessageSquare, Send, Loader2, Sparkles, Check, Edit3, Save, FileText, AlignLeft } from 'lucide-react';
import { Note } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface AIChatSidebarProps {
  isOpen: boolean;
  note: Note | null;
  onClose: () => void;
  onSaveToNote: (content: string) => Promise<void>;
  generateAIResponse: (prompt: string, messages?: {role: string, content: string}[]) => Promise<string>;
}

const AIChatSidebar: React.FC<AIChatSidebarProps> = ({ isOpen, note, onClose, onSaveToNote, generateAIResponse }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditSummary] = useState('');
  const [saveMode, setSaveMode] = useState<'summary' | 'transcript'>('summary');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && note && messages.length === 0) {
      handleInitialInsight();
    }
    if (!isOpen) {
        // Reset state when closed
        setMessages([]);
        setSummary(null);
        setIsEnding(false);
        setIsEditingSummary(false);
        setSaveMode('summary');
    }
  }, [isOpen, note]);

  const handleInitialInsight = async () => {
    if (!note) return;
    setIsInitialLoading(true);
    const prompt = `针对这条笔记内容，请给我一个深刻的洞见、启发或者后续的追问，帮助我深入思考。\n\n笔记内容：\n${note.content}`;
    try {
      const response = await generateAIResponse(prompt);
      const newMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages([newMessage]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsInitialLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading || !note) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: inputValue,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const chatContext = messages.map(m => ({ role: m.role, content: m.content }));
      chatContext.push({ role: 'user', content: inputValue });

      const prompt = `基于以下笔记内容进行讨论：\n${note.content}\n\n当前讨论上下文已包含在对话历史中。请继续回答用户的问题。`;
      
      const response = await generateAIResponse(prompt, chatContext);
      
      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      console.error(e);
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: '抱歉，生成回复时出错了。',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const generateTranscript = (msgs: Message[]) => {
      return msgs.map(m => `**${m.role === 'user' ? 'User' : 'AI'}**: ${m.content}`).join('\n\n');
  };

  const handleEndSession = async () => {
      if (messages.length === 0) {
          onClose();
          return;
      }

      setIsEnding(true);
      const chatHistory = messages.map(m => `${m.role === 'user' ? '用户' : 'AI'}: ${m.content}`).join('\n');
      const prompt = `请回顾以上的对话内容，并提取出核心的“洞见”、“启发”或“行动建议”。\n要求：极其精炼，采用点列式，直接输出总结内容，不要废话。\n\n对话历史：\n${chatHistory}`;
      
      try {
          const result = await generateAIResponse(prompt);
          setSummary(result);
          setEditSummary(result); // Default to summary content
          setSaveMode('summary');
      } catch (e) {
          console.error(e);
          setSummary('无法生成总结，请手动记录。');
          setEditSummary('');
      } finally {
          setIsEnding(false);
      }
  };

  const toggleSaveMode = () => {
      const newMode = saveMode === 'summary' ? 'transcript' : 'summary';
      setSaveMode(newMode);
      
      if (newMode === 'transcript') {
          setEditSummary(generateTranscript(messages));
      } else {
          setEditSummary(summary || '');
      }
  };

  const handleSaveAndClose = async () => {
      await onSaveToNote(editedSummary);
      onClose();
  };

  if (!isOpen || !note) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-80 md:w-96 lg:w-[480px] xl:w-[600px] bg-white shadow-2xl border-l border-gray-200 z-40 flex flex-col animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-flomo-green" />
          <h2 className="font-bold text-gray-800">AI 深度对话</h2>
        </div>
        <div className="flex items-center gap-2">
            {!summary && messages.length > 0 && (
                <button 
                    onClick={handleEndSession}
                    disabled={isEnding}
                    className="text-[10px] bg-white border border-gray-200 hover:border-flomo-green hover:text-flomo-green px-2 py-1 rounded shadow-sm transition-all flex items-center gap-1 disabled:opacity-50"
                >
                    {isEnding ? <Loader2 size={10} className="animate-spin" /> : <Check size={10} />}
                    结束讨论
                </button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Summary Review Mode */}
      {summary !== null ? (
          <div className="flex-1 flex flex-col bg-purple-50/30 overflow-hidden">
              <div className="p-6 overflow-y-auto flex-1">
                  <div className="flex items-center justify-between text-purple-600 mb-4">
                      <div className="flex items-center gap-2">
                        {saveMode === 'summary' ? <Sparkles size={18} /> : <FileText size={18} />}
                        <h3 className="font-bold">{saveMode === 'summary' ? '讨论总结与洞见' : '对话实录'}</h3>
                      </div>
                      <button 
                        onClick={toggleSaveMode}
                        className="text-[10px] bg-white border border-purple-200 px-2 py-1 rounded hover:bg-purple-50 transition-colors flex items-center gap-1"
                      >
                          {saveMode === 'summary' ? <><AlignLeft size={12} /> 切换为对话实录</> : <><Sparkles size={12} /> 切换为智能总结</>}
                      </button>
                  </div>
                  
                  {isEditingSummary ? (
                      <textarea 
                        className="w-full h-64 p-4 bg-white border border-purple-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-200 resize-none leading-relaxed text-gray-700 font-mono"
                        value={editedSummary}
                        onChange={e => setEditSummary(e.target.value)}
                        autoFocus
                      />
                  ) : (
                      <div className="bg-white/80 border border-purple-100 p-5 rounded-xl text-sm text-gray-700 leading-relaxed shadow-sm whitespace-pre-wrap prose prose-sm max-w-none">
                          <ReactMarkdown>
                              {editedSummary}
                          </ReactMarkdown>
                      </div>
                  )}

                  <p className="mt-4 text-[10px] text-gray-400">确认后，此内容将追加至原始笔记末尾，并以引用块样式展示。</p>
              </div>

              <div className="p-4 border-t bg-white flex justify-end gap-2">
                  <button 
                    onClick={() => setIsEditingSummary(!isEditingSummary)}
                    className="flex items-center gap-1 px-3 py-2 text-xs text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                      {isEditingSummary ? <><Save size={14} /> 完成编辑</> : <><Edit3 size={14} /> 修改内容</>}
                  </button>
                  <button 
                    onClick={handleSaveAndClose}
                    className="flex items-center gap-1 px-4 py-2 bg-flomo-green text-white text-xs font-bold rounded-lg hover:bg-flomo-hover shadow-md transition-all active:scale-95"
                  >
                      <Save size={14} /> 保存并同步至笔记
                  </button>
              </div>
          </div>
      ) : (
          <>
            {/* Note Context Summary */}
            <div className="p-4 bg-gray-50 border-b">
                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-widest mb-2">当前对话笔记</div>
                <div className="text-xs text-gray-600 line-clamp-3 italic">
                    {note.content}
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {isInitialLoading && (
                    <div className="flex items-center gap-2 text-gray-400 text-xs italic">
                        <Loader2 size={12} className="animate-spin" /> AI 正在生成启发...
                    </div>
                )}
                
                {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3 rounded-lg text-sm ${
                            m.role === 'user' 
                            ? 'bg-flomo-green text-white rounded-br-none' 
                            : 'bg-blue-50 text-blue-900 rounded-bl-none border border-blue-100'
                        }`}>
                            <div className={`prose prose-sm ${m.role === 'user' ? 'prose-invert text-white' : 'text-blue-900'} max-w-none break-words`}>
                                <ReactMarkdown>
                                    {m.content}
                                </ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}
                
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg text-sm rounded-bl-none animate-pulse">
                            ...
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        placeholder="输入你的想法..." 
                        className="flex-1 bg-gray-100 border-none rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-flomo-green/30"
                        value={inputValue}
                        onChange={e => setInputValue(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !inputValue.trim()}
                        className="p-2 bg-flomo-green text-white rounded-lg hover:bg-flomo-hover transition-colors disabled:opacity-50"
                        aria-label="发送"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
          </>
      )}
    </div>
  );
};

export default AIChatSidebar;
