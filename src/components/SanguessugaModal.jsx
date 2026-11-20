import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileJson,
  Sparkles,
  MessageSquare,
  Swords,
  Bookmark,
  Check,
  Copy,
  Wand2,
  Loader2,
  Key,
} from 'lucide-react';
import { extractBotAndCodexFromRawText } from '../engine/sanguessugaExtractor';

export default function SanguessugaModal({
  isOpen,
  onClose,
  onAddProfile,
  onAddCodexEntry,
  byokSettings,
  chronicleByokSettings,
  onOpenBYOK,
  initialType = 'chat',
  codex = [],
}) {
  const [entityType, setEntityType] = useState(initialType);
  const [activeTab, setActiveTab] = useState('extract'); // 'extract' | 'manual' | 'json' | 'bookmarklet'

  // Estado da extração assistida por IA
  const [rawPaste, setRawPaste] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  // Estado manual
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(initialType === 'rpg' ? '⚔️' : '🎭');
  const [tag, setTag] = useState('');
  const [personality, setPersonality] = useState('');
  const [scenario, setScenario] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [pinnedCodexIds, setPinnedCodexIds] = useState([]);

  // Estado JSON
  const [rawJson, setRawJson] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEntityType(initialType);
      setAvatar(initialType === 'rpg' ? '⚔️' : '🎭');
      setErrorMsg('');
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const togglePin = (id) => {
    setPinnedCodexIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSmartExtract = async (e) => {
    e.preventDefault();
    if (!rawPaste.trim()) return;
    const extractorByok = chronicleByokSettings?.isReady ? chronicleByokSettings : byokSettings;
    if (!extractorByok?.isReady) {
      setErrorMsg('Configure sua chave ou URL do túnel no botão BYOK antes de usar a extração com IA.');
      return;
    }

    setErrorMsg('');
    setIsExtracting(true);
    try {
      const extracted = await extractBotAndCodexFromRawText({
        rawText: rawPaste,
        targetType: entityType,
        byokSettings: extractorByok,
      });

      // Cria cada NPC, Local ou Regra extraída na Biblioteca Compartilhada e já fixa na sessão
      const createdIds = [];
      if (onAddCodexEntry && extracted.codexItems.length > 0) {
        for (const item of extracted.codexItems) {
          const saved = onAddCodexEntry({
            category: ['NPC', 'LOCAL', 'MUNDO'].includes(item.category)
              ? item.category
              : 'NPC',
            name: item.name,
            tag: item.tag,
            summary: item.summary,
          });
          if (saved?.id) createdIds.push(saved.id);
        }
      }

      onAddProfile({
        type: entityType,
        name: extracted.name,
        avatar: entityType === 'rpg' ? '⚔️' : '🎭',
        tag: extracted.tag,
        personality: extracted.personality,
        scenario: extracted.scenario,
        firstMessage: extracted.firstMessage,
        pinnedCodexIds: createdIds,
        initialVault: [],
      });

      setRawPaste('');
      onClose();
    } catch (err) {
      setErrorMsg(err.message || 'Falha ao extrair dados com a IA.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe um nome para continuar.');
      return;
    }

    onAddProfile({
      type: entityType,
      name: name.trim(),
      avatar: avatar.trim() || (entityType === 'rpg' ? '⚔️' : '🎭'),
      tag:
        tag.trim() ||
        (entityType === 'rpg' ? 'Campanha PbtA' : 'Conversa Livre'),
      personality: personality.trim(),
      scenario: scenario.trim(),
      firstMessage:
        firstMessage.trim() ||
        (entityType === 'rpg'
          ? 'A jornada começa agora. O que você faz?'
          : '— Olá... o que traz você até aqui?'),
      pinnedCodexIds,
      initialVault: [],
    });

    setName('');
    setTag('');
    setPersonality('');
    setScenario('');
    setFirstMessage('');
    setPinnedCodexIds([]);
    onClose();
  };

  const handleJsonImport = (e) => {
    e.preventDefault();
    setErrorMsg('');
    try {
      const parsed = JSON.parse(rawJson);
      const data = parsed.data || parsed;

      onAddProfile({
        type: entityType,
        name: data.name || 'Importado',
        avatar: entityType === 'rpg' ? '⚔️' : '🎭',
        tag:
          (Array.isArray(data.tags) && data.tags[0]) ||
          (entityType === 'rpg' ? 'Campanha Importada' : 'Card V2'),
        personality: [data.description, data.personality].filter(Boolean).join('\n\n'),
        scenario: data.scenario || '',
        firstMessage: data.first_mes || data.firstMessage || '— Olá...',
        pinnedCodexIds,
        initialVault: [],
      });

      setRawJson('');
      setPinnedCodexIds([]);
      onClose();
    } catch (err) {
      setErrorMsg('JSON inválido. Verifique se copiou o Character Card V2 completo.');
    }
  };

  const bookmarkletCode = `javascript:(function(){const t=document.body.innerText.slice(0,8000);navigator.clipboard.writeText(t);alert("Página copiada! Cole na aba 'Colar Bruto + IA' do AIRPG.");})();`;

  const copyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const extractorProviderLabel = chronicleByokSettings?.isReady
    ? 'BYOK'
    : `Agente: ${byokSettings?.provider?.toUpperCase() || 'NÃO CONFIGURADO'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100">
                Sanguessuga — Criar ou Destilar Mundo
              </h2>
              <p className="text-xs text-zinc-400">
                Cole uma página inteira ou crie manualmente; a IA separa NPCs, Locais e Regras na Biblioteca
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => onOpenBYOK?.()}
              className="h-9 px-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/15 transition-colors flex items-center gap-1.5 text-[11px] font-semibold"
              title="Configurar provedor BYOK"
            >
              <Key className="w-3.5 h-3.5" />
              {extractorProviderLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Seletor de Modo: Conversa Livre vs Campanha RPG */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-zinc-950/80 border-b border-zinc-800">
          <button
            type="button"
            onClick={() => {
              setEntityType('chat');
              if (avatar === '⚔️') setAvatar('🎭');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              entityType === 'chat'
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/50 shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Conversa Livre / Freeroam
          </button>

          <button
            type="button"
            onClick={() => {
              setEntityType('rpg');
              if (avatar === '🎭') setAvatar('⚔️');
            }}
            className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${
              entityType === 'rpg'
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Swords className="w-4 h-4" />
            Campanha RPG (PbtA / Ficha)
          </button>
        </div>

        {/* Abas de Entrada */}
        <div className="flex overflow-x-auto border-b border-zinc-800 px-4 bg-zinc-950/40">
          <button
            type="button"
            onClick={() => setActiveTab('extract')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'extract'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            Colar Bruto + IA (Extrair Tudo)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === 'manual'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Criação Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'json'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <FileJson className="w-3.5 h-3.5" />
            JSON (Card V2)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookmarklet')}
            className={`px-3 py-2.5 text-xs font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-colors ${
              activeTab === 'bookmarklet'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            Bookmarklet
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {activeTab === 'extract' && (
            <form onSubmit={handleSmartExtract} className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Dê <strong>Ctrl+A / Ctrl+C</strong> na página do bot em qualquer plataforma (ou cole uma descrição longa) e cole abaixo. A IA vai limpar o texto, criar a sessão e salvar cada <strong>NPC, Local e Regra de Mundo</strong> separadamente na sua Biblioteca para economizar tokens.
              </p>
              <textarea
                rows={8}
                placeholder="Cole aqui o texto copiado da página do bot, lore, elenco de personagens, cenário e primeira mensagem..."
                value={rawPaste}
                onChange={(e) => setRawPaste(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 resize-none"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isExtracting}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-sm flex items-center gap-2 transition-colors"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Extraindo NPCs, Locais e Mundo...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      Destilar para Biblioteca & Iniciar
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    {entityType === 'rpg'
                      ? 'Nome da Campanha / Mundo'
                      : 'Nome do Cenário ou Personagem'}
                  </label>
                  <input
                    type="text"
                    placeholder={
                      entityType === 'rpg'
                        ? 'Ex: Crônicas de Cinza e Ferro'
                        : 'Ex: Noite em Neo-Valhalla'
                    }
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Ícone / Emoji
                  </label>
                  <input
                    type="text"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-center text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Gênero / Tag
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dark Fantasy"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Premissa, Regras do Mundo & Tom
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva o ambiente, regras sociais/mágicas e o estilo da narrativa..."
                  value={personality}
                  onChange={(e) => setPersonality(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Cenário / Local de Abertura
                </label>
                <input
                  type="text"
                  placeholder="Ex: Taverna do Corvo Manco, numa noite de tempestade..."
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                  Mensagem Inicial da Cena
                </label>
                <textarea
                  rows={3}
                  placeholder="Escreva como a cena começa..."
                  value={firstMessage}
                  onChange={(e) => setFirstMessage(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>

              {codex.length > 0 && (
                <div className="pt-1">
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1.5">
                    Fixar NPCs, Locais ou Regras da Biblioteca nesta sessão:
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-lg bg-zinc-950/70 border border-zinc-800">
                    {codex.map((item) => {
                      const selected = pinnedCodexIds.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => togglePin(item.id)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                            selected
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                          }`}
                        >
                          [{item.category}] {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className={`px-5 py-2.5 rounded-xl font-semibold text-sm text-zinc-950 transition-colors ${
                    entityType === 'rpg'
                      ? 'bg-emerald-400 hover:bg-emerald-300'
                      : 'bg-amber-500 hover:bg-amber-400'
                  }`}
                >
                  {entityType === 'rpg'
                    ? 'Criar Campanha RPG'
                    : 'Criar Conversa Livre'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'json' && (
            <form onSubmit={handleJsonImport} className="space-y-3">
              <p className="text-xs text-zinc-400">
                Cole o conteúdo JSON de um Character Card V2:
              </p>
              <textarea
                rows={7}
                placeholder='{"name": "...", "description": "...", "first_mes": "..."}'
                value={rawJson}
                onChange={(e) => setRawJson(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-amber-500/50"
                required
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-sm flex items-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  Importar JSON
                </button>
              </div>
            </form>
          )}

          {activeTab === 'bookmarklet' && (
            <div className="space-y-3">
              <p className="text-xs text-zinc-300 leading-relaxed">
                Arraste ou salve o código abaixo como favorito para copiar o texto da página com um clique e colar na aba <strong>Colar Bruto + IA</strong>:
              </p>
              <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-[11px] text-zinc-400 break-all">
                {bookmarkletCode}
              </div>
              <button
                type="button"
                onClick={copyBookmarklet}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-medium inline-flex items-center gap-1.5"
              >
                {copiedBookmarklet ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    Copiar Bookmarklet
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}