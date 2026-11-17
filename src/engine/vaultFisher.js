/**
 * Motor Pescador de Tags (The Vault - Tag Fisher RAG)
 * Analisa a cena ativa e a intenção do usuário para injetar no System Prompt
 * apenas as caixas de memória relevantes, economizando tokens e garantindo coerência cirúrgica.
 */

// Stopwords comuns para ignorar na pescaria
const STOPWORDS = new Set([
  'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'pelo', 'pela', 'para', 'com', 'sem',
  'e', 'ou', 'mas', 'que', 'se', 'eu', 'voce', 'você', 'ele', 'ela', 'nosso',
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'you', 'i'
]);

function cleanText(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ');
}

/**
 * Pescador Dinâmico de Caixas de Lore
 * @param {string} userMessage Mensagem enviada pelo usuário
 * @param {Array} recentMessages Últimos turnos da conversa (Buffer C)
 * @param {Array} vault Todas as caixas de Lore deste mundo
 * @param {number} maxBoxes Limite de caixas pescadas por turno (default 6)
 */
export function fishRelevantVaultBoxes({ userMessage = '', recentMessages = [], vault = [], maxBoxes = 6 }) {
  if (!vault || vault.length === 0) return { activeBoxes: [], activeTags: [] };

  // Contexto da cena imediata: mensagem atual + últimas 2 mensagens
  const sceneText = [
    userMessage,
    ...recentMessages.slice(-2).map((m) => m.content || '')
  ].join(' ');

  const cleanedScene = cleanText(sceneText);
  const wordsInScene = new Set(
    cleanedScene
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
  );

  const scoredBoxes = vault.map((box) => {
    let score = 0;
    const tagClean = cleanText(box.tag.replace(/^#/, ''));
    const contentClean = cleanText(box.content);

    // 1. Regras globais têm prioridade máxima de injeção
    if (box.tag.toLowerCase().includes('global') || box.tag.toLowerCase().includes('regra')) {
      score += 100;
    }

    // 2. Pontua por correspondência exata de palavras da Tag na cena
    const tagTokens = tagClean.split(/[_-\s]+/);
    for (const token of tagTokens) {
      if (token.length > 2 && wordsInScene.has(token)) {
        score += 15;
      }
    }

    // 3. Pontua por menções a termos do conteúdo
    const contentTokens = contentClean.split(/\s+/);
    for (const token of contentTokens) {
      if (token.length > 3 && wordsInScene.has(token)) {
        score += 2;
      }
    }

    return {
      box,
      score,
    };
  });

  // Ordena por maior pontuação
  scoredBoxes.sort((a, b) => b.score - a.score);

  // Filtra as que tiveram relevância (ou regras globais)
  const selected = scoredBoxes
    .filter((item) => item.score > 0)
    .slice(0, maxBoxes)
    .map((item) => item.box);

  // Se nada foi pontuado (conversa genérica), seleciona as primeiras 3 caixas mais fundamentais
  const activeBoxes = selected.length > 0 ? selected : vault.slice(0, 3);
  const activeTags = activeBoxes.map((b) => b.tag);

  return {
    activeBoxes,
    activeTags,
  };
}
