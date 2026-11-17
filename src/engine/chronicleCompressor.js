import { callLLM } from '../services/llmService';

const CHRONICLE_PROMPT = `Você é o Cronista Histórico do AIRPG.
Sua função é comprimir o histórico antigo de uma história em um resumo cronológico conciso, preservando fatos imutáveis, escolhas, ferimentos e revelações.

DIRETRIZES:
1. Escreva em 1 ou 2 parágrafos densos e objetivos em terceira pessoa.
2. Não omita nomes de locais, itens conquistados/perdidos, segredos revelados ou promessas feitas.
3. Se já houver uma crônica anterior, anexe os novos acontecimentos na ordem temporal correta.
4. Responda estritamente com a crônica atualizada, sem introduções ou despedidas.`;

/**
 * Compressor Recursivo de Memória: The Chronicle (Tier A)
 * @param {Array} oldMessages Bloco de mensagens antigas a serem comprimidas
 * @param {string} existingChronicle Crônica macro já acumulada
 * @param {Object} byokConfig Configuração da LLM para inferência rápida
 */
export async function compressMessagesIntoChronicle({ oldMessages, existingChronicle = '', byokConfig }) {
  if (!oldMessages || oldMessages.length === 0) return existingChronicle;

  const turnsText = oldMessages
    .map((m) => `${m.role === 'user' ? 'Jogador' : 'Personagem'}: ${m.content}`)
    .join('\n\n');

  const userPrompt = `Histórico anterior já consolidado:\n"""${existingChronicle || 'Início da jornada.'}"""\n\nNovos turnos para comprimir e incorporar:\n"""${turnsText}"""\n\nAtualize a Crônica com esses novos fatos:`;

  try {
    const updatedChronicle = await callLLM({
      messages: [{ role: 'user', content: userPrompt }],
      systemPrompt: CHRONICLE_PROMPT,
      byokConfig,
    });

    return updatedChronicle.trim();
  } catch (err) {
    console.warn('Falha na compressão do Chronicle:', err);
    return existingChronicle;
  }
}
