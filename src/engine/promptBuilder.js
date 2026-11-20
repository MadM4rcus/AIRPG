import { buildChatSystemPrompt } from './chatPromptBuilder';
import { buildRpgSystemPrompt } from './rpgPromptBuilder';

export function buildSystemPrompt(params) {
  const isRpg = params.entityType === 'rpg' || params.mode === 'hardcore';

  if (isRpg) {
    return buildRpgSystemPrompt({
      campaignName: params.characterName,
      worldDescription: params.personality,
      scenario: params.scenario,
      vaultContext: params.vaultContext,
      codexContext: params.codexContext,
      chronicle: params.chronicle,
      userPersona: params.userPersona,
      characterSheet: params.characterSheet,
      godMode: params.godMode,
    });
  }

  return buildChatSystemPrompt({
    characterName: params.characterName,
    personality: params.personality,
    scenario: params.scenario,
    vaultContext: params.vaultContext,
    codexContext: params.codexContext,
    chronicle: params.chronicle,
    userPersona: params.userPersona,
    godMode: params.godMode,
  });
}