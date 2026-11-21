# IAgent.md — Contexto Mestre & Diretrizes Arquiteturais do Projeto AIRPG

Este documento contém o conhecimento arquitetural, as regras de negócio e o estado atual do projeto **AIRPG** (`https://madrpg.web.app`). Leia-o integralmente antes de propor alterações de código.

---

## 1. Visão Geral & Stack Tecnológica

O **AIRPG** é uma plataforma Web/Mobile-First de Roleplay Narrativo e RPG de Mesa com IA, baseada em **BYOK (Bring Your Own Key)** e **Autenticação Google (Gmail)** obrigatória antes do acesso à interface.

* **Frontend:** React 19 + Vite 8 + Tailwind CSS v4 + `lucide-react`
* **Infraestrutura & Banco de Dados:** Firebase Hosting (`madrpg.web.app`), Firebase Auth (`GoogleAuthProvider`) e Cloud Firestore (`mad-pjct`, plano Spark)
* **Provedores LLM Suportados:** OpenRouter (`:free` e pagos), Groq, Google AI Studio (Gemini) e endpoint customizado/KoboldCpp.
* **Foco de Custo:** Máxima economia de tokens, requisições LLM e escritas no Firestore (ideal para compartilhar o banco Spark entre pequenos grupos onde cada usuário traz sua própria chave BYOK).

---

## 2. Arquitetura de Dois Mundos Separados (Sem Mistura de Modos)

O aplicativo é dividido em **duas experiências e coleções completamente independentes**, sem botão de alternância de modo dentro de um mesmo chat:

### A. Conversas Livres / Freeroam Narrativo (`type: 'chat'`)
* **Onde fica:** Aba **Conversas Livres** no Feed + coleção isolada `airpg_users/{uid}/characters`.
* **Interface:** Limpa, sem ficha de RPG, sem HP e sem botões de rolagem de dados. Gaveta lateral focada em **The Vault** e **The Chronicle**.
* **Motor (`chatPromptBuilder.js`):** Suporta cenários freeroam vivos com múltiplos NPCs, locais e regras de mundo puxados do **Codex**, com foco em diálogo, tensão dramática e **agência própria dos NPCs**.

### B. Campanhas RPG — Mestre PbtA / Dungeon World (`type: 'rpg'`)
* **Onde fica:** Aba **Campanhas RPG** no Feed + coleção isolada `airpg_users/{uid}/campaigns` (com ficha Dungeon Paper vinculada).
* **Interface:** Barra superior com **PV (`HP`)**, acesso rápido à **Ficha Dungeon Paper** e botão de rolagem **`2d6` (Movimentos PbtA)** ao lado do campo de texto.
* **Motor (`rpgPromptBuilder.js`):** Compartilha a Biblioteca de NPCs, Locais e Regras de Mundo, mas impõe a ficha e os **dados `2d6` como juízes absolutos**.

---

## 3. Biblioteca Compartilhada (`Codex`), Biblioteca de Personas & Arquiteto de Mundos

* **Codex Global (`airpg_users/{uid}/codex` + `CodexModal.jsx`):** Repositório reutilizável entre Conversas Livres e Campanhas RPG para entidades enxutas (1–2 frases) divididas em **NPC**, **LOCAL** e **MUNDO** (Regras de Lore). Itens podem ser fixados (`pinnedCodexIds`) numa sessão ou pescados automaticamente pelo nome/`#tag`.
* **Biblioteca de Personas (`useProfiles.js` + `PersonaLibraryModal.jsx`):** Permite cadastrar múltiplos avatares/personagens do jogador (`userPersonas` e `activePersonaId` no doc do usuário) e alternar entre eles com um clique tanto no Feed quanto dentro de um chat ativo.
* **Arquiteto de Mundos (`WorldArchitectModal.jsx`):** Workspace de rascunho local em três etapas, com copiloto IA que cria mundos, limpa textos brutos colados e aplica ajustes preservando dados existentes. A publicação cria a sessão, o Codex e o histórico inicial em lote no Firestore; substitui o fluxo legado de extração.

---

## 4. Interruptor "Modo Deus" (God Mode — Único Botão em Comum)

Para combater o **viés de bajulação (sycophancy)** das IAs, ambos os tipos de chat compartilham um interruptor no topo: **Realista (God Mode OFF — Padrão)** vs. **Modo Deus (God Mode ON)**.

* **Realista (`godMode = false` — Padrão):**
  * **Nas Conversas Livres:** NPCs têm vontade própria, orgulho, limites, gostos e ritmo emocional. Não cedem instantaneamente a exageros ou avanços forçados do jogador; exigem conquista, coerência e contexto.
  * **No RPG:** Os dados `2d6`, os atributos, o nível e o equipamento da ficha são a lei. Tentativas impossíveis declaradas sem rolagem ou acima da capacidade do personagem falham de forma verossímil.
* **Modo Deus (`godMode = true`):**
  * Libera fantasia de poder / sandbox livre, onde as declarações do jogador são aceitas como verdade absoluta na cena.

---

## 5. Memória Econômica em 3 Camadas & Blindagem Firestore (Spark-Safe)

1. **Camada A — The Chronicle (`chronicleCompressor.js`):**
   * Roda automaticamente quando o chat passa de **12 mensagens**, compactando as mensagens mais antigas em um resumo factual contínuo e limpando-as do buffer ativo. Suporta um **Agente Cronista Secundário** rápido/gratuito configurado no BYOK (`useBYOK.js`).
2. **Camada B — The Vault & Codex (`vaultFisher.js` & `stateParser.js`):**
   * Banco de fatos dinâmicos da sessão (`vault`) somado à Biblioteca Compartilhada (`codex`). O Pescador RAG injeta os fatos relevantes e todos os itens do Codex fixados ou citados na cena (teto seguro de 15 itens).
3. **Camada C — Buffer Recente:**
   * Mantém os últimos **8 turnos inteiros** (4 pares de fala) na janela ativa.
4. **Otimização de Escritas no Firestore (`App.jsx` & `useCharacterSheet.js`):**
   * **1 gravação consolidada por turno:** O estado da sessão (`messages`, `vault` e `chronicle`) é atualizado instantaneamente no `localStorage` ao enviar a mensagem do usuário e gravado no Firestore **uma única vez** após a resposta da IA (e após a atualização de Vault/Crônica), reduzindo em até 75% o consumo de escritas.
   * **Debounce de 2 segundos na Ficha (`useCharacterSheet.js`):** Cliques rápidos em botões de PV (`-1`/`+1`) ou alterações de atributos aguardam 2 segundos de pausa antes de sincronizar com a nuvem.

---

## 6. Ritmo das Respostas e Experiência Visual

* **Controle de Tamanho da Resposta (`App.jsx` + `promptBuilder.js`):** Slider por perfil com quatro níveis — Curta, Média (padrão), Longa e Detalhada. A escolha é persistida no `localStorage` e aplicada como regra de extensão ao prompt, sem reduzir o limite de tokens da API.
* **Hospedagem de Imagens e GIFs (`imageUploadService.js` + `ImagePicker.jsx`):** Upload e importação por URL via ImgBB, com chave opcional configurada no `BYOKModal.jsx`. Imagens estáticas podem ser otimizadas via Canvas; GIFs ignoram o Canvas para preservar a animação. O seletor oferece colagem de imagem ou URL com fluxo mobile-first.
* **Lightbox Global (`ImageLightbox.jsx`):** Estado controlado pelo `App.jsx`, com visualização ampliada e navegação por swipe no celular. Ações para abrir imagens estão disponíveis nos avatares do Feed/Chat e nas bibliotecas (`CodexModal.jsx` e `PersonaLibraryModal.jsx`); o `BYOKModal.jsx` concentra a configuração da chave ImgBB.

---

## 7. Estrutura de Dados no Firestore (Isolada por Usuário)

* `airpg_users/{uid}`: Documento principal com `byokSettings`, `userPersona`, `userPersonas`, `activePersonaId` e `dungeonPaperSheet`.
* `airpg_users/{uid}/characters/{id}`: Coleção de sessões de Conversa Livre / Freeroam.
* `airpg_users/{uid}/campaigns/{id}`: Coleção de Campanhas RPG.
* `airpg_users/{uid}/codex/{id}`: Biblioteca Compartilhada de NPCs, Locais e Regras de Mundo.
* `airpg_users/{uid}/chats/{id}`: Histórico de mensagens, `vault` e `chronicle` de cada sessão.

---

## 8. Estado Atual de Implementação

* **Concluído (Arquitetura Completa em Produção):**
  * Autenticação Google (`LoginScreen.jsx`) e isolamento total por `uid` no Firestore (`firebase.js`).
  * Separação completa entre Conversas Livres (`characters` + `chatPromptBuilder.js`) e Campanhas RPG (`campaigns` + `rpgPromptBuilder.js`).
  * Biblioteca Compartilhada (`useCodex.js`, `CodexModal.jsx`) e Pescador RAG sem cortes artificiais (`vaultFisher.js`).
  * Biblioteca de Personas (`useProfiles.js`, `PersonaLibraryModal.jsx`) com troca rápida no Feed e no Chat ativo.
  * Vitrine inicial em pôsteres verticais (`aspect-[3/4]`) e Lobby do Mundo com elenco vinculado, atualização de capa e entrada no chat.
  * Arquiteto de Mundos em três etapas, com geração/extração por copiloto IA e publicação consolidada de sessão, Codex e primeira mensagem.
  * BYOK com presets gratuitos atualizados (OpenRouter, Groq, Google AI Studio) e guia integrado de criação de API Keys (`useBYOK.js`, `BYOKModal.jsx`).
  * Toggle Realista vs. Modo Deus (`godMode`), gravação consolidada de 1 escrita por turno no Firestore (`App.jsx`) e debounce de 2s na ficha (`useCharacterSheet.js`).
  * Controle de Tamanho da Resposta de quatro níveis, persistido por perfil e injetado no prompt.
  * Hospedagem de imagens/GIFs via ImgBB, seletor com colagem mobile-first e preservação de GIFs animados ao ignorar Canvas.
  * Lightbox global com swipe no celular, integrado ao Feed, ao Chat e às bibliotecas de Personas e Codex.
  * Chat Multi-Personagem com bolhas individuais, formato de fala identificado nos prompts e Barra de Diretor de Cena para direcionar o próximo turno de um NPC.

---
