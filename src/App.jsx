import { useState, useRef, useEffect } from 'react';
import { 
  Key, 
  Settings, 
  Sparkles, 
  Swords, 
  Compass, 
  Database, 
  BookOpen, 
  PlusCircle, 
  Send, 
  Menu, 
  X, 
  Loader2, 
  AlertCircle, 
  Trash2, 
  User, 
  ArrowLeft, 
  Globe, 
  MessageSquare, 
  Search, 
  Plus, 
  Dices, 
  Heart, 
  Shield, 
  Activity, 
  ScrollText,
  Cloud,
  CloudCheck,
  RotateCw
} from 'lucide-react';
import { useBYOK } from './hooks/useBYOK';
import { useProfiles } from './hooks/useProfiles';
import { useCharacterSheet } from './hooks/useCharacterSheet';
import BYOKModal from './components/BYOKModal';
import SanguessugaModal from './components/SanguessugaModal';
import PbtaRollModal from './components/PbtaRollModal';
import DungeonPaperModal from './components/DungeonPaperModal';
import { callLLM } from './services/llmService';
import { buildSystemPrompt } from './engine/promptBuilder';
import { parseAssistantResponse } from './engine/stateParser';
import { fishRelevantVaultBoxes } from './engine/vaultFisher';
import { compressMessagesIntoChronicle } from './engine/chronicleCompressor';
import { saveProfileToCloud, saveChatSessionToCloud } from './services/firebase';

