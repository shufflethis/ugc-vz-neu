/**
 * Dual AI provider adapter supporting both OpenRouter (sk-or-...) and OpenAI (sk-... / sk-proj-...).
 * Automatically detects the provider from the configured key prefix so existing environments
 * using either an OpenRouter key or an OpenAI key in OPENROUTER_API_KEY / OPENAI_API_KEY work seamlessly.
 */

export type AiProviderKind = 'openrouter' | 'openai';

export type ResolvedAiProvider = {
  provider: AiProviderKind;
  apiKey: string;
  baseUrl: string;
};

function cleanEnvKey(raw: string | undefined): string {
  return String(raw || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function resolveAiProvider(explicitApiKey?: string): ResolvedAiProvider | null {
  const candidates = [
    cleanEnvKey(explicitApiKey),
    cleanEnvKey(process.env.OPENROUTER_API_KEY),
    cleanEnvKey(process.env.OPENAI_API_KEY),
  ].filter(Boolean);

  if (candidates.length === 0) return null;

  // Prefer an explicit OpenRouter key if present, otherwise use OpenAI key when starting with sk-
  const openRouterKey = candidates.find((k) => k.startsWith('sk-or-'));
  if (openRouterKey) {
    return {
      provider: 'openrouter',
      apiKey: openRouterKey,
      baseUrl: 'https://openrouter.ai/api/v1',
    };
  }

  const firstKey = candidates[0];
  if (firstKey.startsWith('sk-')) {
    return {
      provider: 'openai',
      apiKey: firstKey,
      baseUrl: 'https://api.openai.com/v1',
    };
  }

  return {
    provider: 'openrouter',
    apiKey: firstKey,
    baseUrl: 'https://openrouter.ai/api/v1',
  };
}

export function isAiProviderConfigured(): boolean {
  return resolveAiProvider() !== null;
}

export function buildAiHeaders(
  resolved: ResolvedAiProvider,
  options: { title: string; requestId?: string; json?: boolean } = { title: 'UGC VZ' },
): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${resolved.apiKey}`,
  };
  if (options.json !== false) {
    headers['Content-Type'] = 'application/json';
  }
  if (resolved.provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://ugc-vz.de';
    headers['X-Title'] = options.title;
    if (options.requestId) headers['X-Request-ID'] = options.requestId;
  }
  return headers;
}

export function resolveEmbeddingModel(resolved: ResolvedAiProvider, configured?: string): string {
  const envConfigured = (configured || process.env.SEARCH_EMBEDDING_MODEL || '').trim();
  if (resolved.provider === 'openai') {
    if (!envConfigured) return 'text-embedding-3-small';
    if (envConfigured.startsWith('openai/')) return envConfigured.slice('openai/'.length);
    if (envConfigured.includes('/')) return 'text-embedding-3-small';
    return envConfigured;
  }
  // Default to baai/bge-m3 on OpenRouter: top multilingual/German 1024-dim model without OpenAI BYOK dependency.
  return envConfigured || 'baai/bge-m3';
}

export function resolveChatModels(
  resolved: ResolvedAiProvider,
  task: 'query_analysis' | 'rerank' | 'vision_analyzer' | 'voice_refine',
  overrideModel?: string,
): string[] {
  const override = (overrideModel || '').trim();
  if (resolved.provider === 'openai') {
    if (override) {
      if (override.startsWith('openai/')) return [override.slice('openai/'.length)];
      if (!override.includes('/')) return [override];
    }
    return ['gpt-4o-mini'];
  }

  if (override) return [override];
  if (task === 'query_analysis') {
    return ['google/gemini-2.5-flash-lite', 'deepseek/deepseek-v4-flash'];
  }
  if (task === 'rerank') {
    return ['google/gemini-2.5-flash-lite', 'google/gemini-2.5-flash'];
  }
  return ['google/gemini-2.5-flash'];
}

export function buildChatRequestBody(
  resolved: ResolvedAiProvider,
  input: {
    model: string;
    messages: Array<Record<string, unknown>>;
    temperature?: number;
    maxTokens?: number;
    expectJson?: boolean;
  },
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: input.model,
    messages: input.messages,
    temperature: input.temperature ?? 0.2,
    max_tokens: input.maxTokens ?? 600,
  };

  if (resolved.provider === 'openai') {
    if (input.expectJson) {
      body.response_format = { type: 'json_object' };
    }
  } else if (input.model.includes('deepseek')) {
    // DeepSeek V4 Flash on OpenRouter is a reasoning model: disable reasoning tokens for short JSON jobs.
    body.reasoning = { enabled: false };
  }

  return body;
}

/**
 * Transcribes a voice recording via OpenAI Whisper when using the OpenAI provider.
 */
export async function transcribeAudioWithOpenAI(
  resolved: ResolvedAiProvider,
  audio: { base64: string; format: 'webm' | 'mp4' | 'ogg' | 'wav' | 'mp3' },
  timeoutMs = 20_000,
): Promise<string> {
  const bytes = Buffer.from(audio.base64, 'base64');
  const mimeByFormat: Record<typeof audio.format, string> = {
    webm: 'audio/webm',
    mp4: 'audio/mp4',
    ogg: 'audio/ogg',
    wav: 'audio/wav',
    mp3: 'audio/mpeg',
  };
  const extByFormat: Record<typeof audio.format, string> = {
    webm: 'webm',
    mp4: 'm4a',
    ogg: 'ogg',
    wav: 'wav',
    mp3: 'mp3',
  };

  const form = new FormData();
  form.append('model', process.env.OPENAI_TRANSCRIBE_MODEL || 'whisper-1');
  form.append('language', 'de');
  form.append(
    'file',
    new Blob([bytes], { type: mimeByFormat[audio.format] }),
    `voice.${extByFormat[audio.format]}`,
  );

  const response = await fetch(`${resolved.baseUrl}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${resolved.apiKey}` },
    body: form,
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!response.ok) {
    throw new Error(`OpenAI audio transcription HTTP ${response.status}`);
  }

  const data = (await response.json()) as { text?: unknown };
  const text = typeof data?.text === 'string' ? data.text.trim() : '';
  if (!text) throw new Error('Empty audio transcription');
  return text;
}
