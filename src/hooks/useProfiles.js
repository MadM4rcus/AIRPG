import { useState } from 'react';
import { saveProfileToCloud } from '../services/firebase';

const PROFILES_STORAGE_KEY = 'airpg_profiles_data';
const USER_PERSONA_STORAGE_KEY = 'airpg_user_persona';

export const DEFAULT_PROFILES = [
  {
    id: 'valeria_default',
    name: 'Valéria, A Sentinela Decaída',
    avatar: '⚔️',
    tag: 'Dark Fantasy',
    personality: 'Guerreira cínica e pragmática, sobrevivente de guerras brutais. Usa linguagem crua, direta e sem rodeios. Cautelosa com estranhos, mas possui honra inabalável.',
    scenario: 'Posto Avançado nas Ruínas de Aethelgard. Uma tempestade de chuva fria açoita as pedras arruinadas. Apenas uma fogueira improvisada oferece calor.',
    firstMessage: 'A chuva gelada bate contra o metal oxidado do meu peitoral. Fico parada diante da muralha em ruínas, com a mão direita repousando sobre o punho da lâmina pesada.\n\n— Você demorou mais do que eu esperava para atravessar o pântano. Se veio atrás das relíquias da Cripta Esquecida, saiba que as coisas lá embaixo não perdoam erros.',
    initialVault: [
      { tag: '#Aethelgard', content: 'Fortaleza arruinada há 300 anos após o Rompimento Astral.' },
      { tag: '#Valéria_Relacao', content: 'Cautelosa com forasteiros; dívida de honra com a ordem de aço.' },
    ],
  },
  {
    id: 'kaelen_default',
    name: 'Kaelen, Mercador do Vazio',
    avatar: '🪐',
    tag: 'Sci-Fi / Cyber',
    personality: 'Contrabandista sarcástico, oportunista com senso de humor ácido. Especialista em artefatos ilegais e tecnologia de dobra quântica.',
    scenario: 'Beco iluminado por neon turvo nos níveis inferiores da Estação Orbital Neo-Valhalla.',
    firstMessage: '— Ei, você aí. Olha para os dois lados antes de chegar perto da minha banca. Os pacificadores da guilda estão de olho. Se você tem os créditos, eu tenho as relíquias que você não acha em nenhum catálogo oficial.',
    initialVault: [
      { tag: '#NeoValhalla', content: 'Estação orbital mineradora à beira do colapso econômico.' },
    ],
  },
];

export const DEFAULT_USER_PERSONA = {
  name: 'Viajante',
  appearance: 'Capa surrada de viagem, olhos atentos e porte reservado.',
  description: 'Um aventureiro solitário em busca de respostas, sobrevivendo pelos cantos esquecidos do mundo.',
};

export function useProfiles() {
  const [profiles, setProfiles] = useState(() => {
    try {
      const stored = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Erro ao ler perfis do localStorage:', e);
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState(() => {
    return profiles[0]?.id || 'valeria_default';
  });

  const [userPersona, setUserPersona] = useState(() => {
    try {
      const stored = localStorage.getItem(USER_PERSONA_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Erro ao ler persona do usuário:', e);
    }
    return DEFAULT_USER_PERSONA;
  });

  // Salva perfis
  const saveProfiles = (newProfiles) => {
    setProfiles(newProfiles);
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(newProfiles));
    } catch (e) {
      console.error('Falha ao salvar perfis:', e);
    }
  };

  // Salva persona do usuário
  const saveUserPersona = (newPersona) => {
    setUserPersona(newPersona);
    try {
      localStorage.setItem(USER_PERSONA_STORAGE_KEY, JSON.stringify(newPersona));
    } catch (e) {
      console.error('Falha ao salvar persona:', e);
    }
  };

  const addProfile = (profileData) => {
    const newProfile = {
      id: `profile_${Date.now()}`,
      avatar: profileData.avatar || '🎭',
      name: profileData.name || 'Sem Nome',
      tag: profileData.tag || 'Custom',
      personality: profileData.personality || '',
      scenario: profileData.scenario || '',
      firstMessage: profileData.firstMessage || '...',
      initialVault: profileData.initialVault || [],
    };
    const updated = [newProfile, ...profiles];
    saveProfiles(updated);
    setActiveProfileId(newProfile.id);
    
    // Sincroniza novo mundo/personagem com o Firestore em background
    saveProfileToCloud(newProfile);
    
    return newProfile;
  };

  const deleteProfile = (id) => {
    const updated = profiles.filter((p) => p.id !== id);
    if (updated.length === 0) return;
    saveProfiles(updated);
    if (activeProfileId === id) {
      setActiveProfileId(updated[0].id);
    }
  };

  const activeProfile = profiles.find((p) => p.id === activeProfileId) || profiles[0];

  return {
    profiles,
    activeProfile,
    activeProfileId,
    setActiveProfileId,
    addProfile,
    deleteProfile,
    userPersona,
    saveUserPersona,
  };
}