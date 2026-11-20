import { useState, useEffect } from 'react';
import { saveUserDocToCloud } from '../services/firebase';

export const PROVIDERS = {
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter (:free ao vivo & Uncensored)',
    models: [
      { id: 'nvidia/nemotron-3-ultra:free', name: 'NVIDIA Nemotron 3 Ultra 550B (:free • Melhor)' },
      { id: 'nvidia/nemotron-3.5-super-vl:free', name: 'NVIDIA Nemotron 3.5 Super 120B (:free)' },
      { id: 'nvidia/nemotron-3.5-lightning:free', name: 'NVIDIA Nemotron 3.5 Lightning (:free • Rápido)' },
      { id: 'thedrummer/rocinante-12b', name: 'Rocinante 12B (Pago Barato • 100% Uncensored)' },
      { id: 'thedrummer/unslopnemo-12b', name: 'UnslopNemo 12B (Pago Barato • Dark RP)' },
      { id: 'nothingiisreal/mn-celeste-12b', name: 'MN Celeste 12B (Pago Barato • Uncensored)' },
      { id: 'sao10k/l3.3-euryale-70b', name: 'Euryale 70B v3.3 (Pago • Ouro Roleplay NSFW)' },
      { id: 'gryphe/mythomax-l2-13b', name: 'MythoMax L2 13B (Pago Barato • Irrestrito)' },
      { id: 'openrouter/free', name: 'OpenRouter Free Router (Auto)' },
      { id: 'custom', name: 'Outro ID de modelo OpenRouter...' },
    ],
  },
  custom_endpoint: {
    id: 'custom_endpoint',
    name: 'Google Colab / KoboldCpp (100% Uncensored Grátis)',
    models: [{ id: 'koboldcpp', name: 'Modelo Carregado no Colab / KoboldCpp' }],
  },
  groq: {
    id: 'groq',
    name: 'Groq (Ultra-Rápido & Grátis)',
    models: [
      { id: 'moonshotai/kimi-k2-instruct', name: 'Kimi K2 Instruct (Mais Permissivo)' },
      { id: 'qwen/qwen3-32b', name: 'Qwen 3 32B (Rápido & Versátil)' },
      { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B Versatile' },
      { id: 'llama-3.1-8b-instant', name: 'Llama 3.1 8B Instant (Ideal Cronista)' },
    ],
  },
  gemini: {
    id: 'gemini',
    name: 'Google AI Studio (Gemini Grátis)',
    models: [
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash (Rápido & Grátis)' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro (Narrativa Densa)' },
    ],
  },
};

const DEFAULT_SETTINGS = {
  provider: 'openrouter',
  apiKey: '',
  model: 'nvidia/nemotron-3-ultra:free',
  customModel: '',
  customEndpointUrl: '',
  temperature: 0.9,
  chronicleEnabled: false,
  chronicleProvider: 'openrouter',
  chronicleApiKey: '',
  chronicleModel: 'nvidia/nemotron-3.5-lightning:free',
};

const NON_CHAT_REGEX =
  /(embed|rerank|whisper|tts|speech|audio|voice|image|flux|stable-diffusion|dall-e|moderation|guard|span-01)/i;

const RESTRICTED_REGEX =
  /(gemma|gpt-oss|llama-guard|claude|o1|o3|o4|ernie|baidu|glm-)/i;

const RP_FAMILY_REGEX =
  /(dolphin|hermes|rocinante|euryale|mythomax|mytho|lumimaid|magnum|midnight|celeste|unslop|unfiltered|uncensored|abliterated|roleplay)/i;

const RP_DESC_REGEX =
  /(roleplay|creative writing|uncensored|unfiltered|storytelling|fiction|interactive narrative)/i;

export async function fetchLiveOpenRouterFreeModels() {
  const res = await fetch('https://openrouter.ai/api/v1/models');
  if (!res.ok) throw new Error(`Falha ao consultar OpenRouter (${res.status})`);
  const json = await res.json();
  const list = Array.isArray(json?.data) ? json.data : [];

  return list
    .filter((m) => {
      const id = m.id || '';
      const name = m.name || '';
      const isFree =
        (Number(m.pricing?.prompt ?? -1) === 0 &&
          Number(m.pricing?.completion ?? -1) === 0) ||
        id.endsWith(':free');
      if (!isFree || id === 'openrouter/free') return false;
      if (NON_CHAT_REGEX.test(id) || NON_CHAT_REGEX.test(name)) return false;
      const outputMods = m.architecture?.output_modalities;
      if (Array.isArray(outputMods) && !outputMods.includes('text')) return false;
      return true;
    })
    .map((m) => {
      const id = m.id || '';
      const name = m.name || id;
      const desc = m.description || '';
      const isServerModerated = Boolean(m.top_provider?.is_moderated);
      const isRestrictedFamily = RESTRICTED_REGEX.test(id) || RESTRICTED_REGEX.test(name);
      const isRpFocused =
        !isServerModerated &&
        !isRestrictedFamily &&
        (RP_FAMILY_REGEX.test(id) || RP_FAMILY_REGEX.test(name) || RP_DESC_REGEX.test(desc));

      let tier = 1;
      let badge = '• Aberto';
      if (isServerModerated || isRestrictedFamily) {
        tier = 2;
        badge = isServerModerated ? '• Moderado (Servidor)' : '• Filtro Alto';
      } else if (isRpFocused) {
        tier = 0;
        badge = '★ Roleplay / Aberto';
      }

      const ctxK = m.context_length ? `${Math.round(m.context_length / 1000)}k` : '';
      return { id, name: `${name}${ctxK ? ` (${ctxK})` : ''} ${badge}`, tier };
    })
    .sort((a, b) => (a.tier !== b.tier ? a.tier - b.tier : a.name.localeCompare(b.name)));
}

export function useBYOK(uid) {
  const storageKey = uid ? `airpg_byok_${uid}` : 'airpg_byok';

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    } catch (e) {}
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      setSettings(saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS);
    } catch (e) {}
  }, [storageKey]);

  const updateSettings = (newSettings) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    try { localStorage.setItem(storageKey, JSON.stringify(merged)); } catch (e) {}
    if (uid) saveUserDocToCloud(uid, { byokSettings: merged });
  };

  const hydrateByokFromCloud = (cloudSettings) => {
    if (!cloudSettings || typeof cloudSettings !== 'object') return;
    const merged = { ...DEFAULT_SETTINGS, ...cloudSettings };
    setSettings(merged);
    try { localStorage.setItem(storageKey, JSON.stringify(merged)); } catch (e) {}
  };

  const activeModel =
    settings.model === 'custom' && settings.customModel?.trim()
      ? settings.customModel.trim()
      : settings.model;

  const isConfigured =
    settings.provider === 'custom_endpoint'
      ? Boolean(settings.customEndpointUrl?.trim())
      : Boolean(settings.apiKey?.trim());

  return { settings, updateSettings, hydrateByokFromCloud, activeModel, isConfigured };
}