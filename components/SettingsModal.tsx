
import React, { useState, useEffect } from 'react';
import { X, Save, Server, Bot, HelpCircle } from 'lucide-react';
import { AppSettings, AIConfig, WebDAVConfig } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => Promise<void>;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'webdav'>('ai');
  const [formData, setFormData] = useState<AppSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(settings);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProviderChange = (provider: 'gemini' | 'openai') => {
    setFormData(prev => ({
      ...prev,
      ai: { ...prev.ai, provider }
    }));
  };

  const handleOpenAIChange = (field: keyof AIConfig['openai'], value: string) => {
    setFormData(prev => ({
      ...prev,
      ai: { 
        ...prev.ai, 
        openai: { ...prev.ai.openai, [field]: value }
      }
    }));
  };

  const handleGeminiChange = (field: keyof AIConfig['gemini'], value: string) => {
    setFormData(prev => ({
      ...prev,
      ai: { 
        ...prev.ai, 
        gemini: { ...prev.ai.gemini, [field]: value }
      }
    }));
  };

  const handlePromptChange = (field: 'dailyPrompt' | 'insightPrompt', value: string) => {
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
                  onChange={(e) => handleProviderChange(e.target.value as 'gemini' | 'openai')}
                >
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI (或兼容接口)</option>
                </select>
               </div>

               {/* Gemini Mode */}
               {isGemini && (
                 <div className="space-y-4">
                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="gemini-key">Gemini API Key</label>
                    <input
                      id="gemini-key"
                      type="password"
                      value={formData.ai.gemini.apiKey || ''}
                      onChange={(e) => handleGeminiChange('apiKey', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="AIzaSy..."
                    />
                   </div>
                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5" htmlFor="gemini-model">Gemini Model</label>
                    <input
                      id="gemini-model"
                      type="text"
                      value={formData.ai.gemini.model || ''}
                      onChange={(e) => handleGeminiChange('model', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="gemini-3-flash-preview"
                    />
                    <p className="text-[10px] text-gray-400 mt-1">例如: gemini-1.5-flash, gemini-1.5-pro</p>
                   </div>
                 </div>
               )}

               {/* OpenAI Mode */}
               {!isGemini && (
                 <>
                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">API URL</label>
                    <input 
                      type="text" 
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                      value={formData.ai.openai.url || ''}
                      onChange={(e) => handleOpenAIChange('url', e.target.value)}
                      placeholder="https://api.openai.com/v1"
                    />
                   </div>

                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Model</label>
                    <input 
                      type="text" 
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                      value={formData.ai.openai.model || ''}
                      onChange={(e) => handleOpenAIChange('model', e.target.value)}
                      placeholder="gpt-4o"
                    />
                   </div>

                   <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">API Key</label>
                    <input 
                      type="password" 
                      className="w-full text-sm border border-gray-300 rounded-lg p-2.5 outline-none focus:border-flomo-green"
                      value={formData.ai.openai.apiKey || ''}
                      onChange={(e) => handleOpenAIChange('apiKey', e.target.value)}
                      placeholder="sk-..."
                    />
                   </div>
                 </>
               )}

               <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-xs font-bold text-gray-700 mb-2">自定义提示词 (Prompts)</h3>
                  
                  <div className="mb-3">
                    <label className="block text-[10px] text-gray-500 mb-1">每日总结提示词</label>
                    <textarea 
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:border-flomo-green min-h-[60px]"
                      value={formData.ai.dailyPrompt || ''}
                      onChange={(e) => handlePromptChange('dailyPrompt', e.target.value)}
                      placeholder="自定义每日总结的 Prompt..."
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] text-gray-500 mb-1">AI 洞察提示词</label>
                    <textarea 
                      className="w-full text-xs border border-gray-300 rounded-lg p-2 outline-none focus:border-flomo-green min-h-[60px]"
                      value={formData.ai.insightPrompt || ''}
                      onChange={(e) => handlePromptChange('insightPrompt', e.target.value)}
                      placeholder="自定义随机洞察的 Prompt..."
                    />
                  </div>
               </div>
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
