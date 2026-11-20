import { useState, useEffect } from 'react';
import { saveUserDocToCloud } from '../services/firebase';

export const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (Roleplay / :free)',
    models: [
      { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 70B (:free)' },
      { id: 'mistralai/mistral-small-3.1-24b-instruct:free', name: 'Mistral Small 3.1 24B (:free)' },
      { id: 'nousresearch/hermes-3-llama-3.1-405b:free', name: 'Hermes 3 405B (:free)' },
      { id: 'google/gemma-3-27b-it:free', name: 'Gemma 3 27B (:free)' },
      { id: 'deepseek/deepseek-chat-v3-0324:free', name: 'DeepSeek V3 (:free)' },
      { id: 'custom', name: 'Outro ID de modelo OpenRouter...' },
    ],
  },
  groq: {
    id: 'groq',
    name: 'Groq (Ultra-Rápido / Gratuito)',
    models: [
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile (Grátis)' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Econômico)' },
      { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
      { id: 'custom', name: 'Outro ID de modelo Groq...' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini (AI Studio Grátis)',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Grátis / Rápido)' },
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash (Grátis)' },
      { id: 'custom', name: 'Outro ID de modelo Gemini...' },
    ],
  },
};

const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  apiKey: '',
  model: 'meta-llama/llama-3.3-70b-instruct:free',
  customModel: '',
  temperature: 0.85,
  // Modelo secundário opcional para compactar The Chronicle sem gastar cota do principal
  chronicleEnabled: false,
  chronicleProvider: 'groq',
  chronicleApiKey: '',
  chronicleModel: 'llama-3.1-8b-instant',
};

export function useBYOK(uid) {
  const storageKey = uid ? `airpg_byok_settings_${uid}` : 'airpg_byok_settings';

  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setSettings(stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS);
    } catch (e) {}
  }, [storageKey]);

  const updateSettings = (newValues) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newValues };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      if (uid) {
        saveUserDocToCloud(uid, { byokSettings: updated });
      }
      return updated;
    });
  };

  const hydrateByokFromCloud = (cloudSettings) => {
    if (!cloudSettings || typeof cloudSettings !== 'object') return;
    setSettings((prev) => {
      const merged = { ...DEFAULT_SETTINGS, ...prev, ...cloudSettings };
      try {
        localStorage.setItem(storageKey, JSON.stringify(merged));
      } catch (e) {}
      return merged;
    });
  };

  const activeModel =
    settings.model === 'custom' && settings.customModel?.trim()
      ? settings.customModel.trim()
      : settings.model;

  return {
    settings,
    updateSettings,
    hydrateByokFromCloud,
    activeModel,
    isConfigured: Boolean(settings.apiKey && settings.apiKey.trim().length > 5),
  };
}