import React, { useState, useEffect } from 'react';
import { X, Key, Cpu, Check, Sparkles, Archive } from 'lucide-react';
import { PROVIDERS } from '../hooks/useBYOK';

export default function BYOKModal({ isOpen, onClose, settings, onSave }) {
  const [form, setForm] = useState(settings);

  useEffect(() => {
    if (isOpen) setForm(settings);
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const currentProvider = PROVIDERS[form.provider] || PROVIDERS.openrouter;
  const chronicleProviderObj = PROVIDERS[form.chronicleProvider] || PROVIDERS.groq;

  const handleProviderChange = (newProv) => {
    const firstModel = PROVIDERS[newProv]?.models[0]?.id || '';
    setForm({ ...form, provider: newProv, model: firstModel });
  };

  const handleChronicleProviderChange = (newProv) => {
    const firstModel = PROVIDERS[newProv]?.models[0]?.id || '';
    setForm({ ...form, chronicleProvider: newProv, chronicleModel: firstModel });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Configurar Chaves (BYOK)
              </h2>
              <p className="text-xs text-zinc-400">
                Foco em modelos gratuitos e economia máxima de tokens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Agente Principal */}
          <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Agente Principal (Narrador & Mestre RPG)
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Provedor</label>
              <select
                value={form.provider}
                onChange={(e) => handleProviderChange(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {Object.values(PROVIDERS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">API Key</label>
              <input
                type="password"
                placeholder="Cole sua chave API aqui..."
                value={form.apiKey}
                onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Modelo</label>
              <select
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
              >
                {currentProvider.models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {form.model === 'custom' && (
              <div>
                <label className="block text-xs text-zinc-400 mb-1">
                  ID Customizado do Modelo
                </label>
                <input
                  type="text"
                  placeholder="ex: gryphe/mythomax-l2-13b"
                  value={form.customModel || ''}
                  onChange={(e) =>
                    setForm({ ...form, customModel: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100"
                />
              </div>
            )}

            <div>
              <div className="flex justify-between text-xs text-zinc-400 mb-1">
                <span>Criatividade (Temperatura)</span>
                <span className="text-zinc-200 font-mono">{form.temperature}</span>
              </div>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.05"
                value={form.temperature}
                onChange={(e) =>
                  setForm({ ...form, temperature: parseFloat(e.target.value) })
                }
                className="w-full accent-amber-500"
              />
            </div>
          </div>

          {/* Agente Cronista Secundário (Economia de Cota) */}
          <div className="space-y-3 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                <Archive className="w-3.5 h-3.5" />
                Cronista Secundário (Opcional)
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                <input
                  type="checkbox"
                  checked={Boolean(form.chronicleEnabled)}
                  onChange={(e) =>
                    setForm({ ...form, chronicleEnabled: e.target.checked })
                  }
                  className="accent-emerald-500 rounded"
                />
                Ativar chave separada
              </label>
            </div>

            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Use uma chave gratuita rápida (ex: Groq ou Gemini Flash) só para resumir memórias antigas automaticamente a cada 12 mensagens, poupando seu limite diário do OpenRouter.
            </p>

            {form.chronicleEnabled && (
              <div className="space-y-2.5 pt-1">
                <select
                  value={form.chronicleProvider}
                  onChange={(e) => handleChronicleProviderChange(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                >
                  {Object.values(PROVIDERS).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>

                <input
                  type="password"
                  placeholder="API Key do Cronista (Groq / Gemini)..."
                  value={form.chronicleApiKey || ''}
                  onChange={(e) =>
                    setForm({ ...form, chronicleApiKey: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                />

                <select
                  value={form.chronicleModel}
                  onChange={(e) =>
                    setForm({ ...form, chronicleModel: e.target.value })
                  }
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100"
                >
                  {chronicleProviderObj.models
                    .filter((m) => m.id !== 'custom')
                    .map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              Salvar Configurações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}