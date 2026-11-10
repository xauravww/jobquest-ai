import dbConnect from '@/lib/mongodb';
import AIConfig from '@/models/AIConfig';

export interface ResolvedAIConfig {
  provider: string;
  apiUrl: string;
  model: string;
  apiKey: string;
}

const DEFAULT_CONFIG: ResolvedAIConfig = {
  provider: 'lm-studio',
  apiUrl: 'http://localhost:1234',
  model: 'local-model',
  apiKey: '',
};

/**
 * Resolve the AI config that should be used for a user.
 * Priority:
 *   1. The active AIConfig (isActive) — the provider the user selected.
 *   2. The most recently used AIConfig (lastSelectedAt), so the last config
 *      the user worked with is used even if not flagged active.
 *   3. Fallback to the user's stored aiConfig.
 *   4. Defaults.
 */
export async function resolveAIConfig(userId: string, userAiConfig?: {
  provider?: string;
  apiUrl?: string;
  model?: string;
  apiKey?: string;
}): Promise<ResolvedAIConfig> {
  await dbConnect();

  const active = await AIConfig.findOne({ userId, isActive: true });
  if (active) {
    return {
      provider: active.provider,
      apiUrl: active.apiUrl || '',
      model: active.aiModel,
      apiKey: active.apiKey || '',
    };
  }

  const latest = await AIConfig.findOne({ userId }).sort({ lastSelectedAt: -1 });
  if (latest) {
    return {
      provider: latest.provider,
      apiUrl: latest.apiUrl || '',
      model: latest.aiModel,
      apiKey: latest.apiKey || '',
    };
  }

  if (userAiConfig?.provider) {
    return {
      provider: userAiConfig.provider,
      apiUrl: userAiConfig.apiUrl || '',
      model: userAiConfig.model || '',
      apiKey: userAiConfig.apiKey || '',
    };
  }

  return { ...DEFAULT_CONFIG };
}
