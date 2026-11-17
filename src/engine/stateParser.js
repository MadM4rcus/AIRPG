/**
 * Parser Silencioso de Respostas da IA
 * Extrai e remove as tags <state_update>...</state_update> para que o usuário leia apenas a prosa limpa,
 * enquanto o motor processa as mutações de memória (Vault) e ficha (Hardcore RPG).
 */

export function parseAssistantResponse(rawContent) {
  if (!rawContent || typeof rawContent !== 'string') {
    return {
      cleanText: '',
      stateUpdate: null,
    };
  }

  const regex = /<state_update>([\s\S]*?)<\/state_update>/i;
  const match = rawContent.match(regex);

  if (!match) {
    return {
      cleanText: rawContent.trim(),
      stateUpdate: null,
    };
  }

  // Remove o bloco do texto visível
  const cleanText = rawContent.replace(regex, '').trim();
  const jsonString = match[1]?.trim();

  let stateUpdate = null;
  if (jsonString) {
    try {
      stateUpdate = JSON.parse(jsonString);
    } catch (err) {
      console.warn('Falha ao parsear JSON de <state_update>:', err, jsonString);
      // Fallback para tentar limpar caracteres quebrados comuns
      try {
        const sanitized = jsonString
          .replace(/^[^{]*/, '')
          .replace(/[^}]*$/, '');
        stateUpdate = JSON.parse(sanitized);
      } catch (nestedErr) {
        // Ignora silenciosamente se o modelo alucinou algo não-JSON
      }
    }
  }

  return {
    cleanText,
    stateUpdate,
  };
}
