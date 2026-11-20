import { useState, useEffect, useRef } from 'react';
import { saveUserDocToCloud } from '../services/firebase';

const DEFAULT_SHEET = {
  className: 'Guerreiro',
  level: 1,
  hp: 20,
  maxHp: 20,
  armor: 1,
  damageDie: 'd10',
  stats: {
    FOR: { value: 16, mod: 2 },
    DES: { value: 13, mod: 1 },
    CON: { value: 15, mod: 1 },
    INT: { value: 9, mod: 0 },
    SAB: { value: 12, mod: 0 },
    CAR: { value: 8, mod: -1 },
  },
  bonds: ['Tenho uma dívida antiga com um mercador local.'],
  inventory: ['Espada Longa (corpo a corpo, +1 dano)', 'Cota de Malha (1 armadura)', 'Rações (5 usos)'],
};

function calcMod(score) {
  const n = Number(score) || 10;
  if (n <= 3) return -3;
  if (n <= 5) return -2;
  if (n <= 8) return -1;
  if (n <= 12) return 0;
  if (n <= 15) return 1;
  if (n <= 17) return 2;
  return 3;
}

export function useCharacterSheet(uid) {
  const storageKey = uid ? `airpg_dungeon_sheet_${uid}` : 'airpg_dungeon_sheet';
  const syncTimerRef = useRef(null);

  const [sheet, setSheet] = useState(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return { ...DEFAULT_SHEET, ...JSON.parse(stored) };
    } catch (e) {}
    return DEFAULT_SHEET;
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      setSheet(stored ? { ...DEFAULT_SHEET, ...JSON.parse(stored) } : DEFAULT_SHEET);
    } catch (e) {}
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, []);

  const persistSheet = (nextSheet, immediate = false) => {
    setSheet(nextSheet);
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextSheet));
    } catch (e) {}

    if (!uid) return;

    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    if (immediate) {
      saveUserDocToCloud(uid, { dungeonPaperSheet: nextSheet });
    } else {
      syncTimerRef.current = setTimeout(() => {
        saveUserDocToCloud(uid, { dungeonPaperSheet: nextSheet });
      }, 2000);
    }
  };

  const saveSheet = (fullSheet) => {
    persistSheet({ ...DEFAULT_SHEET, ...fullSheet }, true);
  };

  const hydrateSheetFromCloud = (cloudSheet) => {
    if (!cloudSheet || typeof cloudSheet !== 'object') return;
    const merged = { ...DEFAULT_SHEET, ...cloudSheet };
    setSheet(merged);
    try {
      localStorage.setItem(storageKey, JSON.stringify(merged));
    } catch (e) {}
  };

  const updateHp = (delta) => {
    setSheet((prev) => {
      const nextHp = Math.max(0, Math.min(prev.maxHp, (prev.hp || 0) + delta));
      const updated = { ...prev, hp: nextHp };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      if (uid) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          saveUserDocToCloud(uid, { dungeonPaperSheet: updated });
        }, 2000);
      }
      return updated;
    });
  };

  const updateStatScore = (statKey, newValue) => {
    setSheet((prev) => {
      const val = Math.max(1, Math.min(20, Number(newValue) || 10));
      const updated = {
        ...prev,
        stats: {
          ...prev.stats,
          [statKey]: { value: val, mod: calcMod(val) },
        },
      };
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {}
      if (uid) {
        if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
        syncTimerRef.current = setTimeout(() => {
          saveUserDocToCloud(uid, { dungeonPaperSheet: updated });
        }, 2000);
      }
      return updated;
    });
  };

  const changeClass = (newClass) => {
    persistSheet({ ...sheet, className: newClass }, false);
  };

  const addBond = (bondText) => {
    if (!bondText?.trim()) return;
    persistSheet({ ...sheet, bonds: [...(sheet.bonds || []), bondText.trim()] }, false);
  };

  const removeBond = (index) => {
    persistSheet({
      ...sheet,
      bonds: (sheet.bonds || []).filter((_, i) => i !== index),
    }, false);
  };

  const addItem = (itemText) => {
    if (!itemText?.trim()) return;
    persistSheet({
      ...sheet,
      inventory: [...(sheet.inventory || []), itemText.trim()],
    }, false);
  };

  const removeItem = (index) => {
    persistSheet({
      ...sheet,
      inventory: (sheet.inventory || []).filter((_, i) => i !== index),
    }, false);
  };

  return {
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
  };
}