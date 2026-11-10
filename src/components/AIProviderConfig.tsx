'use client';

import React, { useState, useEffect } from 'react';
import { Cog, Lock, Link, Bot, Check, Plus, Trash2, X, Pencil, Activity, Loader2 } from 'lucide-react';
import { FormInput, FormSelect } from '@/components/ui/FormInput';
import Button from '@/components/ui/Button';
import { confirmAction } from '@/lib/confirm';
import toast from 'react-hot-toast';

const MAX_CONFIGS = 2;

const AI_PROVIDERS = [
  { label: 'OpenAI-compatible', value: 'openai-compatible' },
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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [cardTesting, setCardTesting] = useState<Record<string, boolean>>({});
  const [cardResults, setCardResults] = useState<Record<string, { ok: boolean; message: string }>>({});

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

  const handleEditConfig = (config: AIConfig) => {
    setAiProvider(config.provider);
    setApiKey(config.apiKey || '');
    setApiUrl(config.apiUrl || 'http://localhost:1234');
    setModel(config.aiModel);
    setEditingId(config._id);
    setShowCreateForm(true);
  };

  const handleDeleteConfig = async (configId: string) => {
    confirmAction({
      title: 'Delete AI configuration?',
      content: 'This will remove the saved configuration.',
      onOk: async () => {
        const response = await fetch(`/api/ai-config/${configId}`, { method: 'DELETE' });
        if (response.ok) {
          await fetchConfigs();
          if (editingId === configId) {
            setShowCreateForm(false);
            setEditingId(null);
            resetForm();
          }
          toast.success('AI configuration deleted');
        } else {
          toast.error('Failed to delete configuration');
        }
      },
    });
  };

  const handleTestCard = async (config: AIConfig) => {
    setCardTesting((prev) => ({ ...prev, [config._id]: true }));
    setCardResults((prev) => {
      const next = { ...prev };
      delete next[config._id];
      return next;
    });

    try {
      const response = await fetch('/api/ai-config/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: config.provider,
          apiUrl: config.apiUrl,
          apiKey: config.apiKey,
          model: config.aiModel,
        }),
      });
      const data = await response.json();
      setCardResults((prev) => ({
        ...prev,
        [config._id]: {
          ok: !!data.ok,
          message: data.error || (data.reply ? 'Connected' : 'No response'),
        },
      }));
    } catch {
      setCardResults((prev) => ({
        ...prev,
        [config._id]: { ok: false, message: 'Connection failed' },
      }));
    } finally {
      setCardTesting((prev) => ({ ...prev, [config._id]: false }));
    }
  };

  const handleSaveConfig = async () => {
    if (!aiProvider || !model) {
      toast.error('Provider and model are required');
      return;
    }
    if (!editingId && configs.length >= MAX_CONFIGS) {
      toast.error(`Maximum of ${MAX_CONFIGS} AI configurations allowed`);
      return;
    }

    setLoading(true);
    try {
      const isEditing = Boolean(editingId);
      const response = await fetch(isEditing ? `/api/ai-config/${editingId}` : '/api/ai-config', {
        method: isEditing ? 'PUT' : 'POST',
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
        toast.success(isEditing ? 'AI configuration updated' : 'AI configuration created');
      } else {
        throw new Error('Failed to save config');
      }
    } catch (error) {
      console.error('Failed to save config:', error);
      toast.error(editingId ? 'Failed to update configuration' : 'Failed to create configuration');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setAiProvider('lm-studio');
    setApiKey('');
    setApiUrl('http://localhost:1234');
    setModel('local-model');
    setEditingId(null);
  };

  // Update model default when aiProvider changes
  useEffect(() => {
    if (aiProvider === 'gemini') {
      setModel('gemini-2.0-flash');
    } else if (aiProvider === 'lm-studio' || aiProvider === 'ollama' || aiProvider === 'openai-compatible') {
      setModel('local-model');
    }
  }, [aiProvider]);

  const requiresApiKey = aiProvider === 'gemini';
  const supportsApiKey = aiProvider === 'openai-compatible';
  const requiresUrlAndModel = aiProvider === 'lm-studio' || aiProvider === 'ollama' || aiProvider === 'openai-compatible';

  if (!showConfig) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl bg-[var(--bg-surface)] border border-[var(--border-glass)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-[var(--border-glass)] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-[var(--primary)]/20 rounded-xl border border-[var(--primary)]/30">
              <Cog className="w-6 h-6 text-[var(--primary)]" />
            </div>
            <h2 className="text-xl font-bold text-white">AI Provider Configuration</h2>
          </div>
          <Button
            variant="ghost"
            onClick={() => setShowConfig(false)}
            aria-label="Close configuration"
            className="p-2 hover:bg-[var(--bg-glass)] rounded-lg transition-colors text-[var(--text-muted)] hover:text-white"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {!showCreateForm && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Your Configurations</h3>
              {configs.length < MAX_CONFIGS && (
                <Button
                  variant="primary"
                  onClick={() => { resetForm(); setShowCreateForm(true); }}
                >
                  <Plus className="w-4 h-4" />
                  Add New Config
                </Button>
              )}
            </div>

            {configs.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-[var(--border-glass)] rounded-xl bg-[var(--bg-deep)]/50">
                <Bot className="w-12 h-12 mx-auto mb-3 text-[var(--text-muted)] opacity-50" />
                <p className="text-[var(--text-muted)]">No AI configurations yet.</p>
              </div>
            ) : (
              <>
                {!configs.find(c => c.isActive) && (
                  <div className="mb-4 p-4 bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-[var(--warning)] rounded-xl text-center font-medium">
                    No active configuration selected.
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {configs.map((config) => (
                    <div
                      key={config._id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${config.isActive
                          ? 'border-[var(--primary)] bg-[var(--primary)]/10'
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
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5"
                            aria-label="Edit configuration"
                            onClick={(e) => { e.stopPropagation(); handleEditConfig(config); }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1.5 text-[var(--danger)]"
                            aria-label="Delete configuration"
                            onClick={(e) => { e.stopPropagation(); handleDeleteConfig(config._id); }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-sm text-[var(--text-muted)] space-y-1">
                        <p><span className="text-[var(--text-dim)]">Model:</span> {config.aiModel}</p>
                        {config.apiUrl && <p><span className="text-[var(--text-dim)]">Base:</span> {config.apiUrl}</p>}
                        {config.apiKey && <p><span className="text-[var(--text-dim)]">API Key:</span> ••••••••</p>}
                        <p className="text-xs text-[var(--text-dim)] pt-1">
                          Selected {new Date(config.lastSelectedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-glass)]">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1.5"
                          aria-label="Test connection"
                          disabled={cardTesting[config._id]}
                          onClick={(e) => { e.stopPropagation(); handleTestCard(config); }}
                        >
                          {cardTesting[config._id] ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Activity className="w-4 h-4" />
                          )}
                          <span className="text-xs ml-1.5">Test</span>
                        </Button>
                        {cardResults[config._id] && (
                          <span className={`flex items-center gap-1.5 text-xs ${cardResults[config._id].ok ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                            <span className={`w-2 h-2 rounded-full ${cardResults[config._id].ok ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                            {cardResults[config._id].message}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          )}

          {/* Create New Configuration Form */}
          {showCreateForm && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{editingId ? 'Edit Configuration' : 'Create New Configuration'}</h4>
                <Button
                  variant="ghost"
                  onClick={() => { setShowCreateForm(false); resetForm(); }}
                  aria-label="Back to configurations"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* AI Provider Selection */}
                <FormSelect
                  label="AI Provider"
                  value={aiProvider}
                  onChange={(v) => setAiProvider(v)}
                  options={AI_PROVIDERS}
                  required
                />

                {/* API Key (for Gemini) */}
                {(requiresApiKey || supportsApiKey) && (
                  <FormInput
                    label="API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={requiresApiKey ? 'Gemini API key' : 'Optional — for hosted endpoints'}
                    icon={<Lock className="w-4 h-4" />}
                    type="password"
                    required={requiresApiKey}
                  />
                )}

                {/* Base URL (for LM Studio, Ollama, OpenAI-compatible) */}
                {requiresUrlAndModel && (
                  <FormInput
                    label="Base URL"
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
                    onChange={(v) => setModel(v)}
                    options={[
                      { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
                      { label: 'Gemini Pro', value: 'gemini-pro' },
                      { label: 'Gemini Pro Vision', value: 'gemini-pro-vision' }
                    ]}
                    required
                  />
                )}
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleSaveConfig}
                  disabled={loading}
                  isLoading={loading}
                >
                  {editingId ? 'Save Changes' : 'Create Configuration'}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIProviderConfig;
