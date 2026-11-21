import { callLLM } from '../services/llmService';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function chunkArray(arr, size) {
  const result = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function callLLMWithRetry(params, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callLLM(params);
    } catch (err) {
      const msg = String(err?.message || '');
      if (msg.includes('429') && attempt < retries) {
        await sleep(4500 * (attempt + 1));
        continue;
      }
      throw err;
    }
  }
}

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
  // ETAPA 1: Extrai apenas metadados da cena + lista seca de NOMES de NPCs
  // =========================================================================
  onProgress?.('Passo 1/4 — Mapeando cena inicial e lista de personagens...');

  const plannerPrompt = `You are a Narrative Architect. Read the raw text and return ONLY valid JSON (no markdown).
Structure:
{
  "name": "Scenario or world title",
  "tag": "Short genre tag (e.g. Reality TV, Dark Fantasy)",
  "personality": "Core premise, narrative tone, roleplay style rules, and dialogue formatting examples (max 5 sentences)",
  "scenario": "Opening setting, time, and initial situation (max 3 sentences)",
  "firstMessage": "The full opening greeting/scene from the text",
  "npcNames": ["Name 1", "Name 2", "Name 3"]
}
Rules:
- In "npcNames", list ONLY the plain names of ALL distinct characters/NPCs found in the text (e.g. ["Victoria Sloane", "Marlene Price", "Jessica Ward"]). Do NOT write descriptions here.
- Preserve the ORIGINAL LANGUAGE of the text (keep English in English, Portuguese in Portuguese), unless an explicit instruction at the end specifies otherwise.
- NEVER use unescaped double quotes inside JSON strings; use single quotes (') instead.`;

  const plannerRes = await callLLMWithRetry({
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
    throw new Error('Falha ao mapear a cena inicial. Verifique o modelo no BYOK.');
  }

  // Fatiamento determinístico: no máximo 4 NPCs por request (curto e ultrarrápido!)
  const rawNames = Array.isArray(plan.npcNames)
    ? [...new Set(plan.npcNames.map((n) => String(n).trim()).filter(Boolean))].slice(0, 28)
    : [];
  const npcBatches = chunkArray(rawNames, 4);
  const totalSteps = npcBatches.length + 2;

  const allCodexItems = [];

  // =========================================================================
  // ETAPA 2..N: Extrai exatamente 4 NPCs por chamada (zero truncamento!)
  // =========================================================================
  for (let i = 0; i < npcBatches.length; i++) {
    const batchNames = npcBatches[i];
    onProgress?.(
      `Passo ${i + 2}/${totalSteps} — Extraindo NPCs (${i * 4 + 1}–${i * 4 + batchNames.length} de ${rawNames.length})...`
    );

    const batchPrompt = `Extract profiles ONLY for these exact characters from the text: ${batchNames.join(', ')}.
Return valid JSON only, no markdown:
{
  "items": [
    {
      "category": "NPC",
      "name": "Full Name (Age/Role)",
      "tag": "#ShortRoleTag",
      "summary": "1-2 concise sentences merging ALL traits, appearance, role, and secrets of this character."
    }
  ]
}
Rules:
- Extract ONLY the ${batchNames.length} requested characters.
- Use single quotes (') instead of double quotes inside strings.
- Keep the exact language of the source text.`;

    try {
      const res = await callLLMWithRetry({
        systemPrompt: batchPrompt,
        messages: [{ role: 'user', content: fullText }],
        byokConfig: baseByok,
      });
      const parsed = tryParseJson(res, null);
      const items = Array.isArray(parsed?.items) ? parsed.items : extractItemsFallback(res);
      allCodexItems.push(...items);
    } catch {
      // Continua para o próximo lote
    }
  }

  // =========================================================================
  // ETAPA FINAL: Extrai no máximo 5 regras/locais principais (resposta curta!)
  // =========================================================================
  onProgress?.(`Passo ${totalSteps}/${totalSteps} — Extraindo regras do show e locais...`);

  const worldPrompt = `Extract the top 4-5 most important LOCATIONS and WORLD/SHOW RULES from the text into valid JSON. No markdown.
Structure:
{
  "items": [
    {
      "category": "LOCAL" | "MUNDO",
      "name": "Location or System Name",
      "tag": "#ShortTag",
      "summary": "1 concise sentence explaining how this location or rule works."
    }
  ]
}
Rules:
- Limit to maximum 5 items total, with 1-sentence summaries so the response stays fast.
- Use single quotes (') instead of double quotes inside strings.
- Keep the exact language of the source text.`;

  try {
    const worldRes = await callLLMWithRetry({
      systemPrompt: worldPrompt,
      messages: [{ role: 'user', content: fullText }],
      byokConfig: baseByok,
    });
    const parsedWorld = tryParseJson(worldRes, null);
    const worldItems = Array.isArray(parsedWorld?.items)
      ? parsedWorld.items
      : extractItemsFallback(worldRes);
    allCodexItems.push(...worldItems);
  } catch {
    // Segue com os itens extraídos
  }

  // Consolidação e deduplicação
  const mergedMap = new Map();
  for (const item of allCodexItems) {
    if (!item?.name) continue;
    const baseKey = item.name.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
    if (!mergedMap.has(baseKey)) {
      mergedMap.set(baseKey, {
        category: ['NPC', 'LOCAL', 'MUNDO'].includes(item.category) ? item.category : 'NPC',
        name: item.name.trim(),
        tag: item.tag || '#Lore',
        summary: (item.summary || '').trim(),
      });
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