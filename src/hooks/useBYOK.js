import { useState, useEffect } from 'react';
import { saveUserDocToCloud } from '../services/firebase';

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

function mergeSettings(raw) {
  return {
    ...DEFAULT_BYOK_SETTINGS,
    ...(raw || {}),
    openrouter: { ...DEFAULT_BYOK_SETTINGS.openrouter, ...(raw?.openrouter || {}) },
    groq: { ...DEFAULT_BYOK_SETTINGS.groq, ...(raw?.groq || {}) },
    gemini: { ...DEFAULT_BYOK_SETTINGS.gemini, ...(raw?.gemini || {}) },
  };
}

export function useBYOK(uid) {
  const storageKey = uid ? `airpg_byok_settings_${uid}` : 'airpg_byok_settings';

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return mergeSettings(JSON.parse(stored));
    } catch (e) {
      console.warn('Erro ao ler chaves do localStorage:', e);
    }
    return DEFAULT_BYOK_SETTINGS;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setSettings(stored ? mergeSettings(JSON.parse(stored)) : DEFAULT_BYOK_SETTINGS);
    } catch (e) {
      setSettings(DEFAULT_BYOK_SETTINGS);
    }
  }, [storageKey]);

  const hydrateSettingsFromCloud = (cloudSettings) => {
    if (!cloudSettings) return;
    const merged = mergeSettings(cloudSettings);
    setSettings(merged);
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch (e) {}
  };

  const saveSettings = (newSettings) => {
    const merged = mergeSettings(newSettings);
    setSettings(merged);
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch (e) {
      console.error('Falha ao salvar no localStorage:', e);
    }
    if (uid) {
      saveUserDocToCloud(uid, { byokSettings: merged });
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
    hydrateSettingsFromCloud,
    hasKey,
    getActiveConfig,
    activeProvider: settings.activeProvider,
  };
}