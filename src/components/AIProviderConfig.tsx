'use client';

import React, { useState, useEffect } from 'react';
import { Cog, Lock, Link, Bot } from 'lucide-react';
import { FormInput, FormSelect } from '@/components/ui/FormInput';

const AI_PROVIDERS = [
  { label: 'LM Studio', value: 'lm-studio' },
  { label: 'Ollama', value: 'ollama' },
  { label: 'Gemini', value: 'gemini' }
];

interface AIProviderConfigProps {
  showConfig: boolean;
  setShowConfig: (show: boolean) => void;
}

const AIProviderConfig = ({ showConfig, setShowConfig }: AIProviderConfigProps) => {
  const [aiProvider, setAiProvider] = useState('lm-studio');
  const [apiKey, setApiKey] = useState('');
  const [apiUrl, setApiUrl] = useState('http://localhost:1234');
  const [model, setModel] = useState('local-model');

  // Load saved AI config from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConfig = localStorage.getItem('ai-provider-config');
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig);
          if (config.provider) setAiProvider(config.provider);
          if (config.apiKey) setApiKey(config.apiKey);
          if (config.apiUrl) setApiUrl(config.apiUrl);
          if (config.model) setModel(config.model);
        } catch (e) {
          console.warn('Failed to parse saved AI config');
        }
      }
    }
  }, []);

  // Save AI config to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const config = { provider: aiProvider, apiKey, apiUrl, model, enabled: true };
      localStorage.setItem('ai-provider-config', JSON.stringify(config));
    }
  }, [aiProvider, apiKey, apiUrl, model]);

  const requiresApiKey = aiProvider === 'gemini';
  const requiresUrlAndModel = aiProvider === 'lm-studio' || aiProvider === 'ollama';

  const handleSaveConfig = () => {
    const config = { provider: aiProvider, apiKey, apiUrl, model, enabled: true };
    localStorage.setItem('ai-provider-config', JSON.stringify(config));
    console.log('AI config saved:', config);
  };

  if (!showConfig) return null;

  return (
    <div className="ai-config-panel rounded-xl p-6 mb-8 bg-bg-card border border-border">
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
              { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash-exp' },
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

      <div className="flex justify-end mt-6">
        <button
          onClick={handleSaveConfig}
          className="bg-green-600 hover:bg-green-500 text-white font-semibold py-2 px-6 rounded-lg transition-all duration-200 hover:scale-105"
        >
          Save Configuration
        </button>
      </div>
    </div>
  );
};

export default AIProviderConfig;
