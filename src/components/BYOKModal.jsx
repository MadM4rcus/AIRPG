import { useState, useEffect } from 'react';
import {
  X,
  Key,
  Check,
  Sparkles,
  ScrollText,
  ExternalLink,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
} from 'lucide-react';
import { PROVIDERS, fetchLiveOpenRouterFreeModels } from '../hooks/useBYOK';

const PROVIDER_GUIDES = {
  openrouter: {
    title: 'Como pegar sua chave gratuita no OpenRouter',
    url: 'https://openrouter.ai/settings/keys',
    urlLabel: 'openrouter.ai/settings/keys',
    steps: [
      'Clique no link acima e faça login com sua conta Google ou e-mail.',
      'Clique em "Create API Key" e copie a chave (começa com sk-or-v1-...).',
      'Vá em openrouter.ai/settings/privacy e ative "Enable free endpoints that may train on inputs".',
      'Use "Buscar :free ao vivo" abaixo e escolha NVIDIA Nemotron 3 Ultra (free).',
    ],
  },
  custom_endpoint: {
    title: 'Como rodar IA 100% Uncensored grátis no Google Colab (GPU T4)',
    url: 'https://colab.research.google.com/github/LostRuins/koboldcpp/blob/concedo/colab.ipynb',
    urlLabel: 'Abrir Notebook KoboldCpp no Google Colab',
    steps: [
      'O Google Colab empresta uma placa de vídeo (GPU T4) de graça na nuvem — não pesa nada no seu PC ou celular.',
      'Abra o link acima, escolha um modelo uncensored (ex: Rocinante-12B ou MythoMax-13B) na lista do notebook e clique no Play (▶).',
      'Após ~2 minutos carregando, o Colab vai gerar um link público terminando em .trycloudflare.com.',
      'Copie esse link (.trycloudflare.com), cole no campo "URL do Túnel" abaixo e salve!',
    ],
  },
  groq: {
    title: 'Como pegar sua chave gratuita no Groq (Ultra-Rápido)',
    url: 'https://console.groq.com/keys',
    urlLabel: 'console.groq.com/keys',
    steps: [
      'Acesse console.groq.com/keys e entre com sua conta Google (100% gratuito).',
      'Clique em "Create API Key", digite um nome e copie a chave (gsk_...).',
      'Cole abaixo e selecione Kimi K2 ou Qwen 3 32B.',
    ],
  },
  gemini: {
    title: 'Como pegar sua chave gratuita no Google AI Studio',
    url: 'https://aistudio.google.com/apikey',
    urlLabel: 'aistudio.google.com/apikey',
    steps: [
      'Acesse aistudio.google.com/apikey logado na sua conta Gmail.',
      'Clique em "Create API key" e copie o código (AIza...).',
      'Cole abaixo e escolha Gemini 2.5 Flash.',
    ],
  },
};

const LIVE_CACHE_KEY = 'airpg_openrouter_live_free_v2';

