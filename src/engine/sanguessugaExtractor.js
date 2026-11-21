import { callLLM } from '../services/llmService';

function tryParseJson(rawText, fallback = null) {
  const cleaned = (rawText || '')
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return fallback;

  const candidate = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
  try {
    return JSON.parse(candidate);
  } catch {
    return fallback;
  }
}

function extractItemsFallback(rawText) {
  const items = [];
  const itemRegex =
    /\{\s*"category"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"tag"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"summary"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g;

  let match;
  while ((match = itemRegex.exec(rawText || '')) !== null) {
    items.push({
      category: match[1],
      name: match[2].replace(/\\"/g, '"'),
      tag: match[3].replace(/\\"/g, '"'),
      summary: match[4].replace(/\\"/g, '"'),
    });
  }
  return items;
}

export async function extractBotAndCodexFromRawText({
  rawText,
  targetType = 'chat',
  byokSettings,
  onProgress,
}) {
  const fullText = rawText.trim().slice(0, 18000);
  const baseByok = {
    provider: byokSettings.provider,
    apiKey: byokSettings.apiKey,
    model: byokSettings.model,
    customEndpointUrl: byokSettings.customEndpointUrl,
    temperature: 0.2,
  };

  // =========================================================================
  // ETAPA 1 (IA PLANEJADORA): Entende o cenário, separa abertura/estilo e
  // planeja quais grupos semânticos existem no texto para extrair depois.
  // =========================================================================
  onProgress?.('1/4 — Analisando estrutura do mundo e abertura...');

  const plannerPrompt = `You are a Narrative Architect. Read the raw roleplay prompt and extract ONLY the core session setup (do NOT list individual NPCs yet). Return valid JSON only, no markdown.

JSON structure:
{
  "name": "Scenario or world title",
  "tag": "Short genre tag (e.g., Reality TV, Dark Fantasy)",
  "personality": "Core premise, narrative tone, roleplay style rules, and any dialogue formatting examples (max 6 sentences)",
  "scenario": "Opening setting, time, and situation (max 3 sentences)",
  "firstMessage": "The full opening greeting/scene from the text (preserve line breaks and dialogue)",
  "characterGroups": [
    "Short description of group 1 of characters to extract (e.g., 'Main contestants')",
    "Short description of group 2 of characters to extract (e.g., 'TV host, producers and crew')"
  ]
}

Rules:
- Preserve the ORIGINAL LANGUAGE of the text (keep English in English, Portuguese in Portuguese), unless an explicit instruction at the end specifies otherwise.
- NEVER use unescaped double quotes inside JSON string values; use single quotes (') instead.
- Keep "characterGroups" to 1-3 distinct semantic groups so each group can be extracted cleanly in small batches.`;

  const plannerRes = await callLLM({
    systemPrompt: plannerPrompt,
    messages: [
      {
        role: 'user',
        content: `Target mode: ${targetType === 'rpg' ? 'RPG Campaign' : 'Freeform Chat'}\n\nFull raw text:\n${fullText}`,
      },
    ],
    byokConfig: baseByok,
  });

  const plan = tryParseJson(plannerRes, null);
  if (!plan || (!plan.name && !plan.firstMessage)) {
    throw new Error(
      'O modelo falhou ao estruturar a cena inicial (resposta vazia ou inválida). Tente outro modelo rápido.'
    );
  }

  const groups =
    Array.isArray(plan.characterGroups) && plan.characterGroups.length > 0
      ? plan.characterGroups.slice(0, 3)
      : ['All named characters and NPCs'];

  const totalSteps = groups.length + 2;
  const allCodexItems = [];

  // =========================================================================
  // ETAPA 2..N (EXTRATORES DE PERSONAGENS POR GRUPO SEMÂNTICO)
  // =========================================================================
  for (let i = 0; i < groups.length; i++) {
    const groupLabel = groups[i];
    onProgress?.(`Passo ${i + 2}/${totalSteps} — Extraindo: ${groupLabel}...`);

    const groupPrompt = `You are a Lore Extractor. Read the text and extract ONLY the characters belonging to this specific group: "${groupLabel}".
Return valid JSON only, no markdown:
{
  "items": [
    {
      "category": "NPC",
      "name": "Full Name (Age/Role)",
      "tag": "#ShortRoleTag",
      "summary": "1-2 dense sentences combining ALL details about this character from anywhere in the text (personality, role, secrets, behavior)."
    }
  ]
}
Rules:
- Only include characters from the requested group ("${groupLabel}").
- If a character is mentioned in multiple sections, merge their traits into ONE complete entry.
- Use single quotes (') instead of double quotes inside strings.
- Keep the exact language of the source text.`;

    try {
      const groupRes = await callLLM({
        systemPrompt: groupPrompt,
        messages: [{ role: 'user', content: fullText }],
        byokConfig: baseByok,
      });
      const parsedGroup = tryParseJson(groupRes, null);
      const batch = Array.isArray(parsedGroup?.items)
        ? parsedGroup.items
        : extractItemsFallback(groupRes);
      allCodexItems.push(...batch);
    } catch {
      // Continua os próximos grupos mesmo se um falhar
    }
  }

  // =========================================================================
  // ETAPA FINAL (EXTRATOR DE REGRAS, SISTEMAS E LOCAIS DO MUNDO)
  // =========================================================================
  onProgress?.(`Passo ${totalSteps}/${totalSteps} — Extraindo regras do show e locais...`);

  const worldPrompt = `You are a World-Building Archivist. Read the text and extract ONLY the key LOCATIONS and WORLD/GAME SYSTEMS (e.g., voting mechanics, prize rules, manipulation rules, cameras/privacy, setting details). Do NOT include individual characters.
Return valid JSON only, no markdown:
{
  "items": [
    {
      "category": "LOCAL" | "MUNDO",
      "name": "Location or System/Rule Name",
      "tag": "#SystemOrPlace",
      "summary": "1-2 dense sentences explaining how this place or rule operates in the simulation."
    }
  ]
}
Rules:
- Use "LOCAL" for physical places/settings and "MUNDO" for rules, mechanics, and lore systems.
- Use single quotes (') instead of double quotes inside strings.
- Keep the exact language of the source text.`;

  try {
    const worldRes = await callLLM({
      systemPrompt: worldPrompt,
      messages: [{ role: 'user', content: fullText }],
      byokConfig: baseByok,
    });
    const parsedWorld = tryParseJson(worldRes, null);
    const worldBatch = Array.isArray(parsedWorld?.items)
      ? parsedWorld.items
      : extractItemsFallback(worldRes);
    allCodexItems.push(...worldBatch);
  } catch {
    // Segue com os itens já coletados
  }

  // =========================================================================
  // CONSOLIDAÇÃO: Normaliza e funde duplicatas pelo nome base
  // =========================================================================
  const mergedMap = new Map();
  for (const item of allCodexItems) {
    if (!item?.name) continue;
    const baseKey = item.name
      .replace(/\s*\(.*?\)\s*/g, '')
      .trim()
      .toLowerCase();

    if (!mergedMap.has(baseKey)) {
      mergedMap.set(baseKey, {
        category: ['NPC', 'LOCAL', 'MUNDO'].includes(item.category) ? item.category : 'NPC',
        name: item.name.trim(),
        tag: item.tag || '#Lore',
        summary: (item.summary || '').trim(),
      });
    } else {
      // Se o mesmo personagem apareceu em dois grupos, mantém a descrição mais rica
      const existing = mergedMap.get(baseKey);
      if ((item.summary || '').length > existing.summary.length) {
        existing.summary = item.summary.trim();
        existing.name = item.name.trim();
      }
    }
  }

  return {
    type: targetType,
    name: plan.name || 'Cenário Importado',
    tag: plan.tag || (targetType === 'rpg' ? 'Campanha PbtA' : 'Freeroam'),
    personality: plan.personality || '',
    scenario: plan.scenario || '',
    firstMessage: plan.firstMessage || '— Cena iniciada.',
    codexItems: Array.from(mergedMap.values()),
  };
}