import { useState, useEffect } from 'react';
import {
  saveEntityToCloud,
  deleteEntityFromCloud,
  saveUserDocToCloud,
} from '../services/firebase';

export const DEFAULT_CHARACTERS = [
  {
    id: 'kaelen_chat_default',
    type: 'chat',
    name: 'Kaelen, Mercador do Vazio',
    avatar: '🪐',
    tag: 'Sci-Fi / Cyber',
    personality:
      'Contrabandista sarcástico, oportunista com senso de humor ácido. Especialista em artefatos ilegais e tecnologia de dobra quântica. Não confia fácil e não se impressiona com bravatas.',
    scenario:
      'Beco iluminado por neon turvo nos níveis inferiores da Estação Orbital Neo-Valhalla.',
    firstMessage:
      '— Ei, você aí. Olha para os dois lados antes de chegar perto da minha banca. Os pacificadores da guilda estão de olho. Se você tem os créditos, eu tenho as relíquias que você não acha em nenhum catálogo oficial.',
    initialVault: [
      {
        tag: '#NeoValhalla',
        content: 'Estação orbital mineradora à beira do colapso econômico.',
      },
      {
        tag: '#Kaelen_Humor',
        content: 'Desconfiado, pragmático e avesso a quem tenta dar uma de valente.',
      },
    ],
  },
];

export const DEFAULT_CAMPAIGNS = [
  {
    id: 'aethelgard_rpg_default',
    type: 'rpg',
    name: 'As Ruínas de Aethelgard',
    avatar: '⚔️',
    tag: 'Dark Fantasy • PbtA',
    personality:
      'Mestre de RPG imparcial de Dark Fantasy. Conduz o mundo de Aethelgard e seus habitantes (incluindo Valéria, a Sentinela Decaída) com rigor narrativo e mecânico.',
    scenario:
      'Posto Avançado nas Ruínas de Aethelgard. Uma tempestade de chuva fria açoita as pedras arruinadas. Valéria, uma guerreira cínica de armadura oxidada, vigia a entrada da Cripta Esquecida.',
    firstMessage:
      'A chuva gelada açoita as pedras partidas do Posto Avançado. Diante da entrada selada da Cripta Esquecida, Valéria mantém a mão firme no punho de sua lâmina larga, observando sua aproximação com olhos cansados.\n\n— Você demorou mais do que eu esperava para atravessar o pântano. Se veio atrás das relíquias lá de baixo, verifique suas provisões e sua lâmina — os mortos de Aethelgard não perdoam erros.',
    initialVault: [
      {
        tag: '#Aethelgard',
        content: 'Fortaleza arruinada há 300 anos após o Rompimento Astral.',
      },
      {
        tag: '#NPC_Valeria',
        content: 'Sentinela veterana; cautelosa com forasteiros e exige competência real.',
      },
    ],
  },
];

export const DEFAULT_USER_PERSONA = {
  name: 'Viajante',
  appearance: 'Capa surrada de viagem, olhos atentos e porte reservado.',
  description:
    'Um aventureiro solitário em busca de respostas, sobrevivendo pelos cantos esquecidos do mundo.',
};