export default function BYOKModal({ isOpen, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings);
  const [showGuide, setShowGuide] = useState(!settings.apiKey && !settings.customEndpointUrl);

  const [liveFreeModels, setLiveFreeModels] = useState(() => {
    try {
      const cached = localStorage.getItem(LIVE_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchStatus, setFetchStatus] = useState('');
  const [modelSearch, setModelSearch] = useState('');

  useEffect(() => {
    setForm(settings);
    if (!settings.apiKey && !settings.customEndpointUrl) setShowGuide(true);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const currentProvider = PROVIDERS[form.provider] || PROVIDERS.openrouter;
  const currentGuide = PROVIDER_GUIDES[form.provider] || PROVIDER_GUIDES.openrouter;
  const chronicleProvider = PROVIDERS[form.chronicleProvider] || PROVIDERS.openrouter;

  const handleFetchLiveModels = async () => {
    setIsFetchingModels(true);
    setFetchStatus('');
    try {
      const models = await fetchLiveOpenRouterFreeModels();
      setLiveFreeModels(models);
      try {
        localStorage.setItem(LIVE_CACHE_KEY, JSON.stringify(models));
      } catch (e) {}

      if (models.length > 0) {
        setFetchStatus(`${models.length} modelos :free de chat ativos encontrados!`);
        const stillExists =
          models.some((m) => m.id === form.model) ||
          PROVIDERS.openrouter.models.some((m) => m.id === form.model);
        if (!stillExists) {
          setForm((prev) => ({ ...prev, model: models[0].id }));
        }
      } else {
        setFetchStatus('Nenhum modelo :free encontrado agora.');
      }
    } catch (err) {
      setFetchStatus(err.message || 'Erro ao buscar modelos.');
    } finally {
      setIsFetchingModels(false);
    }
  };

  const getOpenRouterOptions = () => {
    const paidAndFallback = PROVIDERS.openrouter.models.filter(
      (m) => !m.id.endsWith(':free')
    );

    const baseFree =
      liveFreeModels.length > 0
        ? liveFreeModels
        : PROVIDERS.openrouter.models.filter((m) => m.id.endsWith(':free'));

    const all = [...baseFree, ...paidAndFallback];
    if (!modelSearch.trim()) return all;

    const q = modelSearch.toLowerCase();
    return all.filter(
      (m) =>
        m.id === 'custom' ||
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q)
    );
  };

  const primaryOptions =
    form.provider === 'openrouter'
      ? getOpenRouterOptions()
      : currentProvider.models;

  const chronicleOptions =
    form.chronicleProvider === 'openrouter'
      ? getOpenRouterOptions().filter((m) => m.id !== 'custom')
      : chronicleProvider.models;

  const handleProviderChange = (newProviderId) => {
    const prov = PROVIDERS[newProviderId];
    const defaultModel =
      newProviderId === 'openrouter' && liveFreeModels.length > 0
        ? liveFreeModels[0].id
        : prov.models[0].id;

    setForm({
      ...form,
      provider: newProviderId,
      model: defaultModel,
    });
    if (newProviderId === 'custom_endpoint') {
      setShowGuide(true);
    }
  };

  const handleChronicleProviderChange = (newProviderId) => {
    const prov = PROVIDERS[newProviderId];
    const defaultChronicleModel =
      newProviderId === 'openrouter' && liveFreeModels.length > 0
        ? liveFreeModels[liveFreeModels.length - 1]?.id || liveFreeModels[0].id
        : prov.models[prov.models.length - 1]?.id || prov.models[0].id;

    setForm({
      ...form,
      chronicleProvider: newProviderId,
      chronicleModel: defaultChronicleModel,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92dvh] flex flex-col">
        <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50 shrink-0">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm text-zinc-100">
              Configurar Chave de IA (BYOK)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300">
              1. Escolha o Provedor
            </label>
            <select
              value={form.provider}
              onChange={(e) => handleProviderChange(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
            >
              {Object.values(PROVIDERS).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowGuide((prev) => !prev)}
              className="w-full px-3.5 py-2.5 flex items-center justify-between text-left text-xs font-bold text-amber-300 hover:bg-amber-950/30 transition"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{currentGuide.title}</span>
              </span>
              {showGuide ? (
                <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-amber-400 shrink-0" />
              )}
            </button>

            {showGuide && (
              <div className="px-3.5 pb-3.5 pt-1 space-y-2.5 border-t border-amber-500/20 text-[11px] text-zinc-300">
                <a
                  href={currentGuide.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition shadow"
                >
                  <span>{currentGuide.urlLabel}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <ol className="list-decimal list-inside space-y-1 text-zinc-300 leading-relaxed">
                  {currentGuide.steps.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {form.provider === 'custom_endpoint' ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                2. URL do Túnel (Google Colab / KoboldCpp)
              </label>
              <input
                type="url"
                value={form.customEndpointUrl || ''}
                onChange={(e) =>
                  setForm({ ...form, customEndpointUrl: e.target.value })
                }
                placeholder="https://algo-aleatorio.trycloudflare.com"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
              <p className="text-[10px] text-zinc-400">
                Não precisa de API Key para KoboldCpp/Colab (deixe em branco).
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>2. Cole sua API Key</span>
                <span className="text-[10px] text-emerald-400 font-normal">
                  Sincronizada na sua conta
                </span>
              </label>
              <input
                type="password"
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                placeholder={
                  form.provider === 'openrouter'
                    ? 'sk-or-v1-...'
                    : form.provider === 'groq'
                    ? 'gsk_...'
                    : 'AIza...'
                }
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          {form.provider === 'openrouter' && (
            <div className="bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-zinc-300">
                  Radar de Modelos :free Ativos
                </span>
                <button
                  type="button"
                  onClick={handleFetchLiveModels}
                  disabled={isFetchingModels}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold transition disabled:opacity-50"
                >
                  <RefreshCw
                    className={`w-3 h-3 ${isFetchingModels ? 'animate-spin' : ''}`}
                  />
                  <span>
                    {isFetchingModels ? 'Buscando...' : 'Buscar :free ao vivo'}
                  </span>
                </button>
              </div>

              {fetchStatus && (
                <p className="text-[10px] text-emerald-400 font-medium">
                  {fetchStatus}
                </p>
              )}

              <div className="relative">
                <input
                  type="text"
                  value={modelSearch}
                  onChange={(e) => setModelSearch(e.target.value)}
                  placeholder="Filtrar lista (ex: nemotron, rocinante, unslop)..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-7 pr-2.5 py-1.5 text-[11px] text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
              </div>
            </div>
          )}

          {form.provider !== 'custom_endpoint' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
                <span>3. Modelo Narrador Principal</span>
                {form.provider === 'openrouter' && liveFreeModels.length > 0 && (
                  <span className="text-[10px] text-emerald-400">
                    {liveFreeModels.length} :free carregados
                  </span>
                )}
              </label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2.5 text-xs text-zinc-100 focus:outline-none focus:border-amber-500"
              >
                {primaryOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {form.provider === 'openrouter' && (
                <p className="text-[10px] text-zinc-500 font-mono truncate">
                  ID: {form.model === 'custom' ? form.customModel || '...' : form.model}
                </p>
              )}
            </div>
          )}

          {form.model === 'custom' && form.provider === 'openrouter' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-300">
                Slug do Modelo no OpenRouter
              </label>
              <input
                type="text"
                value={form.customModel}
                onChange={(e) =>
                  setForm({ ...form, customModel: e.target.value })
                }
                placeholder="Ex: nvidia/nemotron-3-ultra:free"
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-300">
                Criatividade (Temperatura)
              </span>
              <span className="text-amber-400 font-mono font-bold">
                {form.temperature}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.5"
              step="0.05"
              value={form.temperature}
              onChange={(e) =>
                setForm({ ...form, temperature: parseFloat(e.target.value) })
              }
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          <div className="pt-3 border-t border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <ScrollText className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-zinc-200">
                  Agente Cronista Secundário (Opcional)
                </span>
              </div>
              <input
                type="checkbox"
                checked={form.chronicleEnabled || false}
                onChange={(e) =>
                  setForm({ ...form, chronicleEnabled: e.target.checked })
                }
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Use um modelo leve/rápido para resumir memórias antigas automaticamente a cada 12 turnos sem gastar a cota do narrador principal.
            </p>

            {form.chronicleEnabled && (
              <div className="p-3 bg-zinc-950/80 border border-zinc-800 rounded-xl space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                      Provedor Cronista
                    </label>
                    <select
                      value={form.chronicleProvider}
                      onChange={(e) =>
                        handleChronicleProviderChange(e.target.value)
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200"
                    >
                      {Object.values(PROVIDERS)
                        .filter((p) => p.id !== 'custom_endpoint')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name.split(' ')[0]}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                      Modelo Cronista
                    </label>
                    <select
                      value={form.chronicleModel}
                      onChange={(e) =>
                        setForm({ ...form, chronicleModel: e.target.value })
                      }
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-[11px] text-zinc-200"
                    >
                      {chronicleOptions.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-zinc-400 block mb-1">
                    API Key do Cronista (pode repetir a mesma chave)
                  </label>
                  <input
                    type="password"
                    value={form.chronicleApiKey || ''}
                    onChange={(e) =>
                      setForm({ ...form, chronicleApiKey: e.target.value })
                    }
                    placeholder="Cole a chave para o Cronista..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-100 font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="bg-amber-950/30 border border-amber-800/40 rounded-xl p-3 flex items-start gap-2.5 text-[11px] text-amber-200/90">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Dica:</strong> Para jogar direto sem complicação, use{' '}
              <strong>OpenRouter + NVIDIA Nemotron 3 Ultra (free)</strong>. Se quiser rodar modelos 100% uncensored (Rocinante/MythoMax) de graça na GPU do Google, mude o provedor acima para{' '}
              <strong>Google Colab / KoboldCpp</strong>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}