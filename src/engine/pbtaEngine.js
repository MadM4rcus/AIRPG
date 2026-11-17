/**
 * Motor PbtA / Dungeon World (Powered by the Apocalypse)
 * Resolução mecânica determinística em 2d6 + Atributo (-1 a +3)
 */

export const PBTA_MOVES = [
  {
    id: 'hack_and_slash',
    name: 'Matar & Pilhar',
    attribute: 'FOR',
    icon: '⚔️',
    description: 'Quando atacar em combate corpo a corpo contra um inimigo que revida.',
    on10: 'Você causa seu dano e evita a retaliação do inimigo.',
    on7_9: 'Você causa seu dano, mas o inimigo contra-ataca e causa dano a você.',
    on6: 'Você erra o golpe ou se coloca em uma situação terrível. O Mestre faz um Movimento Duro.',
  },
  {
    id: 'volley',
    name: 'Disparar',
    attribute: 'DES',
    icon: '🏹',
    description: 'Quando disparar uma arma de longa distância contra um alvo.',
    on10: 'Você acerta e causa seu dano sem complicações.',
    on7_9: 'Você acerta, mas escolha um: gasta munição, causa dano reduzido ou se coloca em perigo.',
    on6: 'O disparo erra, sua arma emperra ou a munição se esgota. Movimento Duro do Mestre.',
  },
  {
    id: 'defy_danger',
    name: 'Desafiar o Perigo',
    attribute: 'DES', // Padrão DES, mas pode ser qualquer um
    icon: '⚡',
    description: 'Quando agir sob fogo cerrado ou reagir a uma ameaça iminente.',
    on10: 'Você supera o perigo exatamente como pretendia.',
    on7_9: 'Você hesita, tropeça ou se esforça demais: o Mestre oferece um custo, complicação ou escolha desagradável.',
    on6: 'O desastre acontece. O perigo se concretiza diretamente.',
  },
  {
    id: 'discern_realities',
    name: 'Discernir Realidades',
    attribute: 'SAB',
    icon: '🔍',
    description: 'Quando inspecionar atentamente uma situação ou ambiente suspeito.',
    on10: 'Faça 3 perguntas sinceras ao Mestre sobre o que está acontecendo aqui.',
    on7_9: 'Faça 1 pergunta sincera ao Mestre sobre a situação.',
    on6: 'Você foca na coisa errada ou chama a atenção de algo que estava à espreita.',
  },
  {
    id: 'spout_lore',
    name: 'Falar Sobre Conhecimento',
    attribute: 'INT',
    icon: '📜',
    description: 'Quando consultar seus estudos ou lendas sobre monstros, magia e história.',
    on10: 'O Mestre revela algo interessante e imediatamente útil sobre o assunto.',
    on7_9: 'O Mestre revela apenas algo interessante; cabe a você descobrir a utilidade.',
    on6: 'Seus conhecimentos estão desatualizados, incompletos ou você se lembra de um fato aterrorizante.',
  },
  {
    id: 'parley',
    name: 'Negociar / Chantagear',
    attribute: 'CAR',
    icon: '🗣️',
    description: 'Quando tiver uma moeda de troca ou promessa e exigir algo de um NPC.',
    on10: 'O NPC aceita o que você pede se você cumprir a sua parte.',
    on7_9: 'O NPC exige garantias concretas primeiro antes de colaborar.',
    on6: 'O NPC se sente ofendido, trai sua confiança ou dobra a aposta contra você.',
  },
];

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function executePbtaRoll({ move, attributeModifier = 0, customAction = '' }) {
  const d1 = rollD6();
  const d2 = rollD6();
  const diceTotal = d1 + d2;
  const finalTotal = diceTotal + attributeModifier;

  let tier = '6-';
  let tierName = 'FALHA / MOVIMENTO DURO (6-)';
  let instruction = move.on6;

  if (finalTotal >= 10) {
    tier = '10+';
    tierName = 'SUCESSO TOTAL (10+)';
    instruction = move.on10;
  } else if (finalTotal >= 7) {
    tier = '7-9';
    tierName = 'SUCESSO PARCIAL / COM CUSTO (7-9)';
    instruction = move.on7_9;
  }

  const promptInjection = `[RESOLUÇÃO MECÂNICA PBTA / DUNGEON WORLD (O CÓDIGO É O JUIZ)]:
- Movimento: "${move.name}" (${move.attribute})
- Ação declarada: "${customAction || move.description}"
- Rolagem 2d6: [${d1}, ${d2}] = ${diceTotal} + Modificador (${attributeModifier}) = Total ${finalTotal}
- RESULTADO SAGRADO: **${tierName}**
- DIRETRIZ OBRIGATÓRIA PARA A NARRATIVA:
${instruction}
ATENÇÃO: Você DEVE respeitar este resultado. Se for 7-9, você é OBRIGADO a impor uma consequência desagradável ou custo. Se for 6-, narre uma virada dura contra o jogador.`;

  return {
    d1,
    d2,
    diceTotal,
    modifier: attributeModifier,
    finalTotal,
    tier,
    tierName,
    instruction,
    promptInjection,
  };
}
