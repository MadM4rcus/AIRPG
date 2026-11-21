import { useState, useEffect } from 'react';
import {
  saveCodexEntryToCloud,
  deleteCodexEntryFromCloud,
} from '../services/firebase';

export const DEFAULT_CODEX = [
  {
    id: 'codex_valeria_npc',
    category: 'NPC', // 'NPC' | 'LOCAL' | 'MUNDO'
    name: 'Valéria, Sentinela Decaída',
    tag: '#Valeria',
    summary:
      'Guerreira cínica de cicatriz no rosto e armadura oxidada. Direta, pragmática, desconfia de bravatas e só respeita ações reais.',
  },
  {
    id: 'codex_taverna_corvo',
    category: 'LOCAL',
    name: 'Taverna do Corvo Manco',
    tag: '#TavernaCorvo',
    summary:
      'Subsolo enfumaçado no porto antigo. Zona neutra entre facções; armas pesadas são proibidas na entrada.',
  },
  {
    id: 'codex_regra_eter',
    category: 'MUNDO',
    name: 'Lei do Éter Residual',
    tag: '#LeiEter',
    summary:
      'Toda tecnologia ou magia antiga cobra um preço físico de fadiga; abusar sem descanso causa sangramento nasal e colapso.',
  },
];

export function useCodex(uid) {
  const storageKey = uid ? `airpg_codex_${uid}` : 'airpg_codex';

  const [codex, setCodex] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return DEFAULT_CODEX;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setCodex(stored ? JSON.parse(stored) : DEFAULT_CODEX);
    } catch (e) {}
  }, [storageKey]);

  const persist = (nextList) => {
    setCodex(nextList);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextList));
    } catch (e) {}
  };

  const hydrateCodexFromCloud = (cloudItems) => {
    if (Array.isArray(cloudItems) && cloudItems.length > 0) {
      const ids = new Set(cloudItems.map((c) => c.id));
      const merged = [
        ...cloudItems,
        ...DEFAULT_CODEX.filter((dc) => !ids.has(dc.id)),
      ];
      persist(merged);
    }
  };

  const addCodexEntry = async ({ category, name, tag, summary }) => {
    const cleanTag = tag?.trim()
      ? tag.trim().startsWith('#')
        ? tag.trim()
        : `#${tag.trim().replace(/\s+/g, '_')}`
      : `#${(name || 'Item').trim().replace(/\s+/g, '_')}`;

    const newEntry = {
      id: `codex_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      category: category || 'NPC',
      name: name?.trim() || 'Sem Nome',
      tag: cleanTag,
      summary: summary?.trim() || '',
    };

    setCodex((prev) => {
      const next = [newEntry, ...prev];
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    if (uid) await saveCodexEntryToCloud(uid, newEntry);
    return newEntry;
  };

  const updateCodexEntry = async (id, { category, name, tag, summary }) => {
    const cleanTag = tag?.trim()
      ? tag.trim().startsWith('#')
        ? tag.trim()
        : `#${tag.trim().replace(/\s+/g, '_')}`
      : `#${(name || 'Item').trim().replace(/\s+/g, '_')}`;
    const updatedEntry = {
      category: category || 'NPC',
      name: name?.trim() || 'Sem Nome',
      tag: cleanTag,
      summary: summary?.trim() || '',
    };

    setCodex((prev) => {
      const next = prev.map((item) =>
        item.id === id ? { ...item, ...updatedEntry } : item
      );
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    if (uid) await saveCodexEntryToCloud(uid, { id, ...updatedEntry });
  };

  const deleteCodexEntry = (id) => {
    const updated = codex.filter((item) => item.id !== id);
    persist(updated);
    if (uid) deleteCodexEntryFromCloud(uid, id);
  };

  return {
    codex,
    addCodexEntry,
    updateCodexEntry,
    deleteCodexEntry,
    hydrateCodexFromCloud,
  };
}