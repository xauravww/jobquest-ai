'use client';

import React, { useState, useEffect } from 'react';
import { Cog, Lock, Link, Bot, Check, Plus, Trash2 } from 'lucide-react';
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
          setAiProvider('');
          setApiKey('');
          setApiUrl('');
          setModel('');
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
    <div className="ai-config-panel rounded-xl p-6 mb-8 bg-bg-card border border-border max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/20 rounded-lg">
            <Cog className="w-5 h-5 text-primary" />
          </div>
          <div className="text-xl font-semibold text-white">AI Provider Configuration</div>
        </div>
        <button
          onClick={() => setShowConfig(false)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-white hover:bg-bg-light rounded-lg transition-colors"
        >
          ×
        </button>
      </div>

      {/* Existing Configurations */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Your Configurations</h3>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add New Config
          </button>
        </div>

        {configs.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No AI configurations yet.</p>
            <p className="text-sm">Create your first configuration below.</p>
          </div>
        ) : (
          <>
            {configs.find(c => c.isActive) ? null : (
              <div className="mb-4 p-4 bg-yellow-600 text-yellow-100 rounded-lg text-center">
                No active AI configuration selected. Please select a configuration to activate it.
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {configs.map((config) => (
                <div
                  key={config._id}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    config.isActive
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-bg-light/50 hover:bg-bg-light'
                  }`}
                  onClick={() => handleSelectConfig(config._id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white capitalize">{config.provider}</span>
                      {config.isActive && <Check className="w-4 h-4 text-primary" />}
                    </div>
                    <span className="text-xs text-text-muted">
                      {new Date(config.lastSelectedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-sm text-text-muted">
                    <p>Model: {config.aiModel}</p>
                    {config.apiUrl && <p>URL: {config.apiUrl}</p>}
                    {config.apiKey && <p>API Key: ••••••••</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Create New Configuration Form */}
      {showCreateForm && (
        <div className="border-t border-border pt-6">
          <h4 className="text-lg font-semibold text-white mb-4">Create New Configuration</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Provider Selection */}
            <FormSelect
              label="AI Provider"
              value={aiProvider}
              onChange={setAiProvider}
              options={AI_PROVIDERS}
              required
            />

            {/* API Key (for Gemini) */}
            {requiresApiKey && (
              <FormInput
                label="API Key"
                value={apiKey}
                onChange={setApiKey}
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
                onChange={setApiUrl}
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
                onChange={setModel}
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
                onChange={setModel}
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
              <div className="p-4 bg-bg-light/50 rounded-lg border border-border/50">
                <h4 className="text-sm font-semibold text-white mb-2">Provider Information</h4>
                <div className="text-xs text-text-muted space-y-1">
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

          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="px-4 py-2 text-text-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateConfig}
              disabled={loading}
              className="bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 hover:scale-105"
            >
              {loading ? 'Creating...' : 'Create Configuration'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIProviderConfig;