export function useProfiles(uid) {
  const charsStorageKey = uid ? `airpg_characters_${uid}` : 'airpg_characters';
  const campsStorageKey = uid ? `airpg_campaigns_${uid}` : 'airpg_campaigns';
  const personaStorageKey = uid ? `airpg_user_persona_${uid}` : 'airpg_user_persona';

  const [characters, setCharacters] = useState(() => {
    try {
      const stored = localStorage.getItem(charsStorageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_CHARACTERS;
  });

  const [campaigns, setCampaigns] = useState(() => {
    try {
      const stored = localStorage.getItem(campsStorageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_CAMPAIGNS;
  });

  const [activeEntityId, setActiveEntityId] = useState(() => {
    return characters[0]?.id || campaigns[0]?.id || 'kaelen_chat_default';
  });

  const [userPersona, setUserPersona] = useState(() => {
    try {
      const stored = localStorage.getItem(personaStorageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_USER_PERSONA;
  });

  useEffect(() => {
    try {
      const storedChars = localStorage.getItem(charsStorageKey);
      const nextChars = storedChars ? JSON.parse(storedChars) : DEFAULT_CHARACTERS;
      setCharacters(nextChars);

      const storedCamps = localStorage.getItem(campsStorageKey);
      const nextCamps = storedCamps ? JSON.parse(storedCamps) : DEFAULT_CAMPAIGNS;
      setCampaigns(nextCamps);

      setActiveEntityId(nextChars[0]?.id || nextCamps[0]?.id);

      const storedPersona = localStorage.getItem(personaStorageKey);
      setUserPersona(storedPersona ? JSON.parse(storedPersona) : DEFAULT_USER_PERSONA);
    } catch (e) {}
  }, [charsStorageKey, campsStorageKey, personaStorageKey]);

  const persistCharacters = (nextList) => {
    setCharacters(nextList);
    try {
      localStorage.setItem(charsStorageKey, JSON.stringify(nextList));
    } catch (e) {}
  };

  const persistCampaigns = (nextList) => {
    setCampaigns(nextList);
    try {
      localStorage.setItem(campsStorageKey, JSON.stringify(nextList));
    } catch (e) {}
  };

  const hydrateFromCloud = (cloudChars, cloudCamps, cloudPersona) => {
    if (Array.isArray(cloudChars) && cloudChars.length > 0) {
      const ids = new Set(cloudChars.map((c) => c.id));
      const merged = [
        ...cloudChars.map((c) => ({ ...c, type: 'chat' })),
        ...DEFAULT_CHARACTERS.filter((dc) => !ids.has(dc.id)),
      ];
      persistCharacters(merged);
    }
    if (Array.isArray(cloudCamps) && cloudCamps.length > 0) {
      const ids = new Set(cloudCamps.map((c) => c.id));
      const merged = [
        ...cloudCamps.map((c) => ({ ...c, type: 'rpg' })),
        ...DEFAULT_CAMPAIGNS.filter((dc) => !ids.has(dc.id)),
      ];
      persistCampaigns(merged);
    }
    if (cloudPersona && typeof cloudPersona === 'object') {
      setUserPersona(cloudPersona);
      try {
        localStorage.setItem(personaStorageKey, JSON.stringify(cloudPersona));
      } catch (e) {}
    }
  };

  const saveUserPersona = (newPersona) => {
    setUserPersona(newPersona);
    try {
      localStorage.setItem(personaStorageKey, JSON.stringify(newPersona));
    } catch (e) {}
    if (uid) {
      saveUserDocToCloud(uid, { userPersona: newPersona });
    }
  };

  const addEntity = (entityData) => {
    const entityType = entityData.type === 'rpg' ? 'rpg' : 'chat';
    const newEntity = {
      id: `${entityType}_${Date.now()}`,
      type: entityType,
      avatar: entityData.avatar || (entityType === 'rpg' ? '⚔️' : '🎭'),
      name: entityData.name || 'Sem Nome',
      tag: entityData.tag || (entityType === 'rpg' ? 'Campanha PbtA' : 'Personagem'),
      personality: entityData.personality || '',
      scenario: entityData.scenario || '',
      firstMessage: entityData.firstMessage || '...',
      initialVault: entityData.initialVault || [],
    };

    if (entityType === 'rpg') {
      persistCampaigns([newEntity, ...campaigns]);
    } else {
      persistCharacters([newEntity, ...characters]);
    }

    setActiveEntityId(newEntity.id);

    if (uid) {
      saveEntityToCloud(uid, newEntity);
    }

    return newEntity;
  };

  const deleteEntity = (id, type) => {
    const targetType =
      type ||
      (campaigns.some((c) => c.id === id) ? 'rpg' : 'chat');

    if (targetType === 'rpg') {
      const updated = campaigns.filter((c) => c.id !== id);
      if (updated.length === 0) return;
      persistCampaigns(updated);
      if (activeEntityId === id) setActiveEntityId(updated[0].id);
    } else {
      const updated = characters.filter((c) => c.id !== id);
      if (updated.length === 0) return;
      persistCharacters(updated);
      if (activeEntityId === id) setActiveEntityId(updated[0].id);
    }

    if (uid) {
      deleteEntityFromCloud(uid, id, targetType);
    }
  };

  const allEntities = [...characters, ...campaigns];
  const activeProfile =
    allEntities.find((item) => item.id === activeEntityId) ||
    characters[0] ||
    campaigns[0];

  return {
    characters,
    campaigns,
    profiles: allEntities,
    activeProfile,
    activeProfileId: activeEntityId,
    setActiveProfileId: setActiveEntityId,
    addProfile: addEntity,
    deleteProfile: deleteEntity,
    userPersona,
    saveUserPersona,
    hydrateFromCloud,
  };
}