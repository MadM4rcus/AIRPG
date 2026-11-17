import { useState } from 'react';
import { Key, Eye, EyeOff, Check, X, ShieldAlert, Cpu } from 'lucide-react';
import { POPULAR_MODELS } from '../hooks/useBYOK';

export default function BYOKModal({ isOpen, onClose, settings, onSave }) {
  const [activeTab, setActiveTab] = useState(settings.activeProvider || 'openrouter');
  const [localSettings, setLocalSettings] = useState(settings);
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleKeyChange = (provider, key) => {
    setLocalSettings((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        apiKey: key.trim(),
      },
    }));
  };

  const handleModelChange = (provider, model) => {
    setLocalSettings((prev) => ({
      ...prev,
      [provider]: {
        ...prev[provider],
        model: model,
      },
    }));
  };

  const handleSetActiveProvider = (provider) => {
    setLocalSettings((prev) => ({
      ...prev,
      activeProvider: provider,
    }));
  };

  const handleSave = () => {
    onSave(localSettings);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 600);
  };

  const providers = [
    { id: 'openrouter', name: 'OpenRouter', badge: 'Modelos :free' },
    { id: 'groq', name: 'Groq', badge: 'Ultra Rápido' },
    { id: 'gemini', name: 'Gemini', badge: 'Tier Grátis' },
  ];

  const currentProviderConfig = localSettings[activeTab] || {};
  const currentModels = POPULAR_MODELS[activeTab] || [];
  const hasKeyConfigured = Boolean(currentProviderConfig.apiKey?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full sm:max-w-xl bg-zinc-900 border-t sm:border border-zinc-800 rounded-t-2xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header Mobile / Desktop */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-zinc-100">Configuração de Chaves (BYOK)</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content com Scroll */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          <div className="bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/80 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Suas chaves são salvas <strong className="text-zinc-200">somente no seu navegador</strong>. Nenhuma chave passa por servidores intermediários.
            </p>
          </div>

          {/* Abas de Provedores em 3 colunas compactas */}
          <div className="grid grid-cols-3 gap-1.5">
            {providers.map((p) => {
              const configured = Boolean(localSettings[p.id]?.apiKey?.trim());
              const isSelected = activeTab === p.id;
              const isGlobalActive = localSettings.activeProvider === p.id;

              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveTab(p.id);
                    setShowKey(false);
                  }}
                  className={`relative p-2.5 rounded-lg border text-left transition flex flex-col gap-0.5 ${
                    isSelected
                      ? 'bg-zinc-800 border-amber-500 text-zinc-100 shadow'
                      : 'bg-zinc-950/50 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-200">{p.name}</span>
                    <span 
                      className={`w-2 h-2 rounded-full ${configured ? 'bg-emerald-500' : 'bg-zinc-600'}`} 
                    />
                  </div>
                  <span className="text-[9px] text-zinc-500 truncate">{p.badge}</span>
                  {isGlobalActive && (
                    <span className="mt-1 text-[8px] font-bold text-amber-400 bg-amber-950/60 border border-amber-700/50 px-1 py-0.2 rounded w-max">
                      ATIVO
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Form do Provedor Selecionado */}
          <div className="space-y-3.5 bg-zinc-950/60 p-4 rounded-xl border border-zinc-800/80">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider">
                Chave ({providers.find((p) => p.id === activeTab)?.name})
              </label>
              {localSettings.activeProvider !== activeTab && (
                <button
                  onClick={() => handleSetActiveProvider(activeTab)}
                  className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  Tornar Ativo
                </button>
              )}
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={currentProviderConfig.apiKey || ''}
                onChange={(e) => handleKeyChange(activeTab, e.target.value)}
                placeholder={
                  activeTab === 'openrouter'
                    ? 'sk-or-v1-...'
                    : activeTab === 'groq'
                    ? 'gsk_...'
                    : 'AIzaSy...'
                }
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 pr-9 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-200"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Model Selection */}
            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1">
                <Cpu className="w-3 h-3 text-amber-400" />
                Modelo
              </label>
              <select
                value={currentProviderConfig.model || ''}
                onChange={(e) => handleModelChange(activeTab, e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
              >
                {currentModels.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={currentProviderConfig.model || ''}
                onChange={(e) => handleModelChange(activeTab, e.target.value)}
                placeholder="Ou informe ID customizado..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-[11px] text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/80 shrink-0">
          <div className="text-[11px] text-zinc-400">
            {hasKeyConfigured ? (
              <span className="text-emerald-400 flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Chave salva
              </span>
            ) : (
              <span className="text-zinc-500">Sem chave</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition"
            >
              {savedSuccess ? <Check className="w-3.5 h-3.5" /> : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
