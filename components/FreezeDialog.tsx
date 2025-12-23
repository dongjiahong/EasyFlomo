
import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, Snowflake, Zap, Brain, Activity, MessageSquare, Sparkles, Loader2 } from 'lucide-react';
import { FlowSnapshot } from '../types';

interface FreezeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (snapshot: FlowSnapshot, aiOptimizedContent?: string) => Promise<void>;
  onAnalyze: (snapshot: FlowSnapshot, context?: string) => Promise<string | null>;
  onOptimize: (snapshot: FlowSnapshot, context?: string) => Promise<string>;
  initialSnapshot?: Partial<FlowSnapshot>; 
  referenceContent?: string;
}

const FreezeDialog: React.FC<FreezeDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onAnalyze, 
  onOptimize, 
  initialSnapshot,
  referenceContent
}) => {
  const [formData, setFormData] = useState<FlowSnapshot>({
    mentalRam: '',
    logicSnapshot: '',
    state: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiQuestion, setAiQuestion] = useState<string | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        mentalRam: initialSnapshot?.mentalRam || '',
        logicSnapshot: initialSnapshot?.logicSnapshot || '',
        state: initialSnapshot?.state || ''
      });
      setAiQuestion(null);
    }
  }, [isOpen, initialSnapshot]);

  if (!isOpen) return null;

  const handleBlur = async () => {
    if (formData.mentalRam.length > 0 && formData.logicSnapshot.length > 0) {
        setIsAnalyzing(true);
        try {
            const question = await onAnalyze(formData, referenceContent);
            setAiQuestion(question);
        } finally {
            setIsAnalyzing(false);
        }
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
        // First optimize with AI to get the "Hardcore Site Archive"
        setIsOptimizing(true);
        const optimizedContent = await onOptimize(formData, referenceContent);
        await onSave(formData, optimizedContent);
        onClose();
    } catch (e) {
        console.error(e);
        alert('保存失败');
    } finally {
        setIsSaving(false);
        setIsOptimizing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-2xl w-full ${referenceContent ? 'max-w-4xl flex-col md:flex-row' : 'max-w-md flex-col'} flex max-h-[90vh] border-t-4 border-blue-400 overflow-hidden`}>
        
        {/* Left Side: Reference Content (Split View) */}
        {referenceContent && (
            <div className="flex-1 border-b md:border-b-0 md:border-r bg-gray-50 flex flex-col min-w-0 min-h-[200px] md:min-h-0">
                <div className="p-4 border-b bg-gray-100/50 flex items-center gap-2 text-gray-600 font-bold text-sm">
                    <MessageSquare size={16} /> 原笔记内容参考
                </div>
                <div className="p-6 overflow-y-auto">
                    <div className="prose prose-sm max-w-none text-gray-600 italic">
                        <ReactMarkdown>
                            {referenceContent}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>
        )}

        <div className={`flex flex-col ${referenceContent ? 'w-full md:w-96' : 'w-full'} min-w-0`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-blue-50/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                    <Snowflake size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800">心流冷冻舱</h2>
                    <p className="text-xs text-gray-500">保存当前上下文，以便稍后无缝重启。</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
                
                {/* AI Deep Questioning Prompt */}
                { (aiQuestion || isAnalyzing) && (
                    <div className="bg-amber-50 border border-amber-100 p-3 rounded-lg flex gap-3 animate-in fade-in slide-in-from-top-2">
                        <MessageSquare size={16} className="text-amber-500 shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-800">
                            {isAnalyzing ? (
                                <span className="flex items-center gap-2 italic">引导员正在思考背景... <Loader2 size={12} className="animate-spin" /></span>
                            ) : (
                                <>
                                    <span className="font-bold block mb-1">深度追问：</span>
                                    {aiQuestion}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Question 1: Mental RAM */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <Brain size={16} className="text-blue-500" />
                        思维内存 (Mental RAM)
                    </label>
                    <textarea 
                        className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[80px]"
                        placeholder="例如：我不确定这个 bug 是因为数据格式还是网络超时..."
                        value={formData.mentalRam}
                        onChange={e => setFormData(prev => ({...prev, mentalRam: e.target.value}))}
                        onBlur={handleBlur}
                    />
                </div>

                {/* Question 2: Logic Snapshot */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <Zap size={16} className="text-amber-500" />
                        逻辑快照 (Logic Snapshot)
                    </label>
                    <textarea 
                        className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 min-h-[60px]"
                        placeholder="例如：我决定重写 API 接口，因为旧的结构无法支持流式传输..."
                        value={formData.logicSnapshot}
                        onChange={e => setFormData(prev => ({...prev, logicSnapshot: e.target.value}))}
                        onBlur={handleBlur}
                    />
                </div>

                {/* Question 3: State */}
                <div>
                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                        <Activity size={16} className="text-green-500" />
                        下一步计划 (Next Step Plan)
                    </label>
                    <input 
                        type="text"
                        className="w-full text-sm border border-gray-300 rounded-lg p-3 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        placeholder="例如：先休息一下，然后去查阅 API 文档..."
                        value={formData.state}
                        onChange={e => setFormData(prev => ({...prev, state: e.target.value}))}
                    />
                </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end items-center gap-3">
              <div className="flex-1">
                 {isOptimizing && (
                     <div className="text-[10px] text-blue-500 flex items-center gap-1">
                         <Sparkles size={12} className="animate-pulse" /> AI 正在整理硬核存档...
                     </div>
                 )}
              </div>
              <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving || isOptimizing}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isSaving ? '冷冻中...' : <><Snowflake size={16} /> 立即冷冻</>}
              </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default FreezeDialog;
