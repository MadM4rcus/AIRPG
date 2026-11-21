import { useState, useEffect } from 'react';
import {
  saveEntityToCloud,
  deleteEntityFromCloud,
  saveUserDocToCloud,
} from '../services/firebase';

const DEFAULT_CHARACTERS = [
  {
    id: 'char_freeroam_default',
    type: 'chat',
    name: 'Taverna da Encruzilhada',
    avatar: '🍺',
    tag: 'Freeroam Vivo',
    personality:
      'Um mundo de fantasia sombria onde cada viajante, taverneiro e mercenário possui interesses próprios, memória e desconfiança natural.',
    scenario:
      'Noite chuvosa na Taverna do Corvo Manco. O fogo da lareira crepita enquanto conversas baixas ecoam pelas mesas de madeira.',
    firstMessage:
      'A porta pesada range quando você entra, trazendo uma lufada de vento frio e cheiro de chuva. Atrás do balcão, Valéria ergue os olhos de uma adaga que limpava, avaliando você de cima a baixo antes de voltar ao trabalho. — Se veio arrumar confusão, deixe o ouro no balcão antes.',
    pinnedCodexIds: ['codex_valeria_npc', 'codex_taverna_corvo'],
    initialVault: [],
  },
];

const DEFAULT_CAMPAIGNS = [
  {
    id: 'camp_pbta_default',
    type: 'rpg',
    name: 'Crônicas das Cinzas',
    avatar: '⚔️',
    tag: 'Dungeon World • PbtA',
    personality:
      'Campanha de fantasia implacável. Recursos são escassos, ferimentos cobram seu preço e os dados 2d6 decidem o destino.',
    scenario:
      'As ruínas submersas de Oakhaven, onde cultistas buscam despertar um selo antigo sob a névoa.',
    firstMessage:
      'A névoa fria cobre seus tornozelos na entrada da cripta de Oakhaven. Tochas tremeluzem no corredor à frente e o som metálico de lâminas sendo desembainhadas ecoa nas pedras úmidas. O que você faz?',
    pinnedCodexIds: ['codex_regra_eter'],
    initialVault: [],
  },
];

const DEFAULT_PERSONAS = [
  {
    id: 'persona_default',
    name: 'Viajante',
    avatar: '🧑',
    appearance: 'Roupas práticas de viagem, olhar atento.',
    description: 'Pragmático, observador e cauteloso ao lidar com estranhos.',
  },
];

