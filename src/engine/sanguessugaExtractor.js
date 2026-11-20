import { callLLM } from '../services/llmService';

function tryParseExtractedJson(rawText) {
  const cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('A IA não retornou um JSON válido na extração.');
  }

  let candidate = jsonMatch[0]
    // Remove vírgulas sobrando antes de } ou ]
    .replace(/,\s*([}\]])/g, '$1');

  try {
    return JSON.parse(candidate);
  } catch (firstErr) {
    // Fallback: extrai os campos principais e cada item válido de codexItems via regex
    const extractStringField = (key) => {
      const m = candidate.match(new RegExp(`"${key}"\\s*:\\s*"((?:\\\\.|[^"\\\\])*)"`));
      if (!m) return '';
      try {
        return JSON.parse(`"${m[1]}"`);
      } catch {
        return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    };

    const codexItems = [];
    const itemRegex =
      /\{\s*"category"\s*:\s*"([^"]+)"\s*,\s*"name"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"tag"\s*:\s*"((?:\\.|[^"\\])*)"\s*,\s*"summary"\s*:\s*"((?:\\.|[^"\\])*)"\s*\}/g;

    let match;
    while ((match = itemRegex.exec(candidate)) !== null) {
      codexItems.push({
        category: match[1],
        name: match[2].replace(/\\"/g, '"'),
        tag: match[3].replace(/\\"/g, '"'),
        summary: match[4].replace(/\\"/g, '"'),
      });
    }

    const name = extractStringField('name');
    if (!name && codexItems.length === 0) {
      throw firstErr;
    }

    return {
      name,
      tag: extractStringField('tag'),
      personality: extractStringField('personality'),
      scenario: extractStringField('scenario'),
      firstMessage: extractStringField('firstMessage'),
      codexItems,
    };
  }
}

export async function extractBotAndCodexFromRawText({
  rawText,
  targetType = 'chat',
  byokSettings,
}) {
  const systemPrompt = `You are an expert RPG & Roleplay Archivist.
Analyze the raw text provided and return ONLY valid JSON, with no markdown fences and no commentary outside the JSON.

Exact JSON structure:
{
  "name": "Main title of the scenario, world, or character",
  "tag": "Short genre tag (e.g., Reality TV, Dark Fantasy, Sci-Fi)",
  "personality": "Concise summary of the premise, tone, and general rules (max 4 sentences)",
  "scenario": "Short description of the opening location and situation (max 3 sentences)",
  "firstMessage": "Opening scene / greeting preserving the original opening",
  "codexItems": [
    {
      "category": "NPC" | "LOCAL" | "MUNDO",
      "name": "Name of the NPC, Location, or Rule",
      "tag": "#ShortTag",
      "summary": "Dense 1-2 sentence description with appearance, personality, role, or rules."
    }
  ]
}

CRITICAL RULES:
- Extract ALL relevant NPCs, Locations, and World Rules into "codexItems".
- Keep each "summary" short (1-2 sentences) to save tokens.
- NEVER put unescaped double quotes (") inside JSON string values; use single quotes (') for inner quotes or dialogue inside JSON strings.
- Preserve the ORIGINAL LANGUAGE of the pasted text (if English, write every JSON value in English; if Portuguese, write in Portuguese), unless an explicit instruction at the end requests a specific language.`;

  const responseText = await callLLM({
    systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Target mode: ${
          targetType === 'rpg' ? 'RPG Campaign' : 'Freeform Chat'
        }\n\nRaw text:\n${rawText.slice(0, 12000)}`,
      },
    ],
    byokConfig: {
      provider: byokSettings.provider,
      apiKey: byokSettings.apiKey,
      model: byokSettings.model,
      customEndpointUrl: byokSettings.customEndpointUrl,
      temperature: 0.2,
    },
  });

  const parsed = tryParseExtractedJson(responseText);

  return {
    type: targetType,
    name: parsed.name || 'Cenário Importado',
    tag: parsed.tag || (targetType === 'rpg' ? 'Campanha PbtA' : 'Freeroam'),
    personality: parsed.personality || '',
    scenario: parsed.scenario || '',
    firstMessage: parsed.firstMessage || '— Cena iniciada.',
    codexItems: Array.isArray(parsed.codexItems) ? parsed.codexItems : [],
  };
}