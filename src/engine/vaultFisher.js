/**
 * Pescador RAG inteligente (custo zero de API):
 * Puxa TODOS os itens relevantes do Vault e da Biblioteca (Codex) citados na cena
 * ou fixados no mundo, sem cortes artificiais que causem amnésia.
 */
export function fishRelevantLore(vault = [], recentText = '', maxBoxes = 10) {
  if (!Array.isArray(vault) || vault.length === 0) return [];

  const textLower = recentText.toLowerCase();

  const scored = vault.map((box, index) => {
    let score = 0;
    const tagClean = (box.tag || '').replace(/^#/, '').toLowerCase();

    if (tagClean && textLower.includes(tagClean)) score += 10;

    const words = `${tagClean} ${(box.content || '').toLowerCase()}`
      .split(/[\s,.;:!?()]+/)
      .filter((w) => w.length >= 4);

    for (const w of words) {
      if (textLower.includes(w)) score += 2;
    }

    score += index * 0.05;
    return { box, score };
  });

  return scored
    .filter((item) => item.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxBoxes)
    .map((item) => item.box);
}

export function fishRelevantCodex(
  codex = [],
  recentText = '',
  pinnedIds = [],
  maxItems = 15
) {
  if (!Array.isArray(codex) || codex.length === 0) return [];

  const textLower = recentText.toLowerCase();
  const pinnedSet = new Set(pinnedIds || []);

  const scored = codex.map((entry) => {
    let score = 0;
    const isPinned = pinnedSet.has(entry.id);
    const tagClean = (entry.tag || '').replace(/^#/, '').toLowerCase();
    const nameLower = (entry.name || '').toLowerCase();

    // Itens fixados nesta campanha/conversa sempre entram
    if (isPinned) score += 20;

    // Citados diretamente por #tag ou nome completo sempre entram
    if (tagClean && textLower.includes(tagClean)) score += 15;
    if (nameLower && textLower.includes(nameLower)) score += 12;

    // Palavras-chave do nome (ex: "Valéria", "Taverna", "Éter")
    const nameWords = nameLower.split(/[\s,.-]+/).filter((w) => w.length >= 4);
    for (const w of nameWords) {
      if (textLower.includes(w)) score += 5;
    }

    return { entry, score };
  });

  // Entra tudo que foi fixado ou citado na cena (score >= 5), até o teto seguro de 15 itens
  return scored
    .filter((item) => item.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxItems)
    .map((item) => item.entry);
}