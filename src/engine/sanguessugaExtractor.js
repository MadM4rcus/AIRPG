import { callLLM } from '../services/llmService';

/**
 * Lê texto bruto copiado de qualquer plataforma (ou página web) e destila em:
 * 1) Sessão principal (Conversa Livre ou Campanha RPG) com premissa enxuta
 * 2) Lista de objetos reutilizáveis para o Codex (NPCs, Locais e Regras de Mundo)
 */
export async function extractBotAndCodexFromRawText({
  rawText,
  targetType = 'chat',
  byokSettings,
}) {
  const systemPrompt = `Você é um Arquivista de RPG e Roleplay especialista em extrair e compactar fichas.
Analise o texto bruto fornecido (que pode conter lixo de interface web, descrições longas, lore e personagens) e retorne APENAS um JSON válido, sem markdown e sem explicações fora do JSON.

Estrutura exata do JSON:
{
  "name": "Nome principal da cena, mundo ou personagem",
  "tag": "Gênero curto (ex: Dark Fantasy, Sci-Fi, Romance)",
  "personality": "Resumo objetivo da premissa, tom e regras gerais (máx 3 frases)",
  "scenario": "Descrição curta do local e situação inicial (máx 2 frases)",
  "firstMessage": "Primeira fala ou abertura da cena em português",
  "codexItems": [
    {
      "category": "NPC" | "LOCAL" | "MUNDO",
      "name": "Nome do NPC, Local ou Regra",
      "tag": "#TagCurta",
      "summary": "Descrição densa e curta (1 a 2 frases) com aparência, personalidade, limites ou regras."
    }
  ]
}

Regras:
- Extraia TODOS os NPCs relevantes, Locais importantes e Regras de Mundo mencionados no texto para "codexItems".
- Mantenha cada "summary" curto (1-2 frases) para economizar tokens nas futuras conversas.
- Ignore menus, botões, contadores de mensagens ou lixo de HTML/página web.
- Traduza ou adapte para português do Brasil natural.`;

  const responseText = await callLLM({
    systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Modo destino: ${
          targetType === 'rpg' ? 'Campanha RPG' : 'Conversa Livre'
        }\n\nTexto bruto extraído:\n${rawText.slice(0, 12000)}`,
      },
    ],
    byokConfig: {
      provider: byokSettings.provider,
      apiKey: byokSettings.apiKey,
      model: byokSettings.model,
      temperature: 0.3,
    },
  });

  // Limpa eventuais blocos ```json ... ```
  const cleaned = responseText
    .replace(/^```json\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('A IA não retornou um JSON válido na extração.');
  }

  const parsed = JSON.parse(jsonMatch[0]);
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