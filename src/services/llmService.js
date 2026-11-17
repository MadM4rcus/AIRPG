/**
 * Serviço Unificado de Inferência Multi-Provider (BYOK)
 * Suporte a: OpenRouter (com foco em modelos :free e RP uncensored), Groq e Google Gemini
 */

export async function callLLM({ messages, systemPrompt, byokConfig }) {
  const provider = byokConfig.provider;
  const apiKey = byokConfig.apiKey?.trim();
  const model = byokConfig.model?.trim();

  if (!apiKey) {
    throw new Error(`Chave de API não informada para o provedor ${provider.toUpperCase()}.`);
  }

  if (provider === 'openrouter') {
    return callOpenRouter({ messages, systemPrompt, apiKey, model });
  }

  if (provider === 'groq') {
    return callGroq({ messages, systemPrompt, apiKey, model });
  }

  if (provider === 'gemini') {
    return callGemini({ messages, systemPrompt, apiKey, model });
  }

  throw new Error(`Provedor desconhecido: ${provider}`);
}

/**
 * OpenRouter API (Compatível com OpenAI REST)
 * Headers HTTP-Referer e X-Title para evitar penalidades de rate limit em modelos :free
 */
async function callOpenRouter({ messages, systemPrompt, apiKey, model }) {
  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  formattedMessages.push(...messages);

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://airpg.local',
      'X-Title': 'AIRPG Engine',
    },
    body: JSON.stringify({
      model: model || 'nousresearch/hermes-3-llama-3.1-405b:free',
      messages: formattedMessages,
      temperature: 0.85,
      top_p: 0.95,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `Erro OpenRouter (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenRouter retornou resposta vazia.');
  }

  return content;
}

/**
 * Groq Cloud API (Compatível com OpenAI REST)
 */
async function callGroq({ messages, systemPrompt, apiKey, model }) {
  const formattedMessages = [];
  if (systemPrompt) {
    formattedMessages.push({ role: 'system', content: systemPrompt });
  }
  formattedMessages.push(...messages);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: formattedMessages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `Erro Groq (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Groq retornou resposta vazia.');
  }

  return content;
}

/**
 * Google Gemini REST API (com safetySettings em BLOCK_NONE para evitar falso-positivo em RP/NSFW/Dark Fantasy)
 */
async function callGemini({ messages, systemPrompt, apiKey, model }) {
  const cleanModel = (model || 'gemini-1.5-flash').replace(/^google\//, '');
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${cleanModel}:generateContent?key=${apiKey}`;

  // Converte formato de mensagens para o padrão contents do Gemini
  const contents = messages.map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const payload = {
    contents,
    generationConfig: {
      temperature: 0.9,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
    // Desbloqueia filtros para permitir temas adultos e ficção irrestrita
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }],
    };
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const message = errData?.error?.message || `Erro Gemini (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const candidate = data?.candidates?.[0];

  if (candidate?.finishReason === 'SAFETY') {
    throw new Error('Gemini bloqueou a resposta por segurança. Recomendamos alternar para o OpenRouter (Hermes 3 :free) para cenas sem censura.');
  }

  const content = candidate?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Gemini retornou conteúdo vazio.');
  }

  return content;
}
