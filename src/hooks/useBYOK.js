import { useState, useEffect } from 'react';

const STORAGE_KEY = 'airpg_byok_settings';

export const DEFAULT_BYOK_SETTINGS = {
  activeProvider: 'openrouter',
  openrouter: {
    apiKey: '',
    model: 'nousresearch/hermes-3-llama-3.1-405b:free',
    baseUrl: 'https://openrouter.ai/api/v1',
  },
  groq: {
    apiKey: '',
    model: 'llama-3.3-70b-versatile',
    baseUrl: 'https://api.groq.com/openai/v1',
  },
  gemini: {
    apiKey: '',
    model: 'gemini-1.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com',
  },
};

export const POPULAR_MODELS = {
  openrouter: [
    { id: 'nousresearch/hermes-3-llama-3.1-405b:free', label: 'Hermes 3 405B (Free RP/Uncensored)' },
    { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Llama 3.3 70B (Free / Alta Capacidade)' },
    { id: 'mistralai/mistral-small-24b-instruct-2501:free', label: 'Mistral Small 24B (Free / Permissivo)' },
    { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free / Raciocínio Profundo)' },
    { id: 'google/gemini-2.0-flash-lite-preview-02-05:free', label: 'Gemini 2.0 Flash Lite (Free)' },
  ],
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile (Free Tier)' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant (Ultra-rápido)' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B (32k Context)' },
  ],
  gemini: [
    { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Gratuito / Rápido)' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro (Contexto Gigante)' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash (Preview)' },
  ],
};

export function useBYOK() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          ...DEFAULT_BYOK_SETTINGS,
          ...parsed,
          openrouter: { ...DEFAULT_BYOK_SETTINGS.openrouter, ...(parsed.openrouter || {}) },
          groq: { ...DEFAULT_BYOK_SETTINGS.groq, ...(parsed.groq || {}) },
          gemini: { ...DEFAULT_BYOK_SETTINGS.gemini, ...(parsed.gemini || {}) },
        };
      }
    } catch (e) {
      console.warn('Erro ao ler chaves do localStorage:', e);
    }
    return DEFAULT_BYOK_SETTINGS;
  });

  const saveSettings = (newSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }
  };

  const hasKey = (provider = settings.activeProvider) => {
    return Boolean(settings[provider]?.apiKey?.trim());
  };

  const getActiveConfig = () => {
    const provider = settings.activeProvider;
    return {
      provider,
      ...settings[provider],
      isReady: hasKey(provider),
    };
  };

  return {
    settings,
    saveSettings,
    hasKey,
    getActiveConfig,
    activeProvider: settings.activeProvider,
  };
}