export function useProfiles(uid) {
  const charsKey = uid ? `airpg_chars_${uid}` : 'airpg_chars';
  const campsKey = uid ? `airpg_camps_${uid}` : 'airpg_camps';
  const personasKey = uid ? `airpg_personas_${uid}` : 'airpg_personas';
  const activePersonaKey = uid
    ? `airpg_active_persona_${uid}`
    : 'airpg_active_persona';

  const [characters, setCharacters] = useState(() => {
    try {
      const s = localStorage.getItem(charsKey);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return DEFAULT_CHARACTERS;
  });

  const [campaigns, setCampaigns] = useState(() => {
    try {
      const s = localStorage.getItem(campsKey);
      if (s) return JSON.parse(s);
    } catch (e) {}
    return DEFAULT_CAMPAIGNS;
  });

  const [personas, setPersonas] = useState(() => {
    try {
      const s = localStorage.getItem(personasKey);
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_PERSONAS;
  });

  const [activePersonaId, setActivePersonaId] = useState(() => {
    try {
      return localStorage.getItem(activePersonaKey) || 'persona_default';
    } catch (e) {
      return 'persona_default';
    }
  });

  const [activeProfileId, setActiveProfileId] = useState(
    DEFAULT_CHARACTERS[0].id
  );

  useEffect(() => {
    try {
      const sc = localStorage.getItem(charsKey);
      setCharacters(sc ? JSON.parse(sc) : DEFAULT_CHARACTERS);

      const sm = localStorage.getItem(campsKey);
      setCampaigns(sm ? JSON.parse(sm) : DEFAULT_CAMPAIGNS);

      const sp = localStorage.getItem(personasKey);
      const parsedP = sp ? JSON.parse(sp) : DEFAULT_PERSONAS;
      setPersonas(
        Array.isArray(parsedP) && parsedP.length > 0
          ? parsedP
          : DEFAULT_PERSONAS
      );

      const sap = localStorage.getItem(activePersonaKey);
      if (sap) setActivePersonaId(sap);
    } catch (e) {}
  }, [charsKey, campsKey, personasKey, activePersonaKey]);

  const allProfiles = [...characters, ...campaigns];
  const activeProfile =
    allProfiles.find((p) => p.id === activeProfileId) ||
    characters[0] ||
    campaigns[0] ||
    DEFAULT_CHARACTERS[0];

  const userPersona =
    personas.find((p) => p.id === activePersonaId) ||
    personas[0] ||
    DEFAULT_PERSONAS[0];

  const persistPersonas = (nextList, nextActiveId = activePersonaId) => {
    setPersonas(nextList);
    setActivePersonaId(nextActiveId);
    try {
      localStorage.setItem(personasKey, JSON.stringify(nextList));
      localStorage.setItem(activePersonaKey, nextActiveId);
    } catch (e) {}

    const activeObj =
      nextList.find((p) => p.id === nextActiveId) || nextList[0];
    if (uid) {
      saveUserDocToCloud(uid, {
        personas: nextList,
        activePersonaId: nextActiveId,
        userPersona: activeObj,
      });
    }
  };

  const selectPersona = (personaId) => {
    persistPersonas(personas, personaId);
  };

  const savePersona = (personaData) => {
    if (personaData.id) {
      const updated = personas.map((p) =>
        p.id === personaData.id ? { ...p, ...personaData } : p
      );
      persistPersonas(updated, personaData.id);
      return personaData;
    } else {
      const newPersona = {
        id: `persona_${Date.now()}`,
        name: personaData.name?.trim() || 'Nova Persona',
        avatar: personaData.avatar?.trim() || '🧑',
        appearance: personaData.appearance?.trim() || '',
        description: personaData.description?.trim() || '',
      };
      persistPersonas([newPersona, ...personas], newPersona.id);
      return newPersona;
    }
  };

  const deletePersona = (personaId) => {
    if (personas.length <= 1) return;
    const filtered = personas.filter((p) => p.id !== personaId);
    const nextActive =
      activePersonaId === personaId ? filtered[0].id : activePersonaId;
    persistPersonas(filtered, nextActive);
  };

  const addProfile = (profileData, { syncToCloud = true } = {}) => {
    const isRpg = profileData.type === 'rpg';
    const newItem = {
      ...profileData,
      id: profileData.id || `${isRpg ? 'camp' : 'char'}_${Date.now()}`,
      type: isRpg ? 'rpg' : 'chat',
    };

    if (isRpg) {
      const next = [newItem, ...campaigns];
      setCampaigns(next);
      try {
        localStorage.setItem(campsKey, JSON.stringify(next));
      } catch (e) {}
    } else {
      const next = [newItem, ...characters];
      setCharacters(next);
      try {
        localStorage.setItem(charsKey, JSON.stringify(next));
      } catch (e) {}
    }

    if (uid && syncToCloud) saveEntityToCloud(uid, newItem);
    setActiveProfileId(newItem.id);
    return newItem;
  };

  const updateProfile = async (profileId, updates) => {
    const profile = [...characters, ...campaigns].find(
      (item) => item.id === profileId
    );
    if (!profile) {
      throw new Error('Não foi possível encontrar a sessão para atualizar.');
    }

    const updatedProfile = { ...profile, ...updates };
    if (profile.type === 'rpg') {
      const next = campaigns.map((item) =>
        item.id === profileId ? updatedProfile : item
      );
      setCampaigns(next);
      try {
        localStorage.setItem(campsKey, JSON.stringify(next));
      } catch (error) {
        console.warn('Erro ao salvar campanhas localmente:', error);
      }
    } else {
      const next = characters.map((item) =>
        item.id === profileId ? updatedProfile : item
      );
      setCharacters(next);
      try {
        localStorage.setItem(charsKey, JSON.stringify(next));
      } catch (error) {
        console.warn('Erro ao salvar conversas localmente:', error);
      }
    }

    if (uid && !(await saveEntityToCloud(uid, updatedProfile))) {
      throw new Error('Capa salva localmente, mas não foi sincronizada com a nuvem.');
    }

    return updatedProfile;
  };

  const deleteProfile = (id, type) => {
    if (type === 'rpg') {
      const next = campaigns.filter((c) => c.id !== id);
      setCampaigns(next);
      try {
        localStorage.setItem(campsKey, JSON.stringify(next));
      } catch (e) {}
    } else {
      const next = characters.filter((c) => c.id !== id);
      setCharacters(next);
      try {
        localStorage.setItem(charsKey, JSON.stringify(next));
      } catch (e) {}
    }
    if (uid) deleteEntityFromCloud(uid, id, type);
  };

  const hydrateFromCloud = (
    cloudChars,
    cloudCamps,
    cloudLegacyPersona,
    cloudUserDoc = {}
  ) => {
    if (Array.isArray(cloudChars) && cloudChars.length > 0) {
      setCharacters(cloudChars);
      try {
        localStorage.setItem(charsKey, JSON.stringify(cloudChars));
      } catch (e) {}
    }
    if (Array.isArray(cloudCamps) && cloudCamps.length > 0) {
      setCampaigns(cloudCamps);
      try {
        localStorage.setItem(campsKey, JSON.stringify(cloudCamps));
      } catch (e) {}
    }

    if (
      Array.isArray(cloudUserDoc?.personas) &&
      cloudUserDoc.personas.length > 0
    ) {
      const nextActive =
        cloudUserDoc.activePersonaId || cloudUserDoc.personas[0].id;
      setPersonas(cloudUserDoc.personas);
      setActivePersonaId(nextActive);
      try {
        localStorage.setItem(
          personasKey,
          JSON.stringify(cloudUserDoc.personas)
        );
        localStorage.setItem(activePersonaKey, nextActive);
      } catch (e) {}
    } else if (cloudLegacyPersona?.name) {
      const migrated = [
        {
          id: 'persona_default',
          avatar: '🧑',
          ...cloudLegacyPersona,
        },
      ];
      setPersonas(migrated);
      setActivePersonaId('persona_default');
      try {
        localStorage.setItem(personasKey, JSON.stringify(migrated));
        localStorage.setItem(activePersonaKey, 'persona_default');
      } catch (e) {}
    }
  };

  return {
    characters,
    campaigns,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    updateProfile,
    deleteProfile,
    personas,
    activePersonaId,
    userPersona,
    selectPersona,
    savePersona,
    deletePersona,
    hydrateFromCloud,
  };
}