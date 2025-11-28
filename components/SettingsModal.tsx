
import React, { useState, useEffect } from 'react';
import { X, Save, Server, Bot, HelpCircle, Database, Trash2, CheckCircle2 } from 'lucide-react';
import { AppSettings, AIConfig, WebDAVConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
  onClearTrash?: () => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onClearTrash }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'webdav' | 'data'>('ai');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  
  // Trash state
  const [trashStatus, setTrashStatus] = useState<'idle' | 'clearing' | 'cleared'>('idle');

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure defaults for Gemini if selected
      let finalSettings = { ...formData };
      if (finalSettings.ai.provider === 'gemini') {
        finalSettings.ai.url = 'https://generativelanguage.googleapis.com/v1beta'; 
        finalSettings.ai.model = 'gemini-2.5-flash'; 
      }
      
      await onSave(finalSettings);
      onClose();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiChange = (field: keyof AIConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      ai: { ...prev.ai, [field]: value }
    }));
  };

  const handleWebDavChange = (field: keyof WebDAVConfig, value: string) => {
    setFormData(prev => ({
      ...prev,
      webdav: { ...prev.webdav, [field]: value }
    }));
  };

  const handleClearTrash = async () => {
    if (!onClearTrash) return;
    if (trashStatus === 'cleared') return;
    
    // Simple state confirmation instead of window.confirm
    setTrashStatus('clearing');
    try {
        await onClearTrash();
        setTrashStatus('cleared');
        setTimeout(() => setTrashStatus('idle'), 3000);
    } catch (e) {
        setTrashStatus('idle');
        alert('清空失败');
    }
  };

  const isGemini = formData.ai.provider === 'gemini';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">设置</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors min-w-[80px] ${
              activeTab === 'ai' ? 'border-flomo-green text-flomo-green bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Bot size={16} />
            AI 配置
          </button>
          <button
            onClick={() => setActiveTab('webdav')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors min-w-[80px] ${
              activeTab === 'webdav' ? 'border-flomo-green text-flomo-green bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Server size={16} />
            同步
          </button>
          <button
            onClick={() => setActiveTab('data')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors min-w-[80px] ${
              activeTab === 'data' ? 'border-flomo-green text-flomo-green bg-white' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database size={16} />
            数据
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
               <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg mb-4 flex gap-2">
                 <HelpCircle size={14} className="mt-0.5 shrink-0" />
                 <div>
                   配置 AI Key 以启用智能洞察功能。
                   {isGemini && <div>Gemini 模式下仅需 API Key。</div>}
                 </div>
               </div>
               
               <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">服务提供商</label>
                <select 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                  value={formData.ai.provider}
                  onChange={(e) => handleAiChange('provider', e.target.value as 'gemini' | 'openai')}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (或兼容接口)</option>
                </select>
               </div>

               {/* Gemini Mode: Just API Key */}
               {isGemini && (
                 <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Gemini API Key</label>
                  <input 
                    type="password" 
                    className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                    value={formData.ai.apiKey}
                    onChange={(e) => handleAiChange('apiKey', e.target.value)}
                    placeholder="AIzaSy..."
                  />
                  <p className="text-[10px] text-gray-400 mt-1">默认使用 gemini-2.5-flash 模型</p>
                 </div>
               )}

               {/* OpenAI Mode: Full Config */}
               {!isGemini && (
                 <>
                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">API URL</label>
                    <input 
                      type="text" 
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                      value={formData.ai.url}
                      onChange={(e) => handleAiChange('url', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                   </div>

                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Model</label>
                    <input 
                      type="text" 
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                      value={formData.ai.model}
                      onChange={(e) => handleAiChange('model', e.target.value)}
                      placeholder="gpt-4o"
                    />
                   </div>

                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">API Key</label>
                    <input 
                      type="password" 
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                      value={formData.ai.apiKey}
                      onChange={(e) => handleAiChange('apiKey', e.target.value)}
                      placeholder="sk-..."
                    />
                   </div>
                 </>
               )}
            </div>
          )}

          {/* WebDAV Settings */}
          {activeTab === 'webdav' && (
            <div className="space-y-4">
              <div className="p-3 bg-orange-50 text-orange-700 text-xs rounded-lg mb-4">
                 启用 WebDAV 可备份您的数据。默认 URL 为当前域名下的 webdav-proxy。
               </div>

               <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">服务器地址 (URL)</label>
                <input 
                  type="text" 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                  value={formData.webdav.url}
                  onChange={(e) => handleWebDavChange('url', e.target.value)}
                />
               </div>

               <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">用户名</label>
                <input 
                  type="text" 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                  value={formData.webdav.username}
                  onChange={(e) => handleWebDavChange('username', e.target.value)}
                />
               </div>

               <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">密码</label>
                <input 
                  type="password" 
                  className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                  value={formData.webdav.password || ''}
                  onChange={(e) => handleWebDavChange('password', e.target.value)}
                />
               </div>
            </div>
          )}

          {/* Data Management */}
          {activeTab === 'data' && (
              <div className="space-y-6">
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center gap-2 text-red-700 font-bold mb-2">
                          <Trash2 size={18} />
                          <h3>废纸篓</h3>
                      </div>
                      <p className="text-xs text-red-600 mb-4 leading-relaxed">
                          已删除的笔记会保留 30 天，期间可以同步到云端（标记为删除）。
                          清空废纸篓将永久删除这些笔记和关联图片，不可恢复。
                      </p>
                      <button 
                        onClick={handleClearTrash}
                        disabled={trashStatus !== 'idle'}
                        className={`
                            w-full py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2
                            ${trashStatus === 'cleared' 
                                ? 'bg-green-600 text-white' 
                                : 'bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'}
                        `}
                      >
                          {trashStatus === 'idle' && '立即清空废纸篓'}
                          {trashStatus === 'clearing' && '清理中...'}
                          {trashStatus === 'cleared' && <><CheckCircle2 size={16} /> 已清理</>}
                      </button>
                  </div>
              </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 mr-2"
          >
            取消
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-flomo-green text-white text-sm font-medium rounded-lg hover:bg-flomo-hover flex items-center gap-2 disabled:opacity-50"
          >
            {isSaving ? '保存中...' : <><Save size={16} /> 保存</>}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;
