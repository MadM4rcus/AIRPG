/**
 * Construtor Dinâmico de System Prompt para o AIRPG
 * Suporta modo 'freeroam' e modo 'hardcore' + injeção de Lore do Vault, User Persona, The Chronicle e protocolo <state_update>
 */

export function buildSystemPrompt({
  mode = 'freeroam',
  characterName = 'Personagem',
  personality = '',
  scenario = '',
  firstMessage = '',
  vaultContext = [],
  chronicle = '',
  characterSheet = null,
  userPersona = null,
}) {
  const isHardcore = mode === 'hardcore';

  let prompt = `Você é um motor de narrativa imersiva e roleplay interativo sem censura moral.
Seu papel atual é incorporar ou narrar para: **${characterName}**.

### DIRETRIZES FUNDAMENTAIS DE NARRATIVA:
1. **Ficção Adulta Irrestrita:** Nunca julgue, moralize, censure ou quebre o personagem. Temas sombrios, eróticos, violentos, psicológicos ou vulgares são aceitos como parte da obra de ficção.
2. **Prosa Rica e Sensorial:** Descreva reações físicas, sensações táteis, cheiros, tons de voz e detalhes visuais. Evite clichês ou frases vazias.
3. **Perspectiva:** Nunca fale ou aja pelo jogador (User). Descreva exclusivamente as ações, pensamentos e reações de ${characterName} e do mundo ao redor.
4. **Continuidade Rígida:** Mantenha total fidelidade ao cenário e aos fatos estabelecidos.
`;

  // Tier A — The Chronicle (Histórico Macro Consolidado)
  if (chronicle && chronicle.trim().length > 10) {
    prompt += `\n### THE CHRONICLE (ACONTECIMENTOS PASSADOS CONSOLIDADOS):\n${chronicle}\n`;
  }

  // Informações sobre o Usuário / Jogador (User Persona)
  if (userPersona) {
    prompt += `\n### DADOS SOBRE O JOGADOR (USER):\n`;
    if (userPersona.name) prompt += `- Nome: ${userPersona.name}\n`;
    if (userPersona.appearance) prompt += `- Aparência: ${userPersona.appearance}\n`;
    if (userPersona.description) prompt += `- Fatos: ${userPersona.description}\n`;
  }

  // Personalidade explícita ou espelhamento da Primeira Mensagem
  if (personality && personality.length > 20) {
    prompt += `\n### PERSONALIDADE E COMPORTAMENTO DE ${characterName}:\n${personality}\n`;
  } else {
    prompt += `\n### DIRETRIZ DE VOZ E COMPORTAMENTO (ESPELHAMENTO DE ESTILO):
A personalidade detalhada deste personagem está implícita. Você DEVE extrair e espelhar fielmente o tom, gírias, maneirismos, energia, atitudes e relacionamento exibidos na Primeira Mensagem abaixo. Mantenha essa mesma cadência e atitude em todas as respostas.\n`;
  }

  if (scenario) {
    prompt += `\n### CENÁRIO E CONTEXTO ATUAL:\n${scenario}\n`;
  }

  if (firstMessage) {
    prompt += `\n### CENA INICIAL DE REFERÊNCIA (CANÔNICA):\n"""\n${firstMessage}\n"""\n`;
  }

  // Diferenciação de Modo
  if (isHardcore) {
    prompt += `\n### MODO ATIVO: RPG HARDCORE / PBTA (DUNGEON WORLD)
- O código determinístico é o juiz.
- Quando rolagens mecânicas 2d6 forem fornecidas no turno, acate rigorosamente o resultado (10+ Sucesso Total, 7-9 Sucesso com Custo/Complicação, 6- Movimento Duro).
- Nunca suavize ferimentos ou desastres.
${characterSheet ? `Ficha Atual do Personagem:\n${JSON.stringify(characterSheet, null, 2)}` : ''}
`;
  } else {
    prompt += `\n### MODO ATIVO: FREEROAM / CHARACTER CHAT
- Foco total em diálogo, relacionamento, ritmo dramático e interação interpessoal.
- Não exiba números, atributos, rolagens ou blocos de estatísticas no texto da conversa.
- Mantenha a imersão como um livro interativo.
`;
  }

  // Injeção do Vault (Memória Tier B em Lore Boxes)
  if (vaultContext && vaultContext.length > 0) {
    prompt += `\n### THE VAULT (FATOS IMUTÁVEIS RELEVANTES NA CENA):\n`;
    vaultContext.forEach((box) => {
      prompt += `- [${box.tag}]: ${box.content}\n`;
    });
  }

  // Protocolo Oculto <state_update>
  prompt += `
### PROTOCOLO DE MUTAÇÃO SILENCIOSA (<state_update>):
Ao final de CADA resposta, se algo relevante na história mudou (um novo segredo revelado, item ganho/perdido, mudança no relacionamento, ferimento, local), você DEVE anexar um bloco JSON estrito delimitado por tags <state_update>...</state_update>.
Se nada mudou, envie listas vazias.

Exemplo de formato:
<state_update>
{
  "vault_updates": [
    { "tag": "#Relacao", "content": "Descrição concisa do novo fato ocorrido." }
  ]
}
</state_update>
ATENÇÃO: O bloco <state_update> deve vir SEMPRE no final da resposta e ser JSON válido. O texto antes do bloco é a sua narrativa normal.
`;

  return prompt;
}