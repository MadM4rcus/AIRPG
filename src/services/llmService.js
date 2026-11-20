export async function callLLM({ messages, systemPrompt, byokConfig }) {
  const {
    provider,
    apiKey,
    model,
    temperature = 0.85,
    customEndpointUrl = '',
  } = byokConfig;

  if (provider !== 'custom_endpoint' && !apiKey) {
    throw new Error('Chave de API não configurada. Abra o menu BYOK.');
  }

  if (provider === 'gemini') {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const contents = messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature, maxOutputTokens: 1200 },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `Erro Gemini (${response.status})`);
    }
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('O Gemini retornou resposta vazia.');
    return text;
  }

  let endpoint = 'https://openrouter.ai/api/v1/chat/completions';
  const headers = { 'Content-Type': 'application/json' };

  if (provider === 'groq') {
    endpoint = 'https://api.groq.com/openai/v1/chat/completions';
    headers.Authorization = `Bearer ${apiKey}`;
  } else if (provider === 'custom_endpoint') {
    const cleanBase = (customEndpointUrl || '').trim().replace(/\/+$/, '');
    if (!cleanBase) {
      throw new Error('Cole a URL do túnel (ex: https://xxx.trycloudflare.com) no BYOK.');
    }
    endpoint = cleanBase.endsWith('/chat/completions')
      ? cleanBase
      : cleanBase.endsWith('/v1')
      ? `${cleanBase}/chat/completions`
      : `${cleanBase}/v1/chat/completions`;
    if (apiKey?.trim()) headers.Authorization = `Bearer ${apiKey.trim()}`;
  } else {
    headers.Authorization = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = 'AIRPG';
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: model || 'local-model',
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature,
      max_tokens: 1200,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || `Erro na API (${response.status})`);
  }
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error('O modelo retornou uma resposta vazia.');
  return text;
}