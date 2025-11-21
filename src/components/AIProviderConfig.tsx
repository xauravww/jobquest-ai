'use client';

import React, { useState, useEffect } from 'react';
import { Cog, Lock, Link, Bot, Check, Plus, Trash2, X } from 'lucide-react';
import { FormInput, FormSelect } from '@/components/ui/FormInput';
import toast from 'react-hot-toast';

const AI_PROVIDERS = [
  { label: 'LM Studio', value: 'lm-studio' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'Gemini', value: 'gemini' }
];

interface AIConfig {
  _id: string;
  provider: string;
  apiKey?: string;
  apiUrl?: string;
  aiModel: string;
  isActive: boolean;
  lastSelectedAt: string;
}

interface AIProviderConfigProps {
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
}

const AIProviderConfig = ({ showConfig, setShowConfig }: AIProviderConfigProps) => {
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state for creating/editing config
  const [aiProvider, setAiProvider] = useState('lm-studio');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:1234');
  const [model, setModel] = useState('local-model');

  // Fetch configs on modal open
  useEffect(() => {
    if (showConfig) {
      fetchConfigs();
    }
  }, [showConfig]);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/ai-config');
      if (response.ok) {
        const data = await response.json();
        setConfigs(data);
        // Prefill form with active config if exists
        const activeConfig = data.find((c: AIConfig) => c.isActive);
        if (activeConfig) {
          setAiProvider(activeConfig.provider);
          setApiKey(activeConfig.apiKey || '');
          setApiUrl(activeConfig.apiUrl || 'http://localhost:1234');
          setModel(activeConfig.aiModel);
        } else {
          // No active config, clear form and show message
          setAiProvider('lm-studio');
          setApiKey('');
          setApiUrl('http://localhost:1234');
          setModel('local-model');
        }
      }
    } catch (error) {
      console.error('Failed to fetch configs:', error);
      toast.error('Failed to load AI configurations');
    }
  };

  const handleSelectConfig = async (configId: string) => {
    try {
      await fetch(`/api/ai-config/${configId}/activate`, { method: 'PATCH' });
      await fetchConfigs(); // Refresh list
      toast.success('AI configuration activated');
    } catch (error) {
      console.error('Failed to activate config:', error);
      toast.error('Failed to activate configuration');
    }
  };

  const handleCreateConfig = async () => {
    if (!aiProvider || !model) {
      toast.error('Provider and model are required');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: aiProvider,
          apiKey: apiKey || undefined,
          apiUrl: apiUrl || undefined,
          aiModel: model
        })
      });

      if (response.ok) {
        await fetchConfigs();
        setShowCreateForm(false);
        resetForm();
        toast.success('AI configuration created');
      } else {
        throw new Error('Failed to create config');
      }
    } catch (error) {
      console.error('Failed to create config:', error);
      toast.error('Failed to create configuration');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAiProvider('lm-studio');
    setApiKey('');
    setApiUrl('http://localhost:1234');
    setModel('local-model');
  };

  // Update model default when aiProvider changes
  useEffect(() => {
    if (aiProvider === 'gemini') {
      setModel('gemini-2.0-flash');
    } else if (aiProvider === 'lm-studio' || aiProvider === 'ollama') {
      setModel('local-model');
    }
  }, [aiProvider]);

  const requiresApiKey = aiProvider === 'gemini';
  const requiresUrlAndModel = aiProvider === 'lm-studio' || aiProvider === 'ollama';

  if (!showConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-[var(--border-glass)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
              <Cog className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Provider Configuration</h2>
          </div>
          <button
            onClick={() => setShowConfig(false)}
            className="p-2 hover:bg-[var(--bg-glass)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Existing Configurations */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Your Configurations</h3>
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-black font-bold rounded-xl hover:bg-[var(--primary)]/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add New Config
              </button>
            </div>

            {configs.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[var(--border-glass)] rounded-xl bg-[var(--bg-deep)]/50">
                <Bot className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                <p className="text-[var(--text-muted)]">No AI configurations yet.</p>
                <p className="text-sm text-[var(--text-dim)]">Create your first configuration to enable AI features.</p>
              </div>
            ) : (
              <>
                {!configs.find(c => c.isActive) && (
                  <div className="mb-4 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] rounded-xl text-center font-medium">
                    No active AI configuration selected. Please select a configuration to activate it.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {configs.map((config) => (
                    <div
                      key={config._id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${config.isActive
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]'
                          : 'border-[var(--border-glass)] bg-[var(--bg-deep)] hover:border-[var(--primary)]/50 hover:bg-[var(--bg-surface)]'
                        }`}
                      onClick={() => handleSelectConfig(config._id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white capitalize">{config.provider}</span>
                          {config.isActive && (
                            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-[var(--success)]/20 text-[var(--success)] rounded-full border border-[var(--success)]/30">
                              <Check className="w-3 h-3" /> Active
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-[var(--text-dim)]">
                          {new Date(config.lastSelectedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--text-muted)] space-y-1">
                        <p><span className="text-[var(--text-dim)]">Model:</span> {config.aiModel}</p>
                        {config.apiUrl && <p><span className="text-[var(--text-dim)]">URL:</span> {config.apiUrl}</p>}
                        {config.apiKey && <p><span className="text-[var(--text-dim)]">API Key:</span> ••••••••</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Create New Configuration Form */}
          {showCreateForm && (
            <div className="border-t border-[var(--border-glass)] pt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <h4 className="text-lg font-semibold text-white mb-6">Create New Configuration</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AI Provider Selection */}
                <FormSelect
                  label="AI Provider"
                  value={aiProvider}
                  onChange={(e) => setAiProvider(e.target.value)}
                  options={AI_PROVIDERS}
                  required
                />

                {/* API Key (for Gemini) */}
                {requiresApiKey && (
                  <FormInput
                    label="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key"
                    icon={<Lock className="w-4 h-4" />}
                    type="password"
                    required
                  />
                )}

                {/* API URL (for LM Studio and Ollama) */}
                {requiresUrlAndModel && (
                  <FormInput
                    label="API URL"
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    placeholder="http://localhost:1234"
                    icon={<Link className="w-4 h-4" />}
                    required
                  />
                )}

                {/* Model Name */}
                {requiresUrlAndModel && (
                  <FormInput
                    label="Model Name"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="local-model"
                    icon={<Bot className="w-4 h-4" />}
                    required
                  />
                )}

                {/* Gemini Model Selection */}
                {aiProvider === 'gemini' && (
                  <FormSelect
                    label="Gemini Model"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    options={[
                      { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                      { label: 'Gemini Pro', value: 'gemini-pro' },
                      { label: 'Gemini Pro Vision', value: 'gemini-pro-vision' }
                    ]}
                    required
                  />
                )}

                {/* Info Section */}
                <div className="md:col-span-2">
                  <div className="p-4 bg-[var(--bg-deep)] rounded-xl border border-[var(--border-glass)]">
                    <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[var(--primary)]" /> Provider Information
                    </h4>
                    <div className="text-xs text-[var(--text-muted)] space-y-1 ml-6">
                      {aiProvider === 'lm-studio' && (
                        <>
                          <p>• LM Studio: Local AI server for running models like Llama, Mistral, etc.</p>
                          <p>• Default URL: http://localhost:1234</p>
                          <p>• No API key required - runs locally</p>
                        </>
                      )}
                      {aiProvider === 'ollama' && (
                        <>
                          <p>• Ollama: Local AI model runner</p>
                          <p>• Default URL: http://localhost:11434</p>
                          <p>• No API key required - runs locally</p>
                        </>
                      )}
                      {aiProvider === 'gemini' && (
                        <>
                          <p>• Google Gemini: Cloud AI service</p>
                          <p>• Requires API key from Google AI Studio</p>
                          <p>• Model will be set automatically (gemini-pro)</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-glass)] text-[var(--text-muted)] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateConfig}
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-[var(--primary)] text-black font-bold hover:bg-[var(--primary)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>}
                  {loading ? 'Creating...' : 'Create Configuration'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIProviderConfig;