export default function App() {
  const { settings, saveSettings, getActiveConfig } = useBYOK();
  const { 
    profiles, 
    activeProfile, 
    setActiveProfileId, 
    addProfile, 
    deleteProfile,
    userPersona,
    saveUserPersona
  } = useProfiles();

  const { 
    sheet, 
    saveSheet,
    updateHp, 
    updateStatScore,
    changeClass,
    addBond,
    removeBond,
    addItem,
    removeItem
  } = useCharacterSheet();

  const [currentScreen, setCurrentScreen] = useState('feed');
  const [searchFilter, setSearchFilter] = useState('');

  const [isBYOKOpen, setIsBYOKOpen] = useState(false);
  const [isSanguessugaOpen, setIsSanguessugaOpen] = useState(false);
  const [isPbtaRollOpen, setIsPbtaRollOpen] = useState(false);
  const [isDungeonPaperOpen, setIsDungeonPaperOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [rightDrawerTab, setRightDrawerTab] = useState('vault'); // 'vault' | 'sheet' | 'chronicle'

  const [currentMode, setCurrentMode] = useState('freeroam'); // 'freeroam' | 'hardcore'
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('saved'); // 'saved' | 'syncing'
  const [errorMessage, setErrorMessage] = useState('');

  const [activeFishedTags, setActiveFishedTags] = useState([]);
  const [isAddingVaultBox, setIsAddingVaultBox] = useState(false);
  const [newVaultTag, setNewVaultTag] = useState('');
  const [newVaultContent, setNewVaultContent] = useState('');

  const [chatHistories, setChatHistories] = useState(() => {
    try {
      const stored = localStorage.getItem('airpg_chat_histories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  const [vaults, setVaults] = useState(() => {
    try {
      const stored = localStorage.getItem('airpg_vaults_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  // The Chronicle (Tier A) acumulado por mundo
  const [chronicles, setChronicles] = useState(() => {
    try {
      const stored = localStorage.getItem('airpg_chronicles_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {};
  });

  const messagesEndRef = useRef(null);
  const activeConfig = getActiveConfig();

  const currentMessages = chatHistories[activeProfile.id] || [
    { role: 'assistant', content: activeProfile.firstMessage },
  ];

  const currentVault = vaults[activeProfile.id] || activeProfile.initialVault || [];
  const currentChronicle = chronicles[activeProfile.id] || '';

  const updateCurrentMessages = (newMsgs) => {
    setChatHistories((prev) => {
      const updated = { ...prev, [activeProfile.id]: newMsgs };
      try {
        localStorage.setItem('airpg_chat_histories', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    // Sincroniza em nuvem em background
    triggerCloudSync(newMsgs, currentVault, currentChronicle);
  };

  const updateCurrentVault = (newVault) => {
    setVaults((prev) => {
      const updated = { ...prev, [activeProfile.id]: newVault };
      try {
        localStorage.setItem('airpg_vaults_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    triggerCloudSync(currentMessages, newVault, currentChronicle);
  };

  const updateCurrentChronicle = (newChronicle) => {
    setChronicles((prev) => {
      const updated = { ...prev, [activeProfile.id]: newChronicle };
      try {
        localStorage.setItem('airpg_chronicles_data', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    triggerCloudSync(currentMessages, currentVault, newChronicle);
  };

  // Sincronização em background no Firestore (coleção airpg_chats)
  const triggerCloudSync = async (msgs, vault, chronicle) => {
    setCloudSyncStatus('syncing');
    await saveChatSessionToCloud(activeProfile.id, msgs, vault, chronicle);
    setCloudSyncStatus('saved');
  };

  useEffect(() => {
    if (currentScreen === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentMessages, isLoading, currentScreen]);

  const handleOpenChat = (profileId) => {
    setActiveProfileId(profileId);
    setCurrentScreen('chat');
  };

  const handleManualAddVaultBox = (e) => {
    e.preventDefault();
    if (!newVaultTag.trim() || !newVaultContent.trim()) return;
    const formattedTag = newVaultTag.startsWith('#') ? newVaultTag.trim() : `#${newVaultTag.trim()}`;
    const nextVault = [{ tag: formattedTag, content: newVaultContent.trim() }, ...currentVault];
    updateCurrentVault(nextVault);
    setNewVaultTag('');
    setNewVaultContent('');
    setIsAddingVaultBox(false);
  };

  const handleDeleteVaultBox = (tagToDelete) => {
    const nextVault = currentVault.filter((b) => b.tag !== tagToDelete);
    updateCurrentVault(nextVault);
  };

  // Rotina do Chronicle: comprime mensagens antigas se houver mais de 10 turnos acumulados
  const handleCompressChronicle = async () => {
    if (currentMessages.length <= 4 || isCompressing) return;
    setIsCompressing(true);

    try {
      // Pega os primeiros turnos exceto a abertura e os últimos 4
      const turnsToCompress = currentMessages.slice(1, -4);
      const remainingMessages = [currentMessages[0], ...currentMessages.slice(-4)];

      const newChronicle = await compressMessagesIntoChronicle({
        oldMessages: turnsToCompress,
        existingChronicle: currentChronicle,
        byokConfig: activeConfig,
      });

      updateCurrentChronicle(newChronicle);
      updateCurrentMessages(remainingMessages);
      alert('The Chronicle atualizado! Turnos antigos foram sintetizados com sucesso.');
    } catch (err) {
      console.warn('Erro ao comprimir Chronicle:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  const executeSendMessage = async (textToSend, mechanicalInjection = '') => {
    if (!textToSend.trim() || isLoading) return;

    if (!activeConfig.isReady) {
      setIsBYOKOpen(true);
      return;
    }

    setErrorMessage('');
    const userText = textToSend.trim();
    setInputMessage('');

    const updatedMessages = [...currentMessages, { role: 'user', content: userText }];
    updateCurrentMessages(updatedMessages);
    setIsLoading(true);

    try {
      const { activeBoxes, activeTags } = fishRelevantVaultBoxes({
        userMessage: userText,
        recentMessages: updatedMessages,
        vault: currentVault,
        maxBoxes: 6,
      });

      setActiveFishedTags(activeTags);

      const systemPrompt = buildSystemPrompt({
        mode: currentMode,
        characterName: activeProfile.name,
        personality: activeProfile.personality,
        scenario: activeProfile.scenario,
        firstMessage: activeProfile.firstMessage,
        vaultContext: activeBoxes,
        chronicle: currentChronicle,
        userPersona: userPersona,
        characterSheet: currentMode === 'hardcore' ? sheet : null,
      });

      const messagesForLLM = mechanicalInjection
        ? [
            ...updatedMessages.slice(0, -1),
            { role: 'user', content: `${userText}\n\n${mechanicalInjection}` }
          ]
        : updatedMessages;

      const rawResponse = await callLLM({
        messages: messagesForLLM,
        systemPrompt,
        byokConfig: activeConfig,
      });

      const { cleanText, stateUpdate } = parseAssistantResponse(rawResponse);
      updateCurrentMessages([...updatedMessages, { role: 'assistant', content: cleanText }]);

      if (stateUpdate?.vault_updates && Array.isArray(stateUpdate.vault_updates)) {
        const nextVault = [...currentVault];
        stateUpdate.vault_updates.forEach((update) => {
          const idx = nextVault.findIndex((b) => b.tag.toLowerCase() === update.tag?.toLowerCase());
          if (idx >= 0) {
            nextVault[idx] = update;
          } else if (update.tag && update.content) {
            nextVault.push(update);
          }
        });
        updateCurrentVault(nextVault);
      }
    } catch (err) {
      console.error('Erro na chamada da LLM:', err);
      setErrorMessage(err.message || 'Erro inesperado ao se comunicar com a IA.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    executeSendMessage(inputMessage);
  };

  const handlePbtaRollConfirmed = (rollData) => {
    const userActionMsg = `🎲 **[Movimento: ${rollData.tierName}]** ${inputMessage.trim() || 'Ajo decisivamente segundo o movimento.'}`;
    executeSendMessage(userActionMsg, rollData.promptInjection);
  };

  const filteredProfiles = profiles.filter((p) =>
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.tag || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
      
      {/* ============================================================== */}
      {/* TELA 1: FEED / HUB INICIAL DE MUNDOS E BOTS                    */}
      {/* ============================================================== */}
      {currentScreen === 'feed' && (
        <div className="flex-1 flex flex-col h-full w-full bg-zinc-950 overflow-y-auto">
          <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-950/80 backdrop-blur-md sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">
                AI
              </div>
              <h1 className="font-extrabold text-sm tracking-wide text-zinc-100">AIRPG</h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsSanguessugaOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-medium max-w-[80px] truncate">{userPersona.name}</span>
              </button>

              <button
                onClick={() => setIsBYOKOpen(true)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 relative"
                title="Configurar chaves"
              >
                <Key className="w-4 h-4 text-amber-400" />
                {!activeConfig.isReady && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            </div>
          </header>

          <main className="p-4 space-y-5 max-w-3xl mx-auto w-full pb-10">
            {!activeConfig.isReady && (
              <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-200">Chave de IA Pendente</p>
                    <p className="text-[11px] text-amber-400/80">Insira uma chave gratuita no BYOK para começar.</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsBYOKOpen(true)}
                  className="px-3 py-1.5 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition shrink-0"
                >
                  Configurar
                </button>
              </div>
            )}

            {/* Hero Card */}
            <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/60 to-zinc-950 p-5 shadow-xl">
              <div className="relative z-10 space-y-2">
                <span className="inline-block text-[10px] font-bold tracking-wider text-amber-400 uppercase bg-amber-950/60 border border-amber-800/40 px-2 py-0.5 rounded">
                  Dual-Mode Engine • PbtA & Freeroam
                </span>
                <h2 className="text-base font-bold text-zinc-100">
                  Crie mundos inteiros ou importe cenas curtas
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Converse com o <strong>Arquiteto de Mundos</strong> para tecer lore e NPCs para o Vault, ou use a <strong>Sanguessuga</strong> para puxar cards da web.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => setIsSanguessugaOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl transition shadow-lg shadow-amber-500/20"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Criar com o Arquiteto</span>
                  </button>
                  <button
                    onClick={() => setIsSanguessugaOpen(true)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition"
                  >
                    <PlusCircle className="w-4 h-4 text-amber-400" />
                    <span>Importar Sanguessuga</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Busca */}
            <div className="flex items-center justify-between gap-2 pt-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                Seus Mundos & Personagens ({profiles.length})
              </h3>
              <div className="relative w-44">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 pl-7"
                />
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-2 top-2" />
              </div>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredProfiles.map((p) => {
                const vaultCount = (vaults[p.id] || p.initialVault || []).length;
                const msgsCount = (chatHistories[p.id] || []).length;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenChat(p.id)}
                    className="group relative cursor-pointer rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-amber-500/50 p-4 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-md"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-3xl shrink-0 p-1 bg-zinc-950/80 rounded-xl border border-zinc-800">
                          {p.avatar}
                        </span>
                        <div>
                          <h4 className="font-bold text-xs text-zinc-100 group-hover:text-amber-400 transition">
                            {p.name}
                          </h4>
                          <span className="inline-block mt-0.5 text-[9px] font-semibold text-zinc-400 bg-zinc-950/70 border border-zinc-800 px-1.5 py-0.2 rounded">
                            {p.tag || 'Custom'}
                          </span>
                        </div>
                      </div>

                      {profiles.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir perfil "${p.name}"?`)) {
                              deleteProfile(p.id);
                            }
                          }}
                          className="opacity-40 hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Excluir mundo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                      {p.scenario || p.personality || p.firstMessage}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-500">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Database className="w-3 h-3 text-amber-500" /> {vaultCount} lore
                        </span>
                        {msgsCount > 1 && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <MessageSquare className="w-3 h-3" /> {msgsCount} msgs
                          </span>
                        )}
                      </div>
                      <span className="text-amber-400 font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5">
                        Jogar →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>
        </div>
      )}

      {/* ============================================================== */}
      {/* TELA 2: TELA DE CHAT ATIVO COM O MUNDO/BOT                     */}
      {/* ============================================================== */}
      {currentScreen === 'chat' && (
        <main className="flex-1 flex flex-col h-full w-full bg-zinc-950 relative">
          <header className="h-14 border-b border-zinc-800 px-3 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2 truncate pr-2">
              <button
                onClick={() => setCurrentScreen('feed')}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                title="Voltar ao Feed de Mundos"
              >
                <ArrowLeft className="w-5 h-5 text-amber-400" />
              </button>
              <div className="flex items-center gap-2 truncate">
                <span className="text-lg shrink-0">{activeProfile.avatar}</span>
                <div className="truncate">
                  <h2 className="font-bold text-xs text-zinc-100 truncate">{activeProfile.name}</h2>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider truncate">
                      {isLoading ? 'pensando...' : currentMode === 'hardcore' ? `${sheet.className} (PbtA)` : 'Freeroam'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Botão rápido para a Ficha Dungeon Paper no modo Hardcore */}
              {currentMode === 'hardcore' && (
                <button
                  onClick={() => setIsDungeonPaperOpen(true)}
                  className="px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 rounded-lg text-rose-300 text-[11px] font-bold flex items-center gap-1 transition"
                  title="Abrir Ficha Dungeon Paper"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>{sheet.hp}/{sheet.maxHp}</span>
                </button>
              )}

              {/* Toggle de Modo */}
              <button
                onClick={() => setCurrentMode(currentMode === 'freeroam' ? 'hardcore' : 'freeroam')}
                className={`p-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
                  currentMode === 'hardcore'
                    ? 'bg-rose-950/50 border-rose-800/80 text-rose-300'
                    : 'bg-amber-950/50 border-amber-800/80 text-amber-300'
                }`}
              >
                {currentMode === 'hardcore' ? (
                  <>
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>PbtA</span>
                  </>
                ) : (
                  <>
                    <Compass className="w-3.5 h-3.5 text-amber-400" />
                    <span>Free</span>
                  </>
                )}
              </button>

              {/* Botão Drawer Direito (Vault / Ficha / Crônica) */}
              <button
                onClick={() => setRightDrawerOpen(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 relative"
                title="Abrir The Vault, Ficha e Crônica"
              >
                {currentMode === 'hardcore' ? (
                  <Activity className="w-4 h-4 text-rose-400" />
                ) : (
                  <Database className="w-4 h-4 text-amber-400" />
                )}
                {currentVault.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              <button
                onClick={() => setIsBYOKOpen(true)}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 relative"
                title="Configurar chaves"
              >
                <Settings className="w-4 h-4 text-zinc-300" />
                {!activeConfig.isReady && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!activeConfig.isReady && (
              <div className="bg-amber-950/40 border border-amber-600/40 rounded-xl p-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 truncate">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-200 truncate">
                    Configurar chave de IA ({activeConfig.provider.toUpperCase()})
                  </p>
                </div>
                <button
                  onClick={() => setIsBYOKOpen(true)}
                  className="px-2.5 py-1 text-[11px] font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-md transition shrink-0"
                >
                  Chave
                </button>
              </div>
            )}

            {/* Aviso sutil de Crônica ativa se houver */}
            {currentChronicle && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-zinc-400">
                <ScrollText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">The Chronicle (Passado Comprimido):</span>
                  <p className="text-[11px] text-zinc-300 line-clamp-2 italic">{currentChronicle}</p>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-950/40 border border-rose-600/50 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-200">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">Erro na chamada de IA:</p>
                  <p className="text-rose-300/90 text-[11px]">{errorMessage}</p>
                </div>
              </div>
            )}

            {currentMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 ${
                  msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-zinc-800 border-zinc-700 text-base'
                  }`}
                >
                  {msg.role === 'user' ? '👤' : activeProfile.avatar}
                </div>

                <div className={`space-y-1 max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-1.5 px-1">
                    <span className="font-semibold text-xs text-amber-400">
                      {msg.role === 'user' ? userPersona.name : activeProfile.name.split(',')[0]}
                    </span>
                  </div>
                  <div
                    className={`rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-amber-600/20 border border-amber-500/30 text-zinc-100 rounded-tr-none'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base shrink-0">
                  {activeProfile.avatar}
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>{activeProfile.name.split(',')[0]} está digitando...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar com Botão PbtA */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 shrink-0">
            <form onSubmit={handleSend} className="relative flex items-center gap-1.5">
              {currentMode === 'hardcore' && (
                <button
                  type="button"
                  onClick={() => setIsPbtaRollOpen(true)}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 text-zinc-100 rounded-xl transition shadow-md shadow-rose-600/20 shrink-0"
                  title="Rolar Movimento PbtA (2d6)"
                >
                  <Dices className="w-4 h-4" />
                </button>
              )}

              <div className="relative flex-1 flex items-center">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  disabled={isLoading}
                  placeholder={
                    isLoading
                      ? 'Aguardando resposta...'
                      : currentMode === 'freeroam'
                      ? `Fale como ${userPersona.name}...`
                      : 'Descreva sua ação ou toque no dado 🎲...'
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 pr-12 transition shadow-inner disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading}
                  className="absolute right-1.5 p-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-zinc-500">
              <span className="truncate flex items-center gap-1">
                <span>{activeConfig.provider.toUpperCase()}</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[9px] text-zinc-400">
                  <Cloud className="w-3 h-3 text-emerald-500" /> Nuvem
                </span>
              </span>
              <span className={currentMode === 'hardcore' ? 'text-rose-400 font-bold' : 'text-amber-400 font-bold'}>
                {currentMode === 'hardcore' ? 'PBTA / DUNGEON WORLD (2d6)' : 'FREEROAM NARRATIVO'}
              </span>
            </div>
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* GAVETA DIREITA: THE VAULT, FICHA PBTA & THE CHRONICLE          */}
      {/* ============================================================== */}
      {rightDrawerOpen && (
        <div 
          onClick={() => setRightDrawerOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity"
        />
      )}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-80 max-w-[88vw] bg-zinc-900 border-l border-zinc-800 flex flex-col justify-between transform transition-transform duration-300 ease-in-out ${
          rightDrawerOpen ? 'translate-x-0 shadow-2xl' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          <div className="h-14 border-b border-zinc-800 px-3 flex items-center justify-between bg-zinc-950/60 shrink-0">
            <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-lg border border-zinc-800">
              <button
                onClick={() => setRightDrawerTab('vault')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  rightDrawerTab === 'vault' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Vault
              </button>
              <button
                onClick={() => setRightDrawerTab('sheet')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  rightDrawerTab === 'sheet' ? 'bg-rose-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Ficha
              </button>
              <button
                onClick={() => setRightDrawerTab('chronicle')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  rightDrawerTab === 'chronicle' ? 'bg-amber-400 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Crônica
              </button>
            </div>
            <button
              onClick={() => setRightDrawerOpen(false)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            {/* ABA 1: THE VAULT */}
            {rightDrawerTab === 'vault' && (
              <>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Pescador de Tags RAG
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      Ativo
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Injeta apenas o Lore relevante para a cena em cada turno, economizando tokens.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    Caixas de Fatos ({currentVault.length})
                  </span>
                  <button
                    onClick={() => setIsAddingVaultBox(!isAddingVaultBox)}
                    className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Adicionar</span>
                  </button>
                </div>

                {isAddingVaultBox && (
                  <form onSubmit={handleManualAddVaultBox} className="bg-zinc-950 p-3 rounded-xl border border-zinc-700 space-y-2">
                    <input
                      type="text"
                      required
                      value={newVaultTag}
                      onChange={(e) => setNewVaultTag(e.target.value)}
                      placeholder="Tag (ex: #Local_Taverna ou #NPC_Kira)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <textarea
                      required
                      rows={2}
                      value={newVaultContent}
                      onChange={(e) => setNewVaultContent(e.target.value)}
                      placeholder="Fato imutável sobre esta entidade..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsAddingVaultBox(false)}
                        className="px-2.5 py-1 text-[10px] text-zinc-400 hover:text-zinc-200"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[10px] rounded-lg transition"
                      >
                        Salvar
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2">
                  {currentVault.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 italic">Nenhum fato registrado ainda.</p>
                  ) : (
                    currentVault.map((box, i) => {
                      const isFishedInScene = activeFishedTags.includes(box.tag);

                      return (
                        <div
                          key={i}
                          className={`group relative rounded-lg p-2.5 text-xs space-y-1 transition border ${
                            isFishedInScene
                              ? 'bg-amber-950/20 border-amber-500/50 shadow-sm'
                              : 'bg-zinc-950/60 border-zinc-800/80'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                              isFishedInScene
                                ? 'text-amber-300 bg-amber-950/80 border-amber-600/70 font-bold'
                                : 'text-zinc-400 bg-zinc-900 border-zinc-700/60'
                            }`}>
                              {box.tag}
                            </span>

                            <div className="flex items-center gap-1">
                              {isFishedInScene && (
                                <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider bg-amber-950/50 px-1 py-0.2 rounded">
                                  Na Cena
                                </span>
                              )}
                              <button
                                onClick={() => handleDeleteVaultBox(box.tag)}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                                title="Excluir do Vault"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-zinc-300 leading-relaxed pt-0.5">
                            {box.content}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}

            {/* ABA 2: FICHA RESUMIDA */}
            {rightDrawerTab === 'sheet' && (
              <div className="space-y-4">
                <button
                  onClick={() => setIsDungeonPaperOpen(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-zinc-100 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ScrollText className="w-4 h-4" />
                  <span>Abrir Ficha Completa (Dungeon Paper)</span>
                </button>

                <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      Pontos de Vida (PV)
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-200">
                      {sheet.hp} / {sheet.maxHp}
                    </span>
                  </div>

                  <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                    <div 
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${(sheet.hp / sheet.maxHp) * 100}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between gap-1 pt-1 text-[11px]">
                    <button
                      onClick={() => updateHp(-5)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-zinc-800 rounded"
                    >
                      -5
                    </button>
                    <button
                      onClick={() => updateHp(-1)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-rose-400 border border-zinc-800 rounded"
                    >
                      -1
                    </button>
                    <button
                      onClick={() => updateHp(+1)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 rounded"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => updateHp(+5)}
                      className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-emerald-400 border border-zinc-800 rounded"
                    >
                      +5
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Atributos DW ({sheet.className})
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(sheet.stats).map(([stat, data]) => (
                      <div key={stat} className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-zinc-300">{stat}</span>
                          <span className="text-[9px] text-zinc-500 block">val: {data.value}</span>
                        </div>
                        <span className={`text-xs font-mono font-black px-1.5 py-0.5 rounded border ${
                          data.mod >= 0 ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400' : 'bg-rose-950/60 border-rose-800 text-rose-400'
                        }`}>
                          {data.mod >= 0 ? `+${data.mod}` : data.mod}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ABA 3: THE CHRONICLE (COMPRESSOR TIER A) */}
            {rightDrawerTab === 'chronicle' && (
              <div className="space-y-3">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                      The Chronicle (Tier A)
                    </span>
                    <span className="text-[9px] text-zinc-400">{currentMessages.length} turnos</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Comprime turnos antigos em uma linha do tempo macro contínua para campanhas infinitas sem estourar o contexto da IA.
                  </p>
                </div>

                {currentMessages.length > 5 && (
                  <button
                    onClick={handleCompressChronicle}
                    disabled={isCompressing}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isCompressing ? 'animate-spin' : ''}`} />
                    <span>{isCompressing ? 'Comprimindo com IA...' : 'Comprimir Turnos Antigos'}</span>
                  </button>
                )}

                <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">Crônica Registrada:</span>
                  {currentChronicle ? (
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif">
                      {currentChronicle}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      A história deste mundo acabou de começar. Quando houver vários turnos acumulados, a crônica sintetizará o passado automaticamente.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Modais */}
      <BYOKModal
        isOpen={isBYOKOpen}
        onClose={() => setIsBYOKOpen(false)}
        settings={settings}
        onSave={saveSettings}
      />

      <SanguessugaModal
        isOpen={isSanguessugaOpen}
        onClose={() => setIsSanguessugaOpen(false)}
        onAddProfile={addProfile}
        userPersona={userPersona}
        onSaveUserPersona={saveUserPersona}
        byokConfig={activeConfig}
      />

      <PbtaRollModal
        isOpen={isPbtaRollOpen}
        onClose={() => setIsPbtaRollOpen(false)}
        sheet={{
          ...sheet,
          stats: {
            FOR: sheet.stats.FOR.mod,
            DES: sheet.stats.DES.mod,
            CON: sheet.stats.CON.mod,
            INT: sheet.stats.INT.mod,
            SAB: sheet.stats.SAB.mod,
            CAR: sheet.stats.CAR.mod,
          }
        }}
        onRollConfirmed={handlePbtaRollConfirmed}
      />

      <DungeonPaperModal
        isOpen={isDungeonPaperOpen}
        onClose={() => setIsDungeonPaperOpen(false)}
        sheet={sheet}
        onUpdateHp={updateHp}
        onUpdateStatScore={updateStatScore}
        onChangeClass={changeClass}
        onAddBond={addBond}
        onRemoveBond={removeBond}
        onAddItem={addItem}
        onRemoveItem={removeItem}
        onSaveFullSheet={saveSheet}
      />
    </div>
  );
}
