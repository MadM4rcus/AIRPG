/**
 * Biblioteca Canônica de Classes / Playbooks do Dungeon World (Padrão Dungeon Paper)
 */

export const DW_CLASSES = {
  guerreiro: {
    id: 'guerreiro',
    name: 'Guerreiro',
    baseHp: 10,
    damageDice: 'd10',
    loadBase: 12,
    description: 'Um mestre do combate armado e sobrevivente de inúmeras batalhas.',
    startingMoves: [
      {
        name: 'Armadura Blindada',
        description: 'Você ignora a etiqueta "desajeitada" de qualquer armadura que vestir.',
      },
      {
        name: 'Arma Predileta',
        description: 'Você possui uma arma forjada exclusivamente para você que causa dano brutal.',
      },
    ],
  },
  ladrao: {
    id: 'ladrao',
    name: 'Ladrão',
    baseHp: 6,
    damageDice: 'd8',
    loadBase: 9,
    description: 'Especialista em sombras, armadilhas, venenos e ataques cirúrgicos.',
    startingMoves: [
      {
        name: 'Ataque Furtivo',
        description: 'Ao atacar um inimigo desprevenido ou indefeso corpo a corpo, cause +1d6 de dano adicional.',
      },
      {
        name: 'Perito em Armadilhas',
        description: 'Ao inspecionar uma área perigosa, você sempre detecta gatilhos mecânicos ou mágicos.',
      },
      {
        name: 'Envenenador',
        description: 'Você sabe como manipular e aplicar venenos mortais sem se expor ao perigo.',
      },
    ],
  },
  mago: {
    id: 'mago',
    name: 'Mago',
    baseHp: 4,
    damageDice: 'd4',
    loadBase: 7,
    description: 'Erudito do arcano capaz de dobrar a realidade com feitiços arriscados.',
    startingMoves: [
      {
        name: 'Grimório de Magias',
        description: 'Você carrega um livro de feitiços com rituais preparados durante o descanso.',
      },
      {
        name: 'Conjurar Feitiço (INT)',
        description: 'Ao lançar uma magia preparada, role 2d6+INT. 10+: O feitiço é lançado com sucesso. 7-9: O feitiço é lançado, mas escolha um: atrai atenção indesejada, sofre penalidade ou esquece o feitiço.',
      },
    ],
  },
  clerigo: {
    id: 'clerigo',
    name: 'Clérigo',
    baseHp: 8,
    damageDice: 'd6',
    loadBase: 10,
    description: 'Campeão da fé investido com o poder curativo e punitivo de sua divindade.',
    startingMoves: [
      {
        name: 'Divindade & Prece',
        description: 'Você serve a uma divindade ou preceito sagrado que concede bênçãos e milagres.',
      },
      {
        name: 'Expulsar Mortos-Vivos (SAB)',
        description: 'Ao erguer seu símbolo sagrado, force mortos-vivos e criaturas profanas a recuarem apavoradas.',
      },
    ],
  },
  bardo: {
    id: 'bardo',
    name: 'Bardo',
    baseHp: 6,
    damageDice: 'd6',
    loadBase: 9,
    description: 'Tecelão de lendas, música mágica e diplomacia afiada.',
    startingMoves: [
      {
        name: 'Arte Arcana (CAR)',
        description: 'Ao tecer música mágica, cure PV de aliados ou conceda bônus de combate.',
      },
      {
        name: 'Mestre da Fofoca e Tradição',
        description: 'Você já ouviu falar de quase todas as relíquias, lendas e monstros deste mundo.',
      },
    ],
  },
  ranger: {
    id: 'ranger',
    name: 'Ranger / Rastreador',
    baseHp: 8,
    damageDice: 'd8',
    loadBase: 11,
    description: 'Caçador solitário das fronteiras selvagens acompanhado de um companheiro animal.',
    startingMoves: [
      {
        name: 'Companheiro Animal',
        description: 'Você possui um predador leal treinado para rastrear e dilacerar presas em combate.',
      },
      {
        name: 'Tiro Certeiro',
        description: 'Seus disparos com arcos causam dano penetrante através de armaduras grossas.',
      },
    ],
  },
};
