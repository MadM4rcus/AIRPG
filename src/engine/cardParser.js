/**
 * Mecanismo Sanguessuga: Parser e Importador Universal de Personagens
 * Suporta Character Card V2 (JSON bruto) e Extração Inteligente de Texto Colado (SpicyChat, c.ai, Jan, etc.)
 */

export function parseCharacterCardJSON(rawJson) {
  let data = typeof rawJson === 'string' ? JSON.parse(rawJson) : rawJson;

  // Se vier do estado interno do SpicyChat / Next.js
  if (data?.props?.pageProps?.character) {
    const c = data.props.pageProps.character;
    return {
      name: c.name || 'Sem Nome',
      avatar: c.avatar_url || '🎭',
      personality: c.personality || c.description || '',
      scenario: c.world_scenario || '',
      firstMessage: c.first_message || c.greeting || '',
      mesExample: c.dialogue_examples || '',
      creatorNotes: '',
      systemPrompt: '',
      tags: c.tags || [],
    };
  }

  // Character Card V2 padrão
  if (data.data) {
    const d = data.data;
    return {
      name: d.name || 'Sem Nome',
      avatar: d.avatar || '🎭',
      personality: d.personality || d.description || '',
      scenario: d.scenario || '',
      firstMessage: d.first_mes || '',
      mesExample: d.mes_example || '',
      creatorNotes: d.creator_notes || '',
      systemPrompt: d.system_prompt || '',
      tags: d.tags || [],
    };
  }

  // Character Card V1 / Formato Flat
  return {
    name: data.name || data.char_name || 'Sem Nome',
    avatar: data.avatar || '🎭',
    personality: data.personality || data.description || data.char_persona || '',
    scenario: data.scenario || data.world_scenario || '',
    firstMessage: data.first_mes || data.greeting || '',
    mesExample: data.mes_example || '',
    creatorNotes: data.creator_notes || '',
    systemPrompt: '',
    tags: data.tags || [],
  };
}

/**
 * Parser Inteligente de Texto Copiado da Tela
 */
export function parseRawTextProfile(rawText) {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('Texto inválido para importação.');
  }

  const text = rawText.trim();

  // Caso 1: Detecção de padrão SpicyChat copiado
  if (text.includes('Saudações') || text.includes('Greetings')) {
    const parts = text.split(/(?:Saudações|Greetings)/i);
    const headerPart = parts[0];
    let greetingPart = parts[1] || '';

    greetingPart = greetingPart.replace(/(?:MOSTRAR MENOS|SHOW LESS|MOSTRAR MAIS|SHOW MORE)[\s\S]*$/i, '').trim();

    const headerLines = headerPart
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('http') && !l.startsWith('[') && !l.includes('fichas') && !l.includes('tokens') && l !== 'Voltar' && l !== 'Início' && l !== 'Favoritado' && l !== 'Compartilhar' && l !== 'Converse agora' && !l.includes('Obtenha o Premium'));

    let name = headerLines[0] || 'Novo Personagem';
    if (name.startsWith('@') && headerLines[1]) {
      name = headerLines[1];
    }

    const personalityLines = headerLines.filter((l) => l !== name && !l.startsWith('@') && !l.includes('%') && isNaN(Number(l.replace('k', ''))));
    const personality = personalityLines.join('\n\n') || headerPart;

    return {
      name: name.slice(0, 50),
      avatar: '🎭',
      personality: personality,
      scenario: 'Cenário importado via Sanguessuga.',
      firstMessage: greetingPart || '...',
      mesExample: '',
      tags: ['SpicyChat', 'Importado'],
    };
  }

  // Caso 2: Texto padrão com marcadores de linha
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  let name = lines[0] || 'Novo Personagem';
  let personality = text;
  let firstMessage = '*Aproximo-me de você em silêncio, observando seus movimentos com atenção.*';

  if (text.toLowerCase().includes('first message:') || text.toLowerCase().includes('primeira mensagem:')) {
    const splitted = text.split(/(?:first message|primeira mensagem):/i);
    personality = splitted[0].trim();
    firstMessage = splitted[1]?.trim() || firstMessage;
  }

  return {
    name: name.slice(0, 50),
    avatar: '🎭',
    personality,
    scenario: '',
    firstMessage,
    mesExample: '',
    tags: ['Importado'],
  };
}

/**
 * Bookmarklet Avançado do Sanguessuga:
 * Localiza especificamente a descrição de introdução antes das tags
 */
export const SANGUESSUGA_BOOKMARKLET_CODE = `javascript:(function(){
  try {
    let name = '', desc = '', greeting = '';

    if (window.__NEXT_DATA__?.props?.pageProps?.character) {
      const c = window.__NEXT_DATA__.props.pageProps.character;
      name = c.name || '';
      desc = c.description || c.personality || '';
      greeting = c.first_message || c.greeting || '';
    }

    if (!greeting) {
      name = name || document.querySelector('h1, h2')?.innerText || document.title;
      
      const allText = document.body.innerText;
      if (allText.includes('Saudações') || allText.includes('Greetings')) {
        const parts = allText.split(/(?:Saudações|Greetings)/i);
        greeting = (parts[1] || '').split(/(?:MOSTRAR MENOS|SHOW LESS)/i)[0].trim();
        
        // Pega os parágrafos que antecedem a saudação buscando a descrição curta
        const beforeText = parts[0];
        const lines = beforeText.split('\\n').map(l => l.trim()).filter(l => l.length > 25 && !l.startsWith('http') && !l.startsWith('['));
        if (lines.length > 0) {
          desc = lines[lines.length - 1]; // Pega a linha descritiva antes das tags/saudação
        }
      }
    }

    const payload = JSON.stringify({ name: (name || 'Bot').trim(), personality: desc.trim(), first_mes: greeting.trim() });
    
    const textArea = document.createElement('textarea');
    textArea.value = payload;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    alert('SANGUESSUGA: Copiado com sucesso! Agora cole na aba "Sanguessuga" do AIRPG.');
  } catch(e) {
    alert('Erro ao sugar: ' + e.message);
  }
})();`;
