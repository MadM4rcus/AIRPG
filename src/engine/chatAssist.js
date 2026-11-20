import { callLLM } from '../services/llmService';

export async function generateContinuationChunk({
  messages,
  systemPrompt,
  byokConfig,
}) {
  const lastMsg = messages[messages.length - 1];
  const continuationInstruction =
    lastMsg?.role === 'assistant'
      ? `[SYSTEM DIRECTION: Continue the scene seamlessly from the exact point where your last response ended. Do NOT repeat or summarize what you already wrote. Advance the action, dialogue, or sensory tension naturally in the exact same language and style.]`
      : `[SYSTEM DIRECTION: Advance the scene naturally with the character/world reacting to the current moment, maintaining the exact same language and style.]`;

  const recentSlice = messages.slice(-8);
  const augmentedMessages = [
    ...recentSlice,
    { role: 'user', content: continuationInstruction },
  ];

  return await callLLM({
    messages: augmentedMessages,
    systemPrompt,
    byokConfig,
  });
}

export async function generateUserReplySuggestion({
  messages,
  userPersona,
  characterName,
  scenario,
  byokConfig,
}) {
  const recentText = messages
    .slice(-6)
    .map(
      (m) =>
        `${m.role === 'user' ? userPersona.name : characterName}: ${m.content}`
    )
    .join('\n\n');

  const suggestionSystemPrompt = `You are a creative roleplay co-writer helping the human player craft their next turn.
Player Persona: ${userPersona.name} — ${userPersona.description || 'Protagonist'}
Scene / World: ${characterName} (${scenario || 'Interactive narrative'})

STRICT RULES:
1. Write ONLY the player's next action and/or dialogue (1 to 3 concise, expressive paragraphs).
2. Match the EXACT language used in the recent messages (if the chat is in English, write in English; if in Portuguese, write in Portuguese).
3. Write from ${userPersona.name}'s perspective/actions only. Never control ${characterName}.
4. Do NOT include quotes around the whole message, meta-comments, labels like "Suggestion:", or explanations—output ONLY the ready-to-send roleplay text.`;

  return await callLLM({
    messages: [
      {
        role: 'user',
        content: `Recent scene:\n\n${recentText}\n\nWrite ${userPersona.name}'s next response:`,
      },
    ],
    systemPrompt: suggestionSystemPrompt,
    byokConfig,
  });
}