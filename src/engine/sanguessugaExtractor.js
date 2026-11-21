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
      if (attempt < retries && (msg.includes('429') || msg.includes('524') || msg.includes('Failed to fetch'))) {
        await sleep(3500 * (attempt + 1));
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

function parsePipeLines(rawText, defaultCategory = 'NPC') {
  const lines = (rawText || '').split(/\r?\n/);
  const items = [];

  for (const line of lines) {
    const clean = line.replace(/^[-*•\d.)\s]+/, '').trim();
    if (!clean.includes('|')) continue;

    const parts = clean.split('|').map((p) => p.trim());
    if (parts.length >= 3) {
      const firstUpper = parts[0].toUpperCase();
      const hasCat = ['NPC', 'LOCAL', 'MUNDO'].includes(firstUpper);
      const category = hasCat ? firstUpper : defaultCategory;
      const name = hasCat ? parts[1] : parts[0];
      const tag = hasCat ? parts[2] : parts[1];
      const summary = hasCat ? parts.slice(3).join(' ') : parts.slice(2).join(' ');

      if (name && summary) {
        items.push({
          category,
          name,
          tag: tag.startsWith('#') ? tag : `#${tag.replace(/\s+/g, '')}`,
          summary,
        });
      }
    }
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

  // ETAPA 1: Premissa e abertura da cena
  onProgress?.('Passo 1/4 — Extraindo premissa e abertura da cena...');

  const corePrompt = `You are a Narrative Architect. Extract ONLY the core session setup into valid JSON (no markdown).
Structure:
{
  "name": "Scenario or world title",
  "tag": "Short genre tag (e.g. Reality TV, Dark Fantasy)",
  "personality": "Core premise, POV rules, roleplay style rules, and dialogue formatting examples (max 6 sentences)",
  "scenario": "Opening setting, time, and initial situation (max 3 sentences)",
  "firstMessage": "The full opening greeting/scene from the text"
}
Rules:
- Preserve the ORIGINAL LANGUAGE of the text (keep English in English, Portuguese in Portuguese), unless an explicit instruction at the end specifies otherwise.
- NEVER use unescaped double quotes inside JSON strings; use single quotes (') instead.`;

  const coreRes = await callLLMWithRetry({
    systemPrompt: corePrompt,
    messages: [
      {
        role: 'user',
        content: `Target mode: ${targetType === 'rpg' ? 'RPG Campaign' : 'Freeform Chat'}\n\nFull raw text:\n${fullText}`,
      },
    ],
    byokConfig: baseByok,
  });

  const plan = tryParseJson(coreRes, null);
  if (!plan || (!plan.name && !plan.firstMessage)) {
    throw new Error('Falha ao extrair a cena inicial. Verifique o modelo no BYOK.');
  }

  // ETAPA 2: Lista seca de nomes (excluindo {{user}})
  onProgress?.('Passo 2/4 — Mapeando personagens do texto...');

  const namesPrompt = `List EVERY named NPC character in the text (do NOT include {{user}}).
Output ONLY one name per line, nothing else. No bullets, no numbers, no JSON.`;

  const namesRes = await callLLMWithRetry({
    systemPrompt: namesPrompt,
    messages: [{ role: 'user', content: fullText }],
    byokConfig: baseByok,
  });

  const rawNames = [
    ...new Set(
      (namesRes || '')
        .split(/\r?\n/)
        .map((n) => n.replace(/^[-*•\d.)\s]+/, '').replace(/\(.*?\)/g, '').trim())
        .filter((n) => n && !n.toLowerCase().includes('user'))
    ),
  ].slice(0, 24);

  const npcBatches = chunkArray(rawNames, 4);
  const totalSteps = npcBatches.length + 3;
  const allCodexItems = [];

  // ETAPA 3..N: Extração por linhas pipe-separated (imune a quebra de JSON!)
  for (let i = 0; i < npcBatches.length; i++) {
    const batchNames = npcBatches[i];
    onProgress?.(
      `Passo ${i + 3}/${totalSteps} — Extraindo NPCs (${i * 4 + 1}–${i * 4 + batchNames.length} de ${rawNames.length})...`
    );

    const batchPrompt = `Extract profiles ONLY for these ${batchNames.length} characters: ${batchNames.join(', ')}.
Output STRICTLY one line per character using this exact pipe-separated format (NO JSON, NO markdown):
Name (Age/Role) | #ShortTag | 1-2 sentence summary of traits, role, and secrets.

Keep the exact language of the source text.`;

    try {
      const res = await callLLMWithRetry({
        systemPrompt: batchPrompt,
        messages: [{ role: 'user', content: fullText }],
        byokConfig: baseByok,
      });
      allCodexItems.push(...parsePipeLines(res, 'NPC'));
    } catch {
      // Continua para o próximo lote
    }
  }

  // ETAPA FINAL: Regras e locais em linhas pipe-separated
  onProgress?.(`Passo ${totalSteps}/${totalSteps} — Extraindo regras do show e locais...`);

  const worldPrompt = `Extract the 3 to 5 most important LOCATIONS and WORLD/SHOW RULES from the text.
Output STRICTLY one line per item using this exact pipe-separated format (NO JSON, NO markdown):
LOCAL or MUNDO | Name | #ShortTag | 1 sentence explaining how this location or rule operates.

Keep the exact language of the source text.`;

  try {
    const worldRes = await callLLMWithRetry({
      systemPrompt: worldPrompt,
      messages: [{ role: 'user', content: fullText }],
      byokConfig: baseByok,
    });
    allCodexItems.push(...parsePipeLines(worldRes, 'MUNDO'));
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