import { useState } from 'react';
import { DW_CLASSES } from '../engine/dungeonWorldClasses';

const SHEET_STORAGE_KEY = 'airpg_dungeon_paper_sheet';

export const DEFAULT_DW_SHEET = {
  name: 'Viajante',
  classId: 'guerreiro',
  className: 'Guerreiro',
  level: 1,
  xp: 0,
  baseHp: 10,
  hp: 22, // 10 + CON (12) = 22
  maxHp: 22,
  armor: 1,
  damageDice: 'd10',
  alignment: 'Neutro (Preservar a própria honra e sobreviver)',
  // Atributos de 1 a 18 com seus respectivos Modificadores DW
  stats: {
    FOR: { value: 16, mod: 2 },
    DES: { value: 13, mod: 1 },
    CON: { value: 15, mod: 1 },
    INT: { value: 9, mod: 0 },
    SAB: { value: 12, mod: 0 },
    CAR: { value: 8, mod: -1 },
  },
  bonds: [
    'A Valéria ainda não confia plenamente em minhas intenções na Cripta.',
    'Devo proteger os segredos dos sobreviventes da fortaleza.',
  ],
  inventory: [
    { name: 'Espada Longa de Aço', weight: 2, tags: '+1 de dano, corpo a corpo' },
    { name: 'Cota de Malha Pesada', weight: 1, tags: '1 de Armadura' },
    { name: 'Rações de Viagem (5 usos)', weight: 1, tags: 'Alimento' },
    { name: 'Bandagens de Ervas', weight: 1, tags: 'Cura 4 PV' },
  ],
};

// Converte score do Dungeon World (1-18) para Modificador (-3 a +3)
export function calculateDwMod(score) {
  const num = Number(score) || 10;
  if (num <= 3) return -3;
  if (num <= 5) return -2;
  if (num <= 8) return -1;
  if (num <= 12) return 0;
  if (num <= 15) return 1;
  if (num <= 17) return 2;
  return 3;
}

export function useCharacterSheet() {
  const [sheet, setSheet] = useState(() => {
    try {
      const stored = localStorage.getItem(SHEET_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Erro ao ler ficha do Dungeon Paper:', e);
    }
    return DEFAULT_DW_SHEET;
  });

  const saveSheet = (newSheet) => {
    setSheet(newSheet);
    try {
      localStorage.setItem(SHEET_STORAGE_KEY, JSON.stringify(newSheet));
    } catch (e) {
      console.error('Falha ao salvar ficha:', e);
    }
  };

  const updateHp = (delta) => {
    setSheet((prev) => {
      const newHp = Math.max(0, Math.min(prev.maxHp, prev.hp + delta));
      const updated = { ...prev, hp: newHp };
      saveSheet(updated);
      return updated;
    });
  };

  const updateStatScore = (statName, newScore) => {
    const score = Math.max(1, Math.min(18, Number(newScore) || 10));
    const mod = calculateDwMod(score);

    setSheet((prev) => {
      const nextStats = {
        ...prev.stats,
        [statName]: { value: score, mod },
      };

      // Se mexeu em CON, recalcula o maxHp
      let newMaxHp = prev.maxHp;
      if (statName === 'CON') {
        const classDef = DW_CLASSES[prev.classId] || DW_CLASSES.guerreiro;
        newMaxHp = classDef.baseHp + score;
      }

      const updated = {
        ...prev,
        stats: nextStats,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp),
      };
      saveSheet(updated);
      return updated;
    });
  };

  const changeClass = (classId) => {
    const classDef = DW_CLASSES[classId];
    if (!classDef) return;

    setSheet((prev) => {
      const conScore = prev.stats.CON?.value || 10;
      const newMaxHp = classDef.baseHp + conScore;

      const updated = {
        ...prev,
        classId: classDef.id,
        className: classDef.name,
        damageDice: classDef.damageDice,
        baseHp: classDef.baseHp,
        maxHp: newMaxHp,
        hp: Math.min(prev.hp, newMaxHp),
      };
      saveSheet(updated);
      return updated;
    });
  };

  const addBond = (bondText) => {
    if (!bondText.trim()) return;
    setSheet((prev) => {
      const updated = { ...prev, bonds: [...prev.bonds, bondText.trim()] };
      saveSheet(updated);
      return updated;
    });
  };

  const removeBond = (index) => {
    setSheet((prev) => {
      const updated = { ...prev, bonds: prev.bonds.filter((_, i) => i !== index) };
      saveSheet(updated);
      return updated;
    });
  };

  const addItem = (item) => {
    setSheet((prev) => {
      const updated = { ...prev, inventory: [...prev.inventory, item] };
      saveSheet(updated);
      return updated;
    });
  };

  const removeItem = (index) => {
    setSheet((prev) => {
      const updated = { ...prev, inventory: prev.inventory.filter((_, i) => i !== index) };
      saveSheet(updated);
      return updated;
    });
  };

  return {
    sheet,
    saveSheet,
    updateHp,
    updateStatScore,
    changeClass,
    addBond,
    removeBond,
    addItem,
    removeItem,
  };
}
