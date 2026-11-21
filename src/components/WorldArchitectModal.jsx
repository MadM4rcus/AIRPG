import React, { useState, useEffect } from 'react';
import ImagePicker from './ImagePicker';

const DRAFT_STORAGE_KEY = 'airpg_world_architect_draft_v1';

const EMPTY_DRAFT = {
  type: 'chat', // 'chat' | 'rpg'
  name: '',
  tagline: '',
  coverUrl: '',
  description: '',
  firstMessage: '',
  npcs: [], // [{ tempId, codexId?, name, avatarUrl, description }]
  loreItems: [], // [{ tempId, codexId?, category: 'LOCAL' | 'MUNDO', name, description }]
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function WorldArchitectModal({
  isOpen,
  onClose,
  initialType = 'chat',
  codexItems = [],       // Itens existentes da Biblioteca Compartilhada
  onGenerateWithAI,      // async (promptText, currentDraft) => updatedDraftFields
  onPublishWorld,        // async (finalDraft) => void (salva no Firestore e abre sessão)
}) {
  const [draft, setDraft] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      return saved ? { ...EMPTY_DRAFT, ...JSON.parse(saved) } : EMPTY_DRAFT;
    } catch {
      return EMPTY_DRAFT;
    }
  });

  const [activeStep, setActiveStep] = useState(1); // 1: Mundo | 2: Elenco & Locais | 3: Abertura
  const [copilotInput, setCopilotInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showCodexPicker, setShowCodexPicker] = useState(false);

  // Salva rascunho automaticamente no navegador (zero Firestore!)
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignora quota de storage
    }
  }, [draft]);

  useEffect(() => {
    if (isOpen) {
      setDraft((prev) => ({
        ...prev,
        type: initialType === 'rpg' ? 'rpg' : 'chat',
      }));
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const updateField = (field, value) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleResetDraft = () => {
    if (!window.confirm('Limpar todo o rascunho atual e começar do zero?')) return;
    setDraft(EMPTY_DRAFT);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setActiveStep(1);
    setStatusMsg('Rascunho limpo.');
  };

  // Aciona o Copiloto IA (serve tanto para ideia curta quanto para textão colado ou ajustes)
  const handleAskCopilot = async (e) => {
    e?.preventDefault();
    const promptText = copilotInput.trim();
    if (!promptText || isGenerating) return;

    setIsGenerating(true);
    setErrorMsg('');
    setStatusMsg('Arquiteto estruturando mundo...');

    try {
      if (!onGenerateWithAI) {
        throw new Error('Função de IA não conectada.');
      }

      const result = await onGenerateWithAI(promptText, draft);

      setDraft((prev) => ({
        ...prev,
        type: result.type === 'rpg' || result.type === 'chat' ? result.type : prev.type,
        name: result.name ?? prev.name,
        tagline: result.tagline ?? prev.tagline,
        description: result.description ?? prev.description,
        firstMessage: result.firstMessage ?? prev.firstMessage,
        npcs: Array.isArray(result.npcs)
          ? result.npcs.map((n, idx) => {
              const previous =
                prev.npcs.find(
                  (item) =>
                    item.name.trim().toLowerCase() ===
                    (n.name || '').trim().toLowerCase()
                ) ||
                (prev.npcs.length === result.npcs.length
                  ? prev.npcs[idx]
                  : null);
              return {
                tempId: previous?.tempId || uid(),
                codexId: previous?.codexId || null,
                avatarUrl: previous?.avatarUrl || n.avatarUrl || '',
                name: n.name || 'Personagem',
                description: n.description || '',
              };
            })
          : prev.npcs,
        loreItems: Array.isArray(result.loreItems)
          ? result.loreItems.map((item, idx) => {
              const previous =
                prev.loreItems.find(
                  (entry) =>
                    entry.name.trim().toLowerCase() ===
                    (item.name || '').trim().toLowerCase()
                ) ||
                (prev.loreItems.length === result.loreItems.length
                  ? prev.loreItems[idx]
                  : null);
              return {
                tempId: previous?.tempId || uid(),
                codexId: previous?.codexId || null,
                category: item.category === 'MUNDO' ? 'MUNDO' : 'LOCAL',
                name: item.name || 'Elemento',
                description: item.description || '',
              };
            })
          : prev.loreItems,
      }));

      setCopilotInput('');
      setStatusMsg('✨ Rascunho atualizado! Revise nas abas abaixo.');
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao processar com a IA.');
      setStatusMsg('');
    } finally {
      setIsGenerating(false);
    }
  };

  // Manipulação de NPCs no rascunho
  const addEmptyNpc = () => {
    setDraft((prev) => ({
      ...prev,
      npcs: [
        ...prev.npcs,
        { tempId: uid(), codexId: null, name: '', avatarUrl: '', description: '' },
      ],
    }));
  };

  const updateNpc = (tempId, patch) => {
    setDraft((prev) => ({
      ...prev,
      npcs: prev.npcs.map((n) => (n.tempId === tempId ? { ...n, ...patch } : n)),
    }));
  };

  const removeNpc = (tempId) => {
    setDraft((prev) => ({
      ...prev,
      npcs: prev.npcs.filter((n) => n.tempId !== tempId),
    }));
  };

  // Puxa NPC ou Local já existente da Biblioteca (Codex) sem duplicar
  const importFromCodex = (codexItem) => {
    if (codexItem.category === 'NPC') {
      const alreadyAdded = draft.npcs.some((n) => n.codexId === codexItem.id);
      if (alreadyAdded) return;
      setDraft((prev) => ({
        ...prev,
        npcs: [
          ...prev.npcs,
          {
            tempId: uid(),
            codexId: codexItem.id,
            name: codexItem.name,
            avatarUrl: codexItem.avatarUrl || codexItem.imageUrl || '',
            description: codexItem.description || codexItem.summary || '',
          },
        ],
      }));
    } else {
      const alreadyAdded = draft.loreItems.some((l) => l.codexId === codexItem.id);
      if (alreadyAdded) return;
      setDraft((prev) => ({
        ...prev,
        loreItems: [
          ...prev.loreItems,
          {
            tempId: uid(),
            codexId: codexItem.id,
            category: codexItem.category || 'LOCAL',
            name: codexItem.name,
            description: codexItem.description || codexItem.summary || '',
          },
        ],
      }));
    }
  };

  // Manipulação de Locais e Regras
  const addEmptyLore = (category = 'LOCAL') => {
    setDraft((prev) => ({
      ...prev,
      loreItems: [
        ...prev.loreItems,
        { tempId: uid(), codexId: null, category, name: '', description: '' },
      ],
    }));
  };

  const updateLore = (tempId, patch) => {
    setDraft((prev) => ({
      ...prev,
      loreItems: prev.loreItems.map((l) =>
        l.tempId === tempId ? { ...l, ...patch } : l
      ),
    }));
  };

  const removeLore = (tempId) => {
    setDraft((prev) => ({
      ...prev,
      loreItems: prev.loreItems.filter((l) => l.tempId !== tempId),
    }));
  };

  const handlePublish = async () => {
    if (!draft.name.trim()) {
      setActiveStep(1);
      setErrorMsg('Dê um título ao mundo antes de salvar.');
      return;
    }
    setIsPublishing(true);
    setErrorMsg('');
    try {
      await onPublishWorld(draft);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setDraft(EMPTY_DRAFT);
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Erro ao salvar mundo.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Cabeçalho */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 active:scale-95"
          >
            ✕ Fechar
          </button>
          <div>
            <h1 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>🏛️</span>
              <span>Arquiteto de Mundos</span>
            </h1>
            <p className="text-[10px] text-zinc-500">
              Rascunho local • Zero gasto no banco até salvar
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleResetDraft}
          className="px-2.5 py-1 rounded-lg bg-zinc-900 text-[11px] text-zinc-400 hover:text-red-300 border border-zinc-800"
        >
          Limpar
        </button>
      </header>

      {/* Caixa do Copiloto IA (Ideia curta, Textão colado ou Ajustes) */}
      <section className="p-3 bg-zinc-900/80 border-b border-zinc-800">
        <form onSubmit={handleAskCopilot} className="max-w-2xl mx-auto flex flex-col gap-2">
          <div className="flex gap-2">
            <textarea
              rows={2}
              value={copilotInput}
              onChange={(e) => setCopilotInput(e.target.value)}
              placeholder="Descreva uma ideia ('Reality show com personagens de Naruto...'), cole um textão de outro site ou peça ajustes..."
              className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 resize-none"
            />
            <button
              type="submit"
              disabled={isGenerating || !copilotInput.trim()}
              className="px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex flex-col items-center justify-center gap-0.5 disabled:opacity-40 active:scale-95 transition shrink-0"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="text-base">✨</span>
                  <span>Gerar</span>
                </>
              )}
            </button>
          </div>

          {statusMsg && (
            <p className="text-[11px] text-amber-400">{statusMsg}</p>
          )}
          {errorMsg && (
            <p className="text-[11px] text-red-400">{errorMsg}</p>
          )}
        </form>
      </section>

      {/* Navegação das 3 Etapas (Abas Largas Mobile-First) */}
      <nav className="grid grid-cols-3 border-b border-zinc-800 bg-zinc-950 text-xs font-semibold">
        {[
          { step: 1, label: '1. Mundo' },
          { step: 2, label: `2. Elenco (${draft.npcs.length})` },
          { step: 3, label: '3. Abertura' },
        ].map((tab) => (
          <button
            key={tab.step}
            type="button"
            onClick={() => setActiveStep(tab.step)}
            className={`py-3 text-center border-b-2 transition ${
              activeStep === tab.step
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Corpo Rolável da Etapa Ativa */}
      <main className="flex-1 overflow-y-auto p-4 pb-28">
        <div className="max-w-2xl mx-auto flex flex-col gap-4">
          {/* ETAPA 1: MUNDO & PREMISSA */}
          {activeStep === 1 && (
            <>
              {/* Seletor de Modo */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateField('type', 'chat')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    draft.type === 'chat'
                      ? 'bg-purple-600/20 border-purple-400 text-purple-200'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>🎭</span>
                  <span>Conversa Livre</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateField('type', 'rpg')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    draft.type === 'rpg'
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <span>⚔️</span>
                  <span>Campanha RPG</span>
                </button>
              </div>

              {/* Capa + Campos Principais */}
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="w-36 mx-auto sm:mx-0 shrink-0">
                  <ImagePicker
                    value={draft.coverUrl}
                    onChange={(url) => updateField('coverUrl', url)}
                    aspectClass="aspect-[3/4]"
                    placeholder="Capa ou GIF"
                  />
                </div>

                <div className="flex-1 w-full flex flex-col gap-3">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                      Título do Mundo
                    </label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={(e) => updateField('name', e.target.value)}
                      placeholder="Ex: Shinobi Big Brother — 1 Bilhão de Ryō"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                      Subtítulo / Tagline
                    </label>
                    <input
                      type="text"
                      value={draft.tagline}
                      onChange={(e) => updateField('tagline', e.target.value)}
                      placeholder="Ex: Alianças secretas, provas mortais e intrigas na mansão"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Premissa, Cenário & Regras Gerais (Overview)
                </label>
                <textarea
                  rows={6}
                  value={draft.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Descreva como o mundo funciona, o conflito principal, tom da história ou regras..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}

          {/* ETAPA 2: ELENCO & LOCAIS */}
          {activeStep === 2 && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                  Personagens / Elenco ({draft.npcs.length})
                </h2>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCodexPicker((prev) => !prev)}
                    className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-medium active:scale-95"
                  >
                    📚 {showCodexPicker ? 'Fechar Biblioteca' : '+ Da Biblioteca'}
                  </button>
                  <button
                    type="button"
                    onClick={addEmptyNpc}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700 text-xs font-medium active:scale-95"
                  >
                    + Novo NPC
                  </button>
                </div>
              </div>

              {/* Gaveta rápida para puxar personagens já salvos no Codex */}
              {showCodexPicker && (
                <div className="p-3 rounded-xl bg-zinc-900 border border-purple-500/30 flex flex-col gap-2">
                  <p className="text-[11px] text-purple-300 font-medium">
                    Toque para importar da sua Biblioteca Compartilhada:
                  </p>
                  {codexItems.length === 0 ? (
                    <p className="text-xs text-zinc-500">Sua Biblioteca ainda está vazia.</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                      {codexItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => importFromCodex(item)}
                          className="px-2.5 py-1 rounded-full bg-zinc-950 hover:bg-purple-950/50 border border-zinc-700 text-xs text-zinc-200 flex items-center gap-1.5"
                        >
                          <span>
                            {item.category === 'NPC'
                              ? '👤'
                              : item.category === 'LOCAL'
                              ? '📍'
                              : '📜'}
                          </span>
                          <span>{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Lista de Cards de NPCs */}
              <div className="flex flex-col gap-3">
                {draft.npcs.length === 0 && (
                  <div className="p-6 rounded-2xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                    Nenhum personagem ainda. Peça para o Copiloto no topo criar o elenco ou adicione manualmente.
                  </div>
                )}

                {draft.npcs.map((npc) => (
                  <div
                    key={npc.tempId}
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex gap-3 items-start"
                  >
                    <div className="w-20 shrink-0">
                      <ImagePicker
                        value={npc.avatarUrl}
                        onChange={(url) => updateNpc(npc.tempId, { avatarUrl: url })}
                        aspectClass="aspect-square"
                        compact
                      />
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={npc.name}
                          onChange={(e) =>
                            updateNpc(npc.tempId, { name: e.target.value })
                          }
                          placeholder="Nome do personagem"
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-amber-500"
                        />
                        <button
                          type="button"
                          onClick={() => removeNpc(npc.tempId)}
                          className="px-2 py-1 rounded-lg bg-red-950/50 text-red-300 text-xs"
                          title="Remover"
                        >
                          ✕
                        </button>
                      </div>

                      <textarea
                        rows={3}
                        value={npc.description}
                        onChange={(e) =>
                          updateNpc(npc.tempId, { description: e.target.value })
                        }
                        placeholder="Personalidade, aparência e papel na história..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Locais e Regras de Mundo */}
              <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
                    Locais & Regras ({draft.loreItems.length})
                  </h2>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => addEmptyLore('LOCAL')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-200 border border-zinc-700"
                    >
                      + Local
                    </button>
                    <button
                      type="button"
                      onClick={() => addEmptyLore('MUNDO')}
                      className="px-2.5 py-1 rounded-lg bg-zinc-800 text-xs text-zinc-200 border border-zinc-700"
                    >
                      + Regra
                    </button>
                  </div>
                </div>

                {draft.loreItems.map((item) => (
                  <div
                    key={item.tempId}
                    className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-bold text-amber-400">
                        {item.category}
                      </span>
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) =>
                          updateLore(item.tempId, { name: e.target.value })
                        }
                        placeholder="Nome do local ou regra"
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => removeLore(item.tempId)}
                        className="px-2 py-1 rounded-lg bg-red-950/50 text-red-300 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={item.description}
                      onChange={(e) =>
                        updateLore(item.tempId, { description: e.target.value })
                      }
                      placeholder="Descrição curta (1-2 frases)..."
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300"
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ETAPA 3: CENA DE ABERTURA */}
          {activeStep === 3 && (
            <>
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 mb-1">
                  Cena de Abertura (Primeira Mensagem do Mundo)
                </label>
                <p className="text-xs text-zinc-500 mb-2">
                  Dica: use <code className="text-amber-400">**[Nome]:**</code> antes das falas de cada personagem para já abrir com bolhas separadas e avatares no chat!
                </p>
                <textarea
                  rows={10}
                  value={draft.firstMessage}
                  onChange={(e) => updateField('firstMessage', e.target.value)}
                  placeholder="Descreva a cena inicial e a primeira fala dos personagens..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-200 leading-relaxed focus:outline-none focus:border-amber-500"
                />
              </div>
            </>
          )}
        </div>
      </main>

      {/* Rodapé Fixo com Navegação e Botão Final de Salvar */}
      <footer className="p-3 bg-zinc-950 border-t border-zinc-800">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          {activeStep < 3 ? (
            <button
              type="button"
              onClick={() => setActiveStep((s) => Math.min(3, s + 1))}
              className="w-full py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-sm active:scale-[0.98] transition"
            >
              Próxima Etapa ({activeStep}/3) →
            </button>
          ) : (
            <button
              type="button"
              disabled={isPublishing}
              onClick={handlePublish}
              className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98] transition"
            >
              <span>🚀</span>
              <span>
                {isPublishing ? 'Criando Mundo...' : 'Salvar & Entrar no Mundo'}
              </span>
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}