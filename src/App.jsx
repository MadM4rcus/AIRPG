import { useState, useRef, useEffect } from 'react';
import {
  Key,
  Settings,
  Sparkles,
  Swords,
  Database,
  BookOpen,
  PlusCircle,
  Send,
  X,
  Loader2,
  AlertCircle,
  Trash2,
  ArrowLeft,
  MessageSquare,
  Search,
  Plus,
  Dices,
  Heart,
  Activity,
  ScrollText,
  Cloud,
  CloudOff,
  RotateCw,
  RotateCcw,
  RefreshCw,
  Pencil,
  Check,
  LogOut,
  Shield,
  Crown,
  FastForward,
  Lightbulb,
} from 'lucide-react';
import { useBYOK } from './hooks/useBYOK';
import { useProfiles } from './hooks/useProfiles';
import { useCodex } from './hooks/useCodex';
import { useCharacterSheet } from './hooks/useCharacterSheet';
import BYOKModal from './components/BYOKModal';
import SanguessugaModal from './components/SanguessugaModal';
import CodexModal from './components/CodexModal';
import PersonaLibraryModal from './components/PersonaLibraryModal';
import PbtaRollModal from './components/PbtaRollModal';
import DungeonPaperModal from './components/DungeonPaperModal';
import LoginScreen from './components/LoginScreen';
import { callLLM } from './services/llmService';
import { buildSystemPrompt } from './engine/promptBuilder';
import { parseAssistantResponse } from './engine/stateParser';
import { fishRelevantLore, fishRelevantCodex } from './engine/vaultFisher';
import { generateContinuationChunk, generateUserReplySuggestion } from './engine/chatAssist';
import { compressMessagesIntoChronicle } from './engine/chronicleCompressor';
import {
  subscribeToAuth,
  logoutUser,
  loadUserDocFromCloud,
  loadCharactersFromCloud,
  loadCampaignsFromCloud,
  loadCodexFromCloud,
  loadAllChatsFromCloud,
  saveChatSessionToCloud,
  saveEntityToCloud,
} from './services/firebase';

function AvatarDisplay({ avatar, className = 'text-base' }) {
  if (typeof avatar === 'string' && avatar.startsWith('http')) {
    return (
      <img
        src={avatar}
        alt="Avatar"
        className="w-full h-full object-cover rounded-xl"
      />
    );
  }
  return <span className={className}>{avatar || '🎭'}</span>;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuth((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const uid = user?.uid || null;

  const {
    settings,
    updateSettings,
    hydrateByokFromCloud,
    activeModel,
    isConfigured,
  } = useBYOK(uid);

  const {
    characters,
    campaigns,
    activeProfile,
    setActiveProfileId,
    addProfile,
    deleteProfile,
    personas,
    activePersonaId,
    userPersona,
    selectPersona,
    savePersona,
    deletePersona,
    hydrateFromCloud,
  } = useProfiles(uid);

  const {
    codex,
    addCodexEntry,
    deleteCodexEntry,
    hydrateCodexFromCloud,
  } = useCodex(uid);

  const {
    sheet,
    saveSheet,
    hydrateSheetFromCloud,
    updateHp,
    updateStatScore,
    changeClass,
    addBond,
    removeBond,
    addItem,
    removeItem,
  } = useCharacterSheet(uid);

  const [currentScreen, setCurrentScreen] = useState('feed');
  const [feedTab, setFeedTab] = useState('chat'); // 'chat' | 'rpg'
  const [searchFilter, setSearchFilter] = useState('');

  const [isBYOKOpen, setIsBYOKOpen] = useState(false);
  const [isSanguessugaOpen, setIsSanguessugaOpen] = useState(false);
  const [sanguessugaInitialType, setSanguessugaInitialType] = useState('chat');
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isPbtaRollOpen, setIsPbtaRollOpen] = useState(false);
  const [isDungeonPaperOpen, setIsDungeonPaperOpen] = useState(false);
  const [isPersonaOpen, setIsPersonaOpen] = useState(false);

  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);
  const [rightDrawerTab, setRightDrawerTab] = useState('vault');

  // Interruptor Realista (false = padrão) vs Modo Deus (true)
  const [godMode, setGodMode] = useState(false);

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState('saved');
  const [errorMessage, setErrorMessage] = useState('');

  // Estado de edição inline de mensagens
  const [editingMsgIdx, setEditingMsgIdx] = useState(null);
  const [editingMsgText, setEditingMsgText] = useState('');

  const [activeFishedTags, setActiveFishedTags] = useState([]);
  const [activeCodexItems, setActiveCodexItems] = useState([]);
  const [pinnedByEntity, setPinnedByEntity] = useState({});

  const [isAddingVaultBox, setIsAddingVaultBox] = useState(false);
  const [newVaultTag, setNewVaultTag] = useState('');
  const [newVaultContent, setNewVaultContent] = useState('');

  const chatKey = uid ? `airpg_chat_histories_${uid}` : 'airpg_chat_histories';
  const vaultKey = uid ? `airpg_vaults_data_${uid}` : 'airpg_vaults_data';
  const chronicleKey = uid ? `airpg_chronicles_data_${uid}` : 'airpg_chronicles_data';

  const [chatHistories, setChatHistories] = useState({});
  const [vaults, setVaults] = useState({});
  const [chronicles, setChronicles] = useState({});

  // Carrega dados locais e sincroniza da nuvem ao logar
  useEffect(() => {
    if (!uid) {
      setChatHistories({});
      setVaults({});
      setChronicles({});
      setCurrentScreen('feed');
      return;
    }

    try {
      const localChats = localStorage.getItem(chatKey);
      if (localChats) setChatHistories(JSON.parse(localChats));
      const localVaults = localStorage.getItem(vaultKey);
      if (localVaults) setVaults(JSON.parse(localVaults));
      const localChronicles = localStorage.getItem(chronicleKey);
      if (localChronicles) setChronicles(JSON.parse(localChronicles));
    } catch (e) {}

    let isMounted = true;
    async function restoreFromCloud() {
      setCloudSyncStatus('syncing');
      try {
        const [userDoc, cloudChars, cloudCamps, cloudCodex, cloudChats] =
          await Promise.all([
            loadUserDocFromCloud(uid),
            loadCharactersFromCloud(uid),
            loadCampaignsFromCloud(uid),
            loadCodexFromCloud(uid),
            loadAllChatsFromCloud(uid),
          ]);

        if (!isMounted) return;

        if (userDoc?.byokSettings) {
          hydrateByokFromCloud(userDoc.byokSettings);
        }
        if (userDoc?.dungeonPaperSheet) {
          hydrateSheetFromCloud(userDoc.dungeonPaperSheet);
        }
        hydrateFromCloud(cloudChars, cloudCamps, userDoc?.userPersona, userDoc);
        hydrateCodexFromCloud(cloudCodex);

        if (cloudChats && Object.keys(cloudChats).length > 0) {
          const nextChats = {};
          const nextVaults = {};
          const nextChronicles = {};

          Object.entries(cloudChats).forEach(([profId, session]) => {
            if (Array.isArray(session.messages)) nextChats[profId] = session.messages;
            if (Array.isArray(session.vault)) nextVaults[profId] = session.vault;
            if (typeof session.chronicle === 'string') nextChronicles[profId] = session.chronicle;
          });

          setChatHistories((prev) => {
            const merged = { ...prev, ...nextChats };
            try { localStorage.setItem(chatKey, JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
          setVaults((prev) => {
            const merged = { ...prev, ...nextVaults };
            try { localStorage.setItem(vaultKey, JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
          setChronicles((prev) => {
            const merged = { ...prev, ...nextChronicles };
            try { localStorage.setItem(chronicleKey, JSON.stringify(merged)); } catch (e) {}
            return merged;
          });
        }
        setCloudSyncStatus('saved');
      } catch (err) {
        if (isMounted) setCloudSyncStatus('error');
      }
    }

    restoreFromCloud();
    return () => {
      isMounted = false;
    };
  }, [uid]);

  const messagesEndRef = useRef(null);

  const primaryByokConfig = {
    provider: settings.provider,
    apiKey: settings.apiKey,
    model: activeModel,
    customEndpointUrl: settings.customEndpointUrl,
    temperature: settings.temperature ?? 0.85,
    isReady: isConfigured,
  };

  const chronicleByokConfig =
    settings.chronicleEnabled && settings.chronicleApiKey?.trim()
      ? {
          provider: settings.chronicleProvider,
          apiKey: settings.chronicleApiKey,
          model: settings.chronicleModel,
          temperature: 0.3,
          isReady: true,
        }
      : primaryByokConfig;

  useEffect(() => {
    if (currentScreen === 'chat' && user && editingMsgIdx === null) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistories, isLoading, currentScreen, user, editingMsgIdx]);

  if (authLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-amber-400 animate-spin" />
        <span className="text-xs text-zinc-400">Verificando sessão...</span>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const isRpgSession = activeProfile?.type === 'rpg';

  const currentMessages = chatHistories[activeProfile.id] || [
    { role: 'assistant', content: activeProfile.firstMessage },
  ];

  const currentVault = vaults[activeProfile.id] || activeProfile.initialVault || [];
  const currentChronicle = chronicles[activeProfile.id] || '';
  const currentPinnedIds =
    pinnedByEntity[activeProfile.id] ?? activeProfile.pinnedCodexIds ?? [];

  const handleToggleCodexPin = (codexId) => {
    const nextPinned = currentPinnedIds.includes(codexId)
      ? currentPinnedIds.filter((id) => id !== codexId)
      : [...currentPinnedIds, codexId];

    setPinnedByEntity((prev) => ({
      ...prev,
      [activeProfile.id]: nextPinned,
    }));

    if (uid) {
      saveEntityToCloud(uid, {
        ...activeProfile,
        pinnedCodexIds: nextPinned,
      });
    }
  };

  // Grava toda a sessão (mensagens + vault + crônica) em 1 única escrita no Firestore
  const persistSessionState = async (
    newMsgs,
    newVault = currentVault,
    newChronicle = currentChronicle,
    syncToCloud = true
  ) => {
    setChatHistories((prev) => {
      const updated = { ...prev, [activeProfile.id]: newMsgs };
      try { localStorage.setItem(chatKey, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setVaults((prev) => {
      const updated = { ...prev, [activeProfile.id]: newVault };
      try { localStorage.setItem(vaultKey, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    setChronicles((prev) => {
      const updated = { ...prev, [activeProfile.id]: newChronicle };
      try { localStorage.setItem(chronicleKey, JSON.stringify(updated)); } catch (e) {}
      return updated;
    });

    if (syncToCloud && uid) {
      setCloudSyncStatus('syncing');
      const ok = await saveChatSessionToCloud(
        uid,
        activeProfile.id,
        newMsgs,
        newVault,
        newChronicle
      );
      setCloudSyncStatus(ok ? 'saved' : 'error');
    }
  };

  // Apagar uma mensagem específica do histórico
  const handleDeleteMessage = async (msgIndex) => {
    if (msgIndex === 0) return;
    if (editingMsgIdx === msgIndex) {
      setEditingMsgIdx(null);
      setEditingMsgText('');
    }
    const nextMsgs = currentMessages.filter((_, idx) => idx !== msgIndex);
    setErrorMessage('');
    await persistSessionState(nextMsgs, currentVault, currentChronicle, true);
  };

  // Iniciar edição de qualquer mensagem (usuário ou IA)
  const handleStartEditMessage = (idx, content) => {
    setEditingMsgIdx(idx);
    setEditingMsgText(content);
  };

  const handleCancelEditMessage = () => {
    setEditingMsgIdx(null);
    setEditingMsgText('');
  };

  const handleSaveEditMessage = async (idx) => {
    const trimmed = editingMsgText.trim();
    if (!trimmed) return;
    const nextMsgs = currentMessages.map((m, i) =>
      i === idx ? { ...m, content: trimmed } : m
    );
    setEditingMsgIdx(null);
    setEditingMsgText('');
    setErrorMessage('');
    await persistSessionState(nextMsgs, currentVault, currentChronicle, true);
  };

  // Limpar chat / Iniciar nova conversa do zero com o mesmo bot/campanha
  const handleResetChat = async () => {
    const confirmed = confirm(
      `Iniciar uma NOVA CONVERSA com "${activeProfile.name}"?\n\nIsso apagará as mensagens atuais, zerará a Crônica e restaurará o Vault inicial.`
    );
    if (!confirmed) return;

    const freshMessages = [
      { role: 'assistant', content: activeProfile.firstMessage },
    ];
    const freshVault = activeProfile.initialVault || [];

    setEditingMsgIdx(null);
    setErrorMessage('');
    setActiveFishedTags([]);
    setActiveCodexItems([]);
    await persistSessionState(freshMessages, freshVault, '', true);
  };

  const handleOpenChat = (profileId) => {
    setErrorMessage('');
    setEditingMsgIdx(null);
    setActiveProfileId(profileId);
    setRightDrawerTab('vault');
    setCurrentScreen('chat');
  };

  const openCreatorModal = (targetType) => {
    setSanguessugaInitialType(targetType);
    setIsSanguessugaOpen(true);
  };

  const handleLogout = async () => {
    if (confirm('Deseja sair da sua conta Google?')) {
      await logoutUser();
    }
  };

  const handleManualAddVaultBox = (e) => {
    e.preventDefault();
    if (!newVaultTag.trim() || !newVaultContent.trim()) return;
    const formattedTag = newVaultTag.startsWith('#')
      ? newVaultTag.trim()
      : `#${newVaultTag.trim()}`;
    const nextVault = [
      { tag: formattedTag, content: newVaultContent.trim() },
      ...currentVault,
    ];
    persistSessionState(currentMessages, nextVault, currentChronicle, true);
    setNewVaultTag('');
    setNewVaultContent('');
    setIsAddingVaultBox(false);
  };

  const handleDeleteVaultBox = (tagToDelete) => {
    const nextVault = currentVault.filter((b) => b.tag !== tagToDelete);
    persistSessionState(currentMessages, nextVault, currentChronicle, true);
  };

  const runChronicleCompression = async (
    msgsSnapshot,
    vaultSnapshot = currentVault,
    chronicleSnapshot = currentChronicle,
    silent = false
  ) => {
    if (msgsSnapshot.length <= 8 || isCompressing) return;
    setIsCompressing(true);

    try {
      const turnsToCompress = msgsSnapshot.slice(1, -6);
      const remainingMessages = [msgsSnapshot[0], ...msgsSnapshot.slice(-6)];

      const newChronicle = await compressMessagesIntoChronicle({
        oldMessages: turnsToCompress,
        existingChronicle: chronicleSnapshot,
        byokConfig: chronicleByokConfig,
      });

      await persistSessionState(remainingMessages, vaultSnapshot, newChronicle, true);
      if (!silent) {
        alert('The Chronicle atualizado! Turnos antigos sintetizados.');
      }
    } catch (err) {
      console.warn('Erro ao comprimir Chronicle:', err);
    } finally {
      setIsCompressing(false);
    }
  };

  // Núcleo compartilhado de chamada à LLM a partir de um array de mensagens
  const generateAssistantTurn = async (
    baseMessages,
    mechanicalInjection = ''
  ) => {
    if (!primaryByokConfig.isReady) {
      setIsBYOKOpen(true);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    try {
      const recentContextText = baseMessages
        .slice(-4)
        .map((m) => m.content)
        .join(' ');

      const activeBoxes = fishRelevantLore(currentVault, recentContextText, 8);
      const fishedCodex = fishRelevantCodex(
        codex,
        recentContextText,
        currentPinnedIds,
        15
      );

      setActiveFishedTags(activeBoxes.map((b) => b.tag));
      setActiveCodexItems(fishedCodex);

      const lastUserMsg =
        [...baseMessages].reverse().find((m) => m.role === 'user')?.content || '';

      const systemPrompt = buildSystemPrompt({
        entityType: activeProfile.type || 'chat',
        characterName: activeProfile.name,
        personality: activeProfile.personality,
        scenario: activeProfile.scenario,
        vaultContext: activeBoxes,
        codexContext: fishedCodex,
        chronicle: currentChronicle,
        userPersona: userPersona,
        characterSheet: isRpgSession ? sheet : null,
        godMode,
        firstMessage: activeProfile.firstMessage || baseMessages[0]?.content || '',
        lastUserMessage: lastUserMsg,
      });

      const recentBuffer = baseMessages.slice(-8);

      const messagesForLLM =
        mechanicalInjection && recentBuffer.length > 0
          ? [
              ...recentBuffer.slice(0, -1),
              {
                role: recentBuffer[recentBuffer.length - 1].role,
                content: `${
                  recentBuffer[recentBuffer.length - 1].content
                }\n\n${mechanicalInjection}`,
              },
            ]
          : recentBuffer;

      const rawResponse = await callLLM({
        messages: messagesForLLM,
        systemPrompt,
        byokConfig: primaryByokConfig,
      });

      const { cleanText, stateUpdate } = parseAssistantResponse(rawResponse);
      const finalMessages = [
        ...baseMessages,
        { role: 'assistant', content: cleanText },
      ];

      let nextVault = currentVault;
      if (stateUpdate?.vault_updates && Array.isArray(stateUpdate.vault_updates)) {
        nextVault = [...currentVault];
        stateUpdate.vault_updates.forEach((update) => {
          const idx = nextVault.findIndex(
            (b) => b.tag.toLowerCase() === update.tag?.toLowerCase()
          );
          if (idx >= 0) {
            nextVault[idx] = update;
          } else if (update.tag && update.content) {
            nextVault.push(update);
          }
        });
      }

      if (finalMessages.length > 12) {
        persistSessionState(finalMessages, nextVault, currentChronicle, false);
        runChronicleCompression(finalMessages, nextVault, currentChronicle, true);
      } else {
        await persistSessionState(finalMessages, nextVault, currentChronicle, true);
      }
    } catch (err) {
      console.error('Erro na chamada da LLM:', err);
      setErrorMessage(err.message || 'Erro inesperado ao se comunicar com a IA.');
      await persistSessionState(baseMessages, currentVault, currentChronicle, true);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSendMessage = async (textToSend, mechanicalInjection = '') => {
    if (!textToSend.trim() || isLoading) return;

    if (!primaryByokConfig.isReady) {
      setIsBYOKOpen(true);
      return;
    }

    const userText = textToSend.trim();
    setInputMessage('');
    setEditingMsgIdx(null);

    const updatedMessages = [
      ...currentMessages,
      { role: 'user', content: userText },
    ];
    persistSessionState(updatedMessages, currentVault, currentChronicle, false);

    await generateAssistantTurn(updatedMessages, mechanicalInjection);
  };

  // Regenerar / Tentar de novo apenas a última resposta da IA
  const handleRegenerateLastResponse = async () => {
    if (isLoading || currentMessages.length <= 1) return;
    const lastMsg = currentMessages[currentMessages.length - 1];
    if (lastMsg.role !== 'assistant') return;

    setEditingMsgIdx(null);
    const trimmedHistory = currentMessages.slice(0, -1);
    persistSessionState(trimmedHistory, currentVault, currentChronicle, false);

    await generateAssistantTurn(trimmedHistory);
  };

  const handleContinueScene = async () => {
    if (isLoading || isSuggesting) return;
    if (!primaryByokConfig.isReady) {
      setIsBYOKOpen(true);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);
    setEditingMsgIdx(null);

    try {
      const recentContextText = currentMessages
        .slice(-4)
        .map((m) => m.content)
        .join(' ');

      const activeBoxes = fishRelevantLore(currentVault, recentContextText, 8);
      const fishedCodex = fishRelevantCodex(
        codex,
        recentContextText,
        currentPinnedIds,
        15
      );

      setActiveFishedTags(activeBoxes.map((b) => b.tag));
      setActiveCodexItems(fishedCodex);

      const lastUserMessage =
        [...currentMessages].reverse().find((m) => m.role === 'user')?.content || '';

      const systemPrompt = buildSystemPrompt({
        entityType: activeProfile.type || 'chat',
        characterName: activeProfile.name,
        personality: activeProfile.personality,
        scenario: activeProfile.scenario,
        vaultContext: activeBoxes,
        codexContext: fishedCodex,
        chronicle: currentChronicle,
        userPersona,
        characterSheet: isRpgSession ? sheet : null,
        godMode,
        firstMessage: activeProfile.firstMessage || currentMessages[0]?.content || '',
        lastUserMessage,
      });

      const rawContinuation = await generateContinuationChunk({
        messages: currentMessages,
        systemPrompt,
        byokConfig: primaryByokConfig,
      });
      const { cleanText, stateUpdate } = parseAssistantResponse(rawContinuation);

      let finalMessages;
      if (currentMessages[currentMessages.length - 1]?.role === 'assistant') {
        finalMessages = currentMessages.map((message, idx) =>
          idx === currentMessages.length - 1
            ? { ...message, content: `${message.content}\n\n${cleanText.trim()}` }
            : message
        );
      } else {
        finalMessages = [
          ...currentMessages,
          { role: 'assistant', content: cleanText.trim() },
        ];
      }

      let nextVault = currentVault;
      if (stateUpdate?.vault_updates && Array.isArray(stateUpdate.vault_updates)) {
        nextVault = [...currentVault];
        stateUpdate.vault_updates.forEach((update) => {
          const idx = nextVault.findIndex(
            (b) => b.tag.toLowerCase() === update.tag?.toLowerCase()
          );
          if (idx >= 0) {
            nextVault[idx] = update;
          } else if (update.tag && update.content) {
            nextVault.push(update);
          }
        });
      }

      await persistSessionState(
        finalMessages,
        nextVault,
        currentChronicle,
        true
      );
    } catch (err) {
      console.error('Erro ao continuar a cena:', err);
      setErrorMessage(err.message || 'Erro inesperado ao continuar a cena.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestUserReply = async () => {
    if (isLoading || isSuggesting) return;
    if (!primaryByokConfig.isReady) {
      setIsBYOKOpen(true);
      return;
    }

    setErrorMessage('');
    setIsSuggesting(true);

    try {
      const suggestion = await generateUserReplySuggestion({
        messages: currentMessages,
        userPersona,
        characterName: activeProfile.name,
        scenario: activeProfile.scenario || activeProfile.personality,
        byokConfig: primaryByokConfig,
      });
      const cleaned = suggestion.replace(/^["'“]|["'”]$/g, '').trim();
      setInputMessage(cleaned);
    } catch (err) {
      console.error('Erro ao sugerir resposta:', err);
      setErrorMessage(err.message || 'Erro inesperado ao sugerir uma resposta.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    executeSendMessage(inputMessage);
  };

  const handlePbtaRollConfirmed = (rollData) => {
    const userActionMsg = `🎲 **[Movimento: ${rollData.tierName}]** ${
      inputMessage.trim() || 'Ajo decisivamente segundo o movimento.'
    }`;
    executeSendMessage(userActionMsg, rollData.promptInjection);
  };

  const currentList = feedTab === 'rpg' ? campaigns : characters;
  const filteredList = currentList.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.tag || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="fixed inset-0 flex h-[100dvh] w-full bg-zinc-950 text-zinc-100 font-sans overflow-hidden select-none">
      {/* ============================================================== */}
      {/* TELA 1: FEED / DOIS MUNDOS SEPARADOS + BIBLIOTECA              */}
      {/* ============================================================== */}
      {currentScreen === 'feed' && (
        <div className="flex-1 flex flex-col h-full w-full bg-zinc-950 overflow-y-auto">
          <header className="h-14 border-b border-zinc-800/80 px-4 flex items-center justify-between bg-zinc-950/90 backdrop-blur-md sticky top-0 z-20 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xs">
                AI
              </div>
              <h1 className="font-extrabold text-sm tracking-wide text-zinc-100">
                AIRPG
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCodexOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-amber-300 hover:border-amber-500/40"
                title="Biblioteca Compartilhada de NPCs, Locais e Regras"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-medium">
                  Biblioteca ({codex.length})
                </span>
              </button>

              <button
                onClick={() => setIsPersonaOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 hover:border-zinc-700"
                title="Biblioteca de Personas (Alternar ou editar personagem)"
              >
                <span className="text-sm leading-none">{userPersona.avatar || '🧑'}</span>
                <span className="font-medium max-w-[80px] truncate">
                  {userPersona.name}
                </span>
              </button>

              <button
                onClick={() => setIsBYOKOpen(true)}
                className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:border-zinc-700 relative"
                title="Configurar chaves BYOK"
              >
                <Key className="w-4 h-4 text-amber-400" />
                {!primaryByokConfig.isReady && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 hover:text-rose-400 hover:border-rose-800/60 transition"
                title={`Conectado como ${user.email} — Clique para sair`}
              >
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-5 h-5 rounded-full"
                  />
                ) : (
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                    {user.email?.[0]?.toUpperCase() || 'G'}
                  </span>
                )}
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <main className="p-4 space-y-5 max-w-3xl mx-auto w-full pb-12">
            {!primaryByokConfig.isReady && (
              <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-lg">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-amber-200">
                      Chave de IA Pendente
                    </p>
                    <p className="text-[11px] text-amber-400/80">
                      Configure uma chave gratuita (OpenRouter, Groq ou Gemini) no BYOK.
                    </p>
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

            {/* Seletor de Dois Mundos Separados */}
            <div className="grid grid-cols-2 gap-2.5 bg-zinc-900/70 p-1.5 rounded-2xl border border-zinc-800">
              <button
                onClick={() => setFeedTab('chat')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  feedTab === 'chat'
                    ? 'bg-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Conversas Livres ({characters.length})</span>
              </button>

              <button
                onClick={() => setFeedTab('rpg')}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  feedTab === 'rpg'
                    ? 'bg-emerald-400 text-zinc-950 shadow-lg shadow-emerald-500/20'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Swords className="w-4 h-4" />
                <span>Campanhas RPG ({campaigns.length})</span>
              </button>
            </div>

            {/* Banner Contextual do Modo Selecionado */}
            <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 via-zinc-900/60 to-zinc-950 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span
                  className={`inline-block text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border ${
                    feedTab === 'rpg'
                      ? 'text-emerald-300 bg-emerald-950/60 border-emerald-800/40'
                      : 'text-amber-400 bg-amber-950/60 border-amber-800/40'
                  }`}
                >
                  {feedTab === 'rpg'
                    ? 'Mestre PbtA • Ficha & Dados 2d6'
                    : 'Freeroam Narrativo • Sem Ficha'}
                </span>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100">
                  {feedTab === 'rpg'
                    ? 'Campanhas onde os dados e a ficha são a lei'
                    : 'Mundos vivos e personagens com vontade própria'}
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {feedTab === 'rpg'
                    ? 'Inclui Ficha Dungeon Paper, PV e rolagem 2d6 conectada à Biblioteca de NPCs e Locais.'
                    : 'Roleplay livre com múltiplos NPCs, locais e regras de mundo puxados sob demanda.'}
                </p>
              </div>

              <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
                <button
                  onClick={() => openCreatorModal(feedTab)}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl transition shadow-lg ${
                    feedTab === 'rpg'
                      ? 'bg-emerald-400 hover:bg-emerald-300 text-zinc-950 shadow-emerald-500/20'
                      : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>
                    {feedTab === 'rpg'
                      ? '+ Nova Campanha RPG'
                      : '+ Nova Conversa Livre'}
                  </span>
                </button>

                <button
                  onClick={() => setIsCodexOpen(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs rounded-xl border border-zinc-700 transition"
                >
                  <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  <span>NPCs & Locais ({codex.length})</span>
                </button>
              </div>
            </div>

            {/* Busca */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {feedTab === 'rpg'
                  ? `Suas Campanhas (${filteredList.length})`
                  : `Suas Conversas (${filteredList.length})`}
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
              {filteredList.map((p) => {
                const vaultCount = (vaults[p.id] || p.initialVault || []).length;
                const msgsCount = (chatHistories[p.id] || []).length;

                return (
                  <div
                    key={p.id}
                    onClick={() => handleOpenChat(p.id)}
                    className={`group relative cursor-pointer rounded-xl border bg-zinc-900/60 hover:bg-zinc-900 p-4 transition-all duration-200 flex flex-col justify-between space-y-3 shadow-md ${
                      feedTab === 'rpg'
                        ? 'border-zinc-800 hover:border-emerald-500/50'
                        : 'border-zinc-800 hover:border-amber-500/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-11 h-11 shrink-0 bg-zinc-950/80 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden">
                          <AvatarDisplay avatar={p.avatar} className="text-2xl" />
                        </div>
                        <div>
                          <h4
                            className={`font-bold text-xs text-zinc-100 transition ${
                              feedTab === 'rpg'
                                ? 'group-hover:text-emerald-300'
                                : 'group-hover:text-amber-400'
                            }`}
                          >
                            {p.name}
                          </h4>
                          <span className="inline-block mt-0.5 text-[9px] font-semibold text-zinc-400 bg-zinc-950/70 border border-zinc-800 px-1.5 py-0.2 rounded">
                            {p.tag || (feedTab === 'rpg' ? 'PbtA' : 'Freeroam')}
                          </span>
                        </div>
                      </div>

                      {currentList.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Excluir "${p.name}"?`)) {
                              deleteProfile(p.id, p.type);
                            }
                          }}
                          className="opacity-40 hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
                          title="Excluir"
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
                          <Database className="w-3 h-3 text-amber-500" />{' '}
                          {vaultCount} fatos
                        </span>
                        {msgsCount > 1 && (
                          <span className="flex items-center gap-1 text-zinc-400">
                            <MessageSquare className="w-3 h-3" /> {msgsCount} msgs
                          </span>
                        )}
                      </div>
                      <span
                        className={`font-semibold group-hover:translate-x-0.5 transition flex items-center gap-0.5 ${
                          feedTab === 'rpg'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {feedTab === 'rpg' ? 'Jogar Campanha →' : 'Conversar →'}
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
      {/* TELA 2: CHAT ATIVO (EDITAR, REGENERAR ÚLTIMA, APAGAR, RESET)   */}
      {/* ============================================================== */}
      {currentScreen === 'chat' && (
        <main className="flex-1 flex flex-col h-full w-full bg-zinc-950 relative overflow-hidden">
          <header className="sticky top-0 z-20 h-14 border-b border-zinc-800 px-2 sm:px-3 flex items-center justify-between bg-zinc-950/95 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 pr-1">
              <button
                onClick={() => setCurrentScreen('feed')}
                className="p-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 shrink-0"
                title="Voltar ao início"
              >
                <ArrowLeft className="w-5 h-5 text-amber-400" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 shrink-0 flex items-center justify-center overflow-hidden rounded-lg">
                  <AvatarDisplay
                    avatar={activeProfile.avatar}
                    className="text-lg"
                  />
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-zinc-100 truncate">
                    {activeProfile.name}
                  </h2>
                  <div className="flex items-center gap-1">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isLoading ? 'bg-amber-400 animate-ping' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-[9px] text-zinc-400 uppercase tracking-wider truncate">
                      {isLoading
                        ? 'pensando...'
                        : isRpgSession
                        ? `${sheet.className} • PbtA`
                        : 'Freeroam'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {/* PV apenas em Campanhas RPG */}
              {isRpgSession && (
                <button
                  onClick={() => setIsDungeonPaperOpen(true)}
                  className="px-1.5 sm:px-2 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/80 rounded-lg text-rose-300 text-[11px] font-bold flex items-center gap-1 transition"
                  title="Abrir Ficha Dungeon Paper"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  <span>
                    {sheet.hp}/{sheet.maxHp}
                  </span>
                </button>
              )}

              {/* Atalho Biblioteca de Personas */}
              <button
                onClick={() => setIsPersonaOpen(true)}
                className="p-1.5 px-2 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300 hover:border-amber-500/40 flex items-center gap-1 transition"
                title={`Jogando como: ${userPersona.name} (Clique para trocar persona)`}
              >
                <span className="text-xs leading-none">{userPersona.avatar || '🧑'}</span>
                <span className="hidden md:inline max-w-[70px] truncate font-medium">
                  {userPersona.name}
                </span>
              </button>

              {/* Interruptor Realista (Padrão) vs Modo Deus */}
              <button
                onClick={() => setGodMode((prev) => !prev)}
                className={`p-1.5 px-2 rounded-lg border text-[11px] font-semibold flex items-center gap-1 transition ${
                  godMode
                    ? 'bg-purple-950/60 border-purple-600/70 text-purple-300'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-600'
                }`}
                title={
                  godMode
                    ? 'Modo Deus Ativo: suas declarações têm poder absoluto'
                    : 'Modo Realista Ativo: NPCs têm vontade própria e os dados/regras mandam'
                }
              >
                {godMode ? (
                  <>
                    <Crown className="w-3.5 h-3.5 text-purple-400" />
                    <span className="hidden sm:inline">Modo Deus</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Realista</span>
                  </>
                )}
              </button>

              {/* Nova Conversa / Reiniciar Chat */}
              <button
                onClick={handleResetChat}
                disabled={isLoading || currentMessages.length <= 1}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 disabled:opacity-30 transition"
                title="Nova conversa / Reiniciar chat do zero"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Atalho Biblioteca (Codex) */}
              <button
                onClick={() => setIsCodexOpen(true)}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800"
                title="Abrir Biblioteca de NPCs, Locais e Regras"
              >
                <BookOpen className="w-4 h-4" />
              </button>

              {/* Gaveta Vault / Crônica (e Ficha se for RPG) */}
              <button
                onClick={() => setRightDrawerOpen(true)}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 relative"
                title="Abrir Memória (Vault & Crônica)"
              >
                {isRpgSession ? (
                  <Activity className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Database className="w-4 h-4 text-amber-400" />
                )}
                {currentVault.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>

              <button
                onClick={() => setIsBYOKOpen(true)}
                className="p-1.5 sm:p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 relative"
                title="Configurar chaves"
              >
                <Settings className="w-4 h-4 text-zinc-300" />
                {!primaryByokConfig.isReady && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                )}
              </button>
            </div>
          </header>

          {/* ÁREA DE MENSAGENS ROLÁVEL */}
          <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-4">
            {currentChronicle && (
              <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-zinc-400">
                <ScrollText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                    The Chronicle (Passado Comprimido):
                  </span>
                  <p className="text-[11px] text-zinc-300 line-clamp-2 italic">
                    {currentChronicle}
                  </p>
                </div>
              </div>
            )}

            {currentMessages.map((msg, idx) => {
              const isEditingThis = editingMsgIdx === idx;
              const isLastAssistantMsg =
                idx === currentMessages.length - 1 &&
                idx > 0 &&
                msg.role === 'assistant';

              return (
                <div
                  key={idx}
                  className={`group flex items-start gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm shrink-0 overflow-hidden ${
                      msg.role === 'user'
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-zinc-800 border-zinc-700 text-base'
                    }`}
                  >
                    {msg.role === 'user' ? (
                      <span>{userPersona.avatar || '🧑'}</span>
                    ) : (
                      <AvatarDisplay avatar={activeProfile.avatar} />
                    )}
                  </div>

                  <div
                    className={`space-y-1 max-w-[85%] ${
                      isEditingThis ? 'w-full' : ''
                    } ${msg.role === 'user' ? 'text-right' : 'text-left'}`}
                  >
                    <div
                      className={`flex items-center gap-2 px-1 ${
                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <span className="font-semibold text-xs text-amber-400">
                        {msg.role === 'user'
                          ? userPersona.name
                          : activeProfile.name.split(',')[0]}
                      </span>

                      {!isLoading && !isEditingThis && (
                        <div className="flex items-center gap-1">
                          {/* Lápis para editar qualquer mensagem (usuário ou IA) */}
                          <button
                            onClick={() =>
                              handleStartEditMessage(idx, msg.content)
                            }
                            className="opacity-50 hover:opacity-100 focus:opacity-100 p-0.5 text-zinc-400 hover:text-amber-400 transition"
                            title="Editar mensagem"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>

                          {/* Regenerar / Tentar de novo apenas na última mensagem da IA */}
                          {isLastAssistantMsg && (
                            <button
                              onClick={handleRegenerateLastResponse}
                              className="opacity-60 hover:opacity-100 focus:opacity-100 p-0.5 text-zinc-400 hover:text-emerald-400 transition"
                              title="Atualizar resposta / Tentar de novo"
                            >
                              <RefreshCw className="w-3 h-3" />
                            </button>
                          )}

                          {/* Lixeira para apagar mensagem */}
                          {idx > 0 && (
                            <button
                              onClick={() => handleDeleteMessage(idx)}
                              className="opacity-50 hover:opacity-100 focus:opacity-100 p-0.5 text-zinc-400 hover:text-rose-400 transition"
                              title="Remover esta mensagem"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="bg-zinc-900 border border-amber-500/60 rounded-2xl p-2.5 space-y-2 text-left shadow-lg">
                        <textarea
                          rows={4}
                          value={editingMsgText}
                          onChange={(e) => setEditingMsgText(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 text-xs text-zinc-100 leading-relaxed focus:outline-none focus:border-amber-500 resize-y"
                        />
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={handleCancelEditMessage}
                            className="px-2.5 py-1 text-[11px] text-zinc-400 hover:text-zinc-200"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEditMessage(idx)}
                            className="flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-[11px] rounded-lg transition"
                          >
                            <Check className="w-3 h-3" />
                            <span>Salvar</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`rounded-2xl p-3.5 text-xs leading-relaxed space-y-2 whitespace-pre-wrap select-text ${
                          msg.role === 'user'
                            ? 'bg-amber-600/20 border border-amber-500/30 text-zinc-100 rounded-tr-none'
                            : 'bg-zinc-900 border border-zinc-800 text-zinc-200 rounded-tl-none shadow-sm'
                        }`}
                      >
                        {msg.content}
                      </div>
                    )}
                    {!isEditingThis &&
                      !isLoading &&
                      idx === currentMessages.length - 1 &&
                      msg.role === 'assistant' && (
                        <button
                          type="button"
                          onClick={handleContinueScene}
                          disabled={isSuggesting}
                          className="mt-1 flex items-center gap-1.5 px-2 py-1 text-[10px] font-semibold text-zinc-400 hover:text-amber-300 border border-zinc-800 hover:border-amber-500/40 rounded-lg transition disabled:opacity-50"
                        >
                          <FastForward className="w-3 h-3" />
                          <span>Continuar cena</span>
                        </button>
                      )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base shrink-0 overflow-hidden">
                  <AvatarDisplay avatar={activeProfile.avatar} />
                </div>
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  <span>
                    {isRpgSession
                      ? 'O Mestre está narrando...'
                      : `${activeProfile.name.split(',')[0]} está respondendo...`}
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* BANNERS DE AVISO E ERRO FIXOS LOGO ACIMA DO INPUT */}
          {(!primaryByokConfig.isReady || errorMessage) && (
            <div className="px-3 pt-2 bg-zinc-950 border-t border-zinc-900 space-y-2 shrink-0">
              {!primaryByokConfig.isReady && (
                <div className="bg-amber-950/60 border border-amber-600/50 rounded-xl p-2.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-200 truncate">
                      Configure sua chave ({primaryByokConfig.provider.toUpperCase()})
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

              {errorMessage && (
                <div className="bg-rose-950/80 border border-rose-600/60 rounded-xl p-2.5 flex items-start justify-between gap-2 text-xs text-rose-200">
                  <div className="flex items-start gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div className="min-w-0 space-y-0.5">
                      <p className="font-bold text-[11px] text-rose-300">
                        Erro no modelo ({activeModel}):
                      </p>
                      <p className="text-rose-200/90 text-[11px] break-words">
                        {errorMessage}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setIsBYOKOpen(true)}
                      className="px-2 py-1 text-[10px] font-bold bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 rounded-md"
                    >
                      Trocar
                    </button>
                    <button
                      onClick={() => setErrorMessage('')}
                      className="p-1 text-rose-400 hover:text-rose-200"
                      title="Fechar aviso"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* RODAPÉ FIXO DE INPUT */}
          <div className="p-3 border-t border-zinc-800/80 bg-zinc-950 shrink-0">
            <form
              onSubmit={handleSend}
              className="relative flex items-center gap-1.5"
            >
              {/* Botão 2d6 exclusivo para Campanhas RPG */}
              {isRpgSession && (
                <button
                  type="button"
                  onClick={() => setIsPbtaRollOpen(true)}
                  className="p-2.5 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-xl transition shadow-md shadow-emerald-600/20 shrink-0"
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
                  disabled={isLoading || isSuggesting}
                  placeholder={
                    isLoading
                      ? 'Aguardando resposta...'
                      : !isRpgSession
                      ? `Fale ou aja como ${userPersona.name}...`
                      : 'Descreva sua ação ou toque no dado 🎲...'
                  }
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500 pr-20 transition shadow-inner disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleSuggestUserReply}
                  disabled={isLoading || isSuggesting}
                  className="absolute right-9 p-2 text-zinc-400 hover:text-amber-300 rounded-lg transition disabled:opacity-50"
                  title="Sugerir resposta do jogador"
                >
                  {isSuggesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4" />
                  )}
                </button>
                <button
                  type="submit"
                  disabled={!inputMessage.trim() || isLoading || isSuggesting}
                  className="absolute right-1.5 p-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </form>

            <div className="flex items-center justify-between mt-1.5 px-1 text-[10px] text-zinc-500">
              <span className="truncate flex items-center gap-1">
                <span>{primaryByokConfig.provider.toUpperCase()}</span>
                <span>•</span>
                {cloudSyncStatus === 'syncing' && (
                  <span className="flex items-center gap-1 text-[9px] text-amber-400">
                    <RotateCw className="w-3 h-3 animate-spin" /> Sincronizando...
                  </span>
                )}
                {cloudSyncStatus === 'saved' && (
                  <span className="flex items-center gap-1 text-[9px] text-zinc-400">
                    <Cloud className="w-3 h-3 text-emerald-500" /> Nuvem
                  </span>
                )}
                {cloudSyncStatus === 'error' && (
                  <span
                    className="flex items-center gap-1 text-[9px] text-rose-400"
                    title="Salvo localmente; falha ao enviar ao Firebase"
                  >
                    <CloudOff className="w-3 h-3 text-rose-500" /> Local
                  </span>
                )}
              </span>

              <span
                className={
                  isRpgSession
                    ? 'text-emerald-400 font-bold'
                    : 'text-amber-400 font-bold'
                }
              >
                {isRpgSession
                  ? 'CAMPANHA RPG (2d6)'
                  : 'CONVERSA LIVRE / FREEROAM'}
              </span>
            </div>
          </div>
        </main>
      )}

      {/* ============================================================== */}
      {/* GAVETA DIREITA: VAULT, FICHA (SÓ NO RPG) & CRÔNICA             */}
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
                  rightDrawerTab === 'vault'
                    ? 'bg-amber-500 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Vault
              </button>

              {isRpgSession && (
                <button
                  onClick={() => setRightDrawerTab('sheet')}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    rightDrawerTab === 'sheet'
                      ? 'bg-emerald-400 text-zinc-950'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Ficha
                </button>
              )}

              <button
                onClick={() => setRightDrawerTab('chronicle')}
                className={`px-2 py-1 rounded text-xs font-bold transition ${
                  rightDrawerTab === 'chronicle'
                    ? 'bg-amber-400 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200'
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
            {rightDrawerTab === 'vault' && (
              <>
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                      Pescador RAG + Biblioteca
                    </span>
                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                      {activeCodexItems.length} do Codex na cena
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Injeta apenas fatos do Vault e NPCs/Locais/Regras da Biblioteca relevantes na cena.
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5 text-amber-400" />
                    Fatos desta Sessão ({currentVault.length})
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
                  <form
                    onSubmit={handleManualAddVaultBox}
                    className="bg-zinc-950 p-3 rounded-xl border border-zinc-700 space-y-2"
                  >
                    <input
                      type="text"
                      required
                      value={newVaultTag}
                      onChange={(e) => setNewVaultTag(e.target.value)}
                      placeholder="Tag (ex: #Local_Taverna ou #Segredo)"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <textarea
                      required
                      rows={2}
                      value={newVaultContent}
                      onChange={(e) => setNewVaultContent(e.target.value)}
                      placeholder="Fato imutável sobre esta cena..."
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
                    <p className="text-[11px] text-zinc-500 italic">
                      Nenhum fato dinâmico registrado ainda.
                    </p>
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
                            <span
                              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${
                                isFishedInScene
                                  ? 'text-amber-300 bg-amber-950/80 border-amber-600/70 font-bold'
                                  : 'text-zinc-400 bg-zinc-900 border-zinc-700/60'
                              }`}
                            >
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
                                className="opacity-40 hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 transition"
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

            {rightDrawerTab === 'sheet' && isRpgSession && (
              <div className="space-y-4">
                <button
                  onClick={() => setIsDungeonPaperOpen(true)}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-zinc-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2"
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
                      <div
                        key={stat}
                        className="bg-zinc-950/70 border border-zinc-800 rounded-lg p-2.5 flex items-center justify-between"
                      >
                        <div>
                          <span className="text-xs font-bold text-zinc-300">
                            {stat}
                          </span>
                          <span className="text-[9px] text-zinc-500 block">
                            val: {data.value}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono font-black px-1.5 py-0.5 rounded border ${
                            data.mod >= 0
                              ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                              : 'bg-rose-950/60 border-rose-800 text-rose-400'
                          }`}
                        >
                          {data.mod >= 0 ? `+${data.mod}` : data.mod}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {rightDrawerTab === 'chronicle' && (
              <div className="space-y-3">
                <div className="bg-zinc-950/60 border border-zinc-800 rounded-lg p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <ScrollText className="w-3.5 h-3.5 text-amber-400" />
                      The Chronicle (Automático +12 msgs)
                    </span>
                    <span className="text-[9px] text-zinc-400">
                      {currentMessages.length} turnos
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-400 leading-relaxed">
                    Compacta turnos antigos automaticamente ao passar de 12 mensagens para economizar tokens.
                  </p>
                </div>

                {currentMessages.length > 8 && (
                  <button
                    onClick={() =>
                      runChronicleCompression(
                        currentMessages,
                        currentVault,
                        currentChronicle,
                        false
                      )
                    }
                    disabled={isCompressing}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${
                        isCompressing ? 'animate-spin' : ''
                      }`}
                    />
                    <span>
                      {isCompressing
                        ? 'Comprimindo com IA...'
                        : 'Compactar Agora'}
                    </span>
                  </button>
                )}

                <div className="bg-zinc-950/70 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                  <span className="text-[10px] uppercase font-bold text-zinc-400">
                    Crônica Registrada:
                  </span>
                  {currentChronicle ? (
                    <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-serif">
                      {currentChronicle}
                    </p>
                  ) : (
                    <p className="text-[11px] text-zinc-500 italic">
                      A história acabou de começar. Ao atingir 12 mensagens, o Cronista sintetizará o passado automaticamente.
                    </p>
                  )}
                </div>

                <button
                  onClick={() => {
                    setRightDrawerOpen(false);
                    handleResetChat();
                  }}
                  className="w-full py-2 bg-rose-950/60 hover:bg-rose-900/70 border border-rose-800/60 text-rose-300 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar Chat / Nova Conversa</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Modais */}
      <PersonaLibraryModal
        isOpen={isPersonaOpen}
        onClose={() => setIsPersonaOpen(false)}
        personas={personas}
        activePersonaId={activePersonaId}
        onSelectPersona={(id) => {
          selectPersona(id);
          setIsPersonaOpen(false);
        }}
        onSavePersona={savePersona}
        onDeletePersona={deletePersona}
      />

      <BYOKModal
        isOpen={isBYOKOpen}
        onClose={() => setIsBYOKOpen(false)}
        settings={settings}
        onSave={updateSettings}
      />

      <SanguessugaModal
        isOpen={isSanguessugaOpen}
        onClose={() => setIsSanguessugaOpen(false)}
        onAddProfile={addProfile}
        onAddCodexEntry={addCodexEntry}
        byokSettings={primaryByokConfig}
        chronicleByokSettings={chronicleByokConfig}
        onOpenBYOK={() => setIsBYOKOpen(true)}
        initialType={sanguessugaInitialType}
        codex={codex}
      />

      <CodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        codex={codex}
        onAddEntry={addCodexEntry}
        onDeleteEntry={deleteCodexEntry}
        pinnedIds={currentScreen === 'chat' ? currentPinnedIds : undefined}
        onTogglePin={currentScreen === 'chat' ? handleToggleCodexPin : undefined}
        activeSessionName={currentScreen === 'chat' ? activeProfile?.name : ''}
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
          },
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