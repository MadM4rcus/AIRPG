# IAgent.md — Contexto Mestre & Diretrizes Arquiteturais do Projeto AIRPG

Este documento contém o conhecimento arquitetural, as regras de negócio e o estado atual do projeto **AIRPG** (`https://madrpg.web.app`). Leia-o integralmente antes de propor alterações de código.

---

## 1. Visão Geral & Stack Tecnológica

O **AIRPG** é uma plataforma Web/Mobile-First de Roleplay Narrativo e RPG de Mesa com IA, baseada em **BYOK (Bring Your Own Key)** e **Autenticação Google (Gmail)** obrigatória antes do acesso à interface.

* **Frontend:** React 18 + Vite + Tailwind CSS v3 + `lucide-react`
* **Infraestrutura & Banco de Dados:** Firebase Hosting (`madrpg.web.app`), Firebase Auth (`GoogleAuthProvider`) e Cloud Firestore (`mad-pjct`)
* **Provedores LLM Suportados:** OpenRouter (`:free` e pagos), Groq e Google Gemini.
* **Foco de Custo:** Máxima economia de tokens e requisições (ideal para tiers gratuitos), mantendo coerência de memória em 3 camadas.

---

## 2. Arquitetura de Dois Mundos Separados (Sem Mistura de Modos)

O aplicativo é dividido em **duas experiências e coleções completamente independentes**, sem botão de alternância de modo dentro de um mesmo chat:

### A. Personagens — Conversa Livre & Narrativa (`type: 'chat'`)
* **Onde fica:** Aba **Personagens** no Feed + coleção isolada `airpg_users/{uid}/characters`.
* **Interface:** Limpa, sem ficha de RPG, sem HP e sem botões de rolagem de dados. Gaveta lateral apenas com **The Vault** e **The Chronicle**.
* **Motor (`chatPromptBuilder.js`):** Foco em diálogo, tensão dramática, romance/NSFW irrestrito e **agência própria dos NPCs**.

### B. Campanhas RPG — Mestre PbtA / Dungeon World (`type: 'rpg'`)
* **Onde fica:** Aba **Campanhas RPG** no Feed + coleção isolada `airpg_users/{uid}/campaigns` (com ficha Dungeon Paper vinculada).
* **Interface:** Barra superior com **HP**, acesso rápido à **Ficha Dungeon Paper** e botão de rolagem **`2d6` (Movimentos PbtA)** ao lado do campo de texto.
* **Motor (`rpgPromptBuilder.js`):** Foco na história do mundo como um todo, consequências reais e **dados `2d6` como juízes absolutos**.

---

## 3. Interruptor "Modo Deus" (God Mode — Único Botão em Comum)

Para combater o **viés de bajulação (sycophancy)** das IAs, ambos os tipos de chat compartilham um interruptor no topo: **Realista (God Mode OFF — Padrão)** vs. **Modo Deus (God Mode ON)**.

* **Realista (`godMode = false` — Padrão):**
  * **Nos Personagens:** NPCs têm vontade própria, orgulho, limites, gostos e ritmo emocional. Não cedem instantaneamente a exageros ou avanços forçados do jogador; exigem conquista, coerência e contexto.
  * **No RPG:** Os dados `2d6`, os atributos, o nível e o equipamento da ficha são a lei. Tentativas impossíveis declaradas sem rolagem ou acima da capacidade do personagem falham de forma verossímil.
* **Modo Deus (`godMode = true`):**
  * Libera fantasia de poder / sandbox livre, onde as declarações do jogador são aceitas como verdade absoluta na cena.

---

## 4. Memória Econômica em 3 Camadas (Token-Saver)

1. **Camada A — The Chronicle (`chronicleCompressor.js`):**
   * Roda automaticamente quando o chat passa de **12 mensagens**, compactando as 6 mais antigas em um resumo factual contínuo (1–2 parágrafos) e limpando-as do buffer ativo. Pode usar um modelo secundário rápido/gratuito configurado no BYOK.
2. **Camada B — The Vault (`vaultFisher.js` & `stateParser.js`):**
   * Banco de fatos imutáveis com `#tags` (ex.: `#Local`, `#NPC_Humor`, `#Segredo`). O Pescador RAG injeta apenas as **4 a 6 caixas mais relevantes** por turno.
3. **Camada C — Buffer Recente:**
   * Mantém os últimos **8 turnos inteiros** (4 pares de fala) na janela ativa.

---

## 5. Estrutura de Dados no Firestore (Isolada por Usuário)

* `airpg_users/{uid}`: Documento principal com `byokSettings`, `userPersona` e `dungeonPaperSheet`.
* `airpg_users/{uid}/characters/{id}`: Coleção de bots de Conversa Livre.
* `airpg_users/{uid}/campaigns/{id}`: Coleção de Campanhas RPG (com ficha e estado próprio).
* `airpg_users/{uid}/chats/{id}`: Histórico de mensagens, `vault` e `chronicle` de cada sessão.

---

## 6. Estado Atual de Implementação

* **Concluído:** Login Google (`LoginScreen.jsx`), isolamento de dados por `uid` no Firestore (`airpg_users/{uid}`), sincronização automática de BYOK, User Persona, Ficha Dungeon Paper, perfis e chats.
* **Próxima Etapa (Em Execução):**
  1. Separar `firebase.js` e `useProfiles.js` em duas coleções distintas: `characters` (Conversa Livre) e `campaigns` (RPG Hardcore PbtA).
  2. Criar `chatPromptBuilder.js` e `rpgPromptBuilder.js` com suporte ao toggle `godMode` (padrão `false` = Realista / Anti-bajulação).
  3. Atualizar Feed (com abas **Personagens** e **Campanhas RPG**) e Chat (interface específica por tipo + Cronista automático acima de 12 turnos).