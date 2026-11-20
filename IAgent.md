# IAgent.md — Contexto Mestre & Diretrizes Arquiteturais do Projeto AIRPG

Este documento contém o conhecimento arquitetural, as regras de negócio e o estado atual do projeto **AIRPG** (`https://madrpg.web.app`). Leia-o integralmente antes de propor alterações de código.

---

## 1. Visão Geral & Stack Tecnológica

O **AIRPG** é uma plataforma Web/Mobile-First de Roleplay Narrativo e RPG de Mesa com IA, baseada em **BYOK (Bring Your Own Key)** e **Autenticação Google (Gmail)** obrigatória antes do acesso à interface[cite: 2].

* **Frontend:** React 18 + Vite + Tailwind CSS v3 + `lucide-react`[cite: 2]
* **Infraestrutura & Banco de Dados:** Firebase Hosting (`madrpg.web.app`), Firebase Auth (`GoogleAuthProvider`) e Cloud Firestore (`mad-pjct`)[cite: 2]
* **Provedores LLM Suportados:** OpenRouter (`:free` e pagos), Groq e Google Gemini[cite: 2].
* **Foco de Custo:** Máxima economia de tokens e requisições (ideal para tiers gratuitos), mantendo coerência de memória em 3 camadas[cite: 2].

---

## 2. Arquitetura de Dois Mundos Separados (Sem Mistura de Modos)

O aplicativo é dividido em **duas experiências e coleções completamente independentes**, sem botão de alternância de modo dentro de um mesmo chat[cite: 2]:

### A. Conversas Livres / Freeroam Narrativo (`type: 'chat'`)
* **Onde fica:** Aba **Conversas Livres** no Feed + coleção isolada `airpg_users/{uid}/characters`[cite: 2].
* **Interface:** Limpa, sem ficha de RPG, sem HP e sem botões de rolagem de dados[cite: 2]. Gaveta lateral focada em **The Vault** e **The Chronicle**[cite: 2].
* **Motor (`chatPromptBuilder.js`):** Suporta cenários freeroam vivos com múltiplos NPCs, locais e regras de mundo puxados do **Codex**, com foco em diálogo, tensão dramática e **agência própria dos NPCs**[cite: 2].

### B. Campanhas RPG — Mestre PbtA / Dungeon World (`type: 'rpg'`)
* **Onde fica:** Aba **Campanhas RPG** no Feed + coleção isolada `airpg_users/{uid}/campaigns` (com ficha Dungeon Paper vinculada)[cite: 2].
* **Interface:** Barra superior com **PV (`HP`)**, acesso rápido à **Ficha Dungeon Paper** e botão de rolagem **`2d6` (Movimentos PbtA)** ao lado do campo de texto[cite: 2].
* **Motor (`rpgPromptBuilder.js`):** Compartilha a Biblioteca de NPCs, Locais e Regras de Mundo, mas impõe a ficha e os **dados `2d6` como juízes absolutos**[cite: 2].

---

## 3. Biblioteca Compartilhada (`Codex`) & Sanguessuga Destilador

* **Codex Global (`airpg_users/{uid}/codex` + `CodexModal.jsx`):** Repositório reutilizável entre Conversas Livres e Campanhas RPG para entidades enxutas (1–2 frases) divididas em **NPC**, **LOCAL** e **MUNDO** (Regras de Lore). Itens podem ser fixados (`pinnedCodexIds`) numa sessão ou pescados automaticamente pelo nome/`#tag`.
* **Sanguessuga Destilador (`sanguessugaExtractor.js` + `SanguessugaModal.jsx`):** Agente extrator que lê textos brutos copiados de outras plataformas, limpa lixo de interface e destila automaticamente a cena principal junto com os NPCs, Locais e Regras de Mundo direto para o Codex.

---

## 4. Interruptor "Modo Deus" (God Mode — Único Botão em Comum)

Para combater o **viés de bajulação (sycophancy)** das IAs, ambos os tipos de chat compartilham um interruptor no topo: **Realista (God Mode OFF — Padrão)** vs. **Modo Deus (God Mode ON)**[cite: 2].

* **Realista (`godMode = false` — Padrão):**
  * **Nas Conversas Livres:** NPCs têm vontade própria, orgulho, limites, gostos e ritmo emocional[cite: 2]. Não cedem instantaneamente a exageros ou avanços forçados do jogador; exigem conquista, coerência e contexto[cite: 2].
  * **No RPG:** Os dados `2d6`, os atributos, o nível e o equipamento da ficha são a lei[cite: 2]. Tentativas impossíveis declaradas sem rolagem ou acima da capacidade do personagem falham de forma verossímil[cite: 2].
* **Modo Deus (`godMode = true`):**
  * Libera fantasia de poder / sandbox livre, onde as declarações do jogador são aceitas como verdade absoluta na cena[cite: 2].

---

## 5. Memória Econômica em 3 Camadas (Token-Saver)

1. **Camada A — The Chronicle (`chronicleCompressor.js`):**
   * Roda automaticamente quando o chat passa de **12 mensagens**, compactando as mensagens mais antigas em um resumo factual contínuo e limpando-as do buffer ativo[cite: 2]. Suporta um **Agente Cronista Secundário** rápido/gratuito configurado no BYOK (`useBYOK.js`).
2. **Camada B — The Vault & Codex (`vaultFisher.js` & `stateParser.js`):**
   * Banco de fatos dinâmicos da sessão (`vault`) somado à Biblioteca Compartilhada (`codex`). O Pescador RAG injeta os fatos relevantes e todos os itens do Codex fixados ou citados na cena (teto seguro de 15 itens).
3. **Camada C — Buffer Recente:**
   * Mantém os últimos **8 turnos inteiros** (4 pares de fala) na janela ativa[cite: 2].

---

## 6. Estrutura de Dados no Firestore (Isolada por Usuário)

* `airpg_users/{uid}`: Documento principal com `byokSettings`, `userPersona` e `dungeonPaperSheet`[cite: 2].
* `airpg_users/{uid}/characters/{id}`: Coleção de sessões de Conversa Livre / Freeroam[cite: 2].
* `airpg_users/{uid}/campaigns/{id}`: Coleção de Campanhas RPG[cite: 2].
* `airpg_users/{uid}/codex/{id}`: Biblioteca Compartilhada de NPCs, Locais e Regras de Mundo.
* `airpg_users/{uid}/chats/{id}`: Histórico de mensagens, `vault` e `chronicle` de cada sessão[cite: 2].

---

## 7. Estado Atual de Implementação

* **Concluído (Arquitetura Completa em Produção):**
  * Autenticação Google (`LoginScreen.jsx`) e isolamento total por `uid` no Firestore (`firebase.js`).
  * Separação completa entre Conversas Livres (`characters` + `chatPromptBuilder.js`) e Campanhas RPG (`campaigns` + `rpgPromptBuilder.js`).
  * Biblioteca Compartilhada (`useCodex.js`, `CodexModal.jsx`) e Pescador RAG sem cortes artificiais (`vaultFisher.js`).
  * Sanguessuga Destilador com extração assistida por IA (`sanguessugaExtractor.js`, `SanguessugaModal.jsx`).
  * Toggle Realista vs. Modo Deus (`godMode`), BYOK com Cronista Secundário (`useBYOK.js`, `BYOKModal.jsx`) e disparo automático do Cronista acima de 12 mensagens (`App.jsx`).