# AIRPG — Two-World Freeroam Chat & Hardcore PbtA Engine

Plataforma pessoal e colaborativa para roleplay narrativo imersivo e simulação de RPG de mesa autônomo[cite: 6]. Separa completamente a experiência de **Conversas Livres / Freeroam** (mundos vivos com múltiplos NPCs, locais e agência própria) da experiência de **Campanhas RPG Hardcore** (motor determinístico PbtA / Dungeon World onde os dados `2d6` são os juízes)[cite: 6], sustentadas por **Biblioteca Compartilhada (Codex)**, **Biblioteca de Personas**, **Memória Econômica em 3 Camadas**, **Multi-Provider BYOK** e **Login Google (Gmail)** isolado por usuário[cite: 6].

- **App em Produção:** [https://madrpg.web.app](https://madrpg.web.app)[cite: 6]

---

## 📜 Manifesto Técnico

1. **Dois Mundos Completamente Separados (Sem Mistura de Modos):**[cite: 6]
   - **Conversas Livres / Freeroam (`type: 'chat'`):** Coleção própria (`airpg_users/{uid}/characters`)[cite: 6]. Interface limpa, sem ficha de RPG, sem HP e sem rolagem de dados; gaveta lateral dedicada a **The Vault** e **The Chronicle**[cite: 6]. Foco em diálogo, tensão dramática, múltiplos NPCs e **vontade própria dos personagens**[cite: 6].
   - **Campanhas RPG — Mestre PbtA / Dungeon World (`type: 'rpg'`):** Coleção própria (`airpg_users/{uid}/campaigns`) com ficha Dungeon Paper vinculada[cite: 6]. Barra superior com **PV (`HP`)**, acesso rápido à **Ficha** e botão de rolagem **`2d6` (Movimentos PbtA)**[cite: 6]. O Mestre conduz o mundo com rigor e os dados decidem o desfecho[cite: 6].

2. **Biblioteca Compartilhada (`Codex`), Biblioteca de Personas & Sanguessuga Destilador:**
   - **Codex Global:** Cadastre **NPCs**, **Locais** e **Regras de Mundo** curtos (1–2 frases) uma única vez e reutilize-os em qualquer Conversa Livre ou Campanha RPG[cite: 6]. O Pescador RAG injeta apenas os itens fixados ou citados na cena[cite: 6].
   - **Biblioteca de Personas:** Crie múltiplos personagens seus (nome, avatar e descrição) e alterne entre eles com um clique no cabeçalho do Feed ou diretamente dentro de uma sessão de chat.
   - **Sanguessuga Destilador:** Cole o texto bruto de qualquer página ou bot da web e deixe a IA limpar o ruído, criar a sessão e extrair automaticamente todos os NPCs, Locais e Regras de Mundo para a sua Biblioteca[cite: 6].

3. **Interruptor "Modo Deus" (`God Mode` — Único Botão em Comum):**[cite: 6]
   - Combate o viés de bajulação (*sycophancy*) das IAs[cite: 6].
   - **Realista (`godMode = false` — Padrão):** No RPG, os dados `2d6`, atributos, nível e equipamento são a lei — declarações impossíveis falham de forma verossímil[cite: 6]. Nas Conversas Livres, os NPCs mantêm personalidade, orgulho, limites e ritmo emocional próprios, exigindo conquista e coerência[cite: 6].
   - **Modo Deus (`godMode = true`):** Libera fantasia de poder / sandbox livre onde as declarações do jogador são aceitas como verdade absoluta[cite: 6].

4. **Autenticação Google & Multi-Provider BYOK (Zero Custo / Tier Gratuito):**[cite: 6]
   - Login obrigatório via **Google (Gmail)** antes do acesso à interface, isolando chaves, personas, conversas, campanhas, biblioteca, fichas e chats em `airpg_users/{uid}`[cite: 6].
   - Suporte a **OpenRouter** (modelos `:free`), **Groq** (Qwen 3 / Llama / GPT-OSS ultra-rápidos) e **Google AI Studio** (Gemini Flash gratuito), com tutorial passo a passo integrado na tela de configuração e opção de **Agente Cronista Secundário** para resumir memórias sem gastar a cota do modelo principal[cite: 6].

5. **Memória Econômica em 3 Camadas & Firestore Spark-Safe:**
   - **Tier A — The Chronicle:** Resumo evolutivo automático disparado quando o chat ultrapassa 12 mensagens, compactando turnos antigos em 1–2 parágrafos densos[cite: 6].
   - **Tier B — The Vault & Codex:** Caixas de fatos dinâmicos com `#tags` somadas às entidades da Biblioteca Compartilhada injetadas sob demanda na cena[cite: 6].
   - **Tier C — Active Buffer:** Os últimos 8 turnos inteiros (4 pares de fala) para continuidade imediata sem desperdício de tokens[cite: 6].
   - **Economia de Escritas (Firestore Spark):** Gravação consolidada de apenas **1 escrita por turno** no chat e *debounce* de 2 segundos nos ajustes de HP/atributos da ficha, permitindo compartilhar o banco gratuito entre pequenos grupos sem estourar a cota diária.

---

## 🛠️ Stack & Infraestrutura

- **Frontend:** React 18 + Vite (JavaScript/JSX) + Tailwind CSS v3 + `lucide-react`[cite: 6]
- **Hospedagem & Backend:** Firebase Hosting (`https://madrpg.web.app`, projeto `mad-pjct`), Firebase Auth (`GoogleAuthProvider`) e Cloud Firestore (`airpg_users/{uid}/...`, plano Spark)[cite: 6].

---

## 🗺️ Roadmap Vertical

Legenda: **[x] implementado** · **[~] parcial** · **[ ] pendente**[cite: 6].

- [x] **Passo 1: Fundação, BYOK e Interface**[cite: 6]
  - App Vite/React, configuração de modelos/chaves com guia integrado e interface responsiva[cite: 6].
- [x] **Passo 2: Inferência e `<state_update>`**[cite: 6]
  - Serviço para OpenRouter, Groq e Gemini; parser que separa prosa e mutações de memória[cite: 6].
- [x] **Passo 3: Autenticação Google (Gmail) & Sincronização Cloud por Usuário**[cite: 6]
  - Tela de login obrigatória (`LoginScreen.jsx`), isolamento completo em `airpg_users/{uid}`, sincronização automática de chaves BYOK, Biblioteca de Personas, perfis, ficha Dungeon Paper e histórico de chats entre dispositivos[cite: 6].
- [x] **Passo 4: Separação Completa dos Dois Mundos (Conversas Livres vs. Campanhas RPG)**[cite: 6]
  - Coleções separadas (`characters` vs. `campaigns`), abas dedicadas no Feed, interface específica por modo e ficha vinculada nas campanhas[cite: 6].
- [x] **Passo 5: Biblioteca Compartilhada (`Codex`), Biblioteca de Personas & Sanguessuga Destilador**
  - Repositório reutilizável de NPCs, Locais e Regras de Mundo (`useCodex.js`, `CodexModal.jsx`), gerenciador de múltiplas personas do jogador (`PersonaLibraryModal.jsx`) e extração inteligente via IA (`sanguessugaExtractor.js`)[cite: 6].
- [x] **Passo 6: Interruptor Realista vs. Modo Deus (`godMode`), Memória Econômica & Firestore Spark-Safe**
  - Motores de prompt dedicados (`chatPromptBuilder.js` e `rpgPromptBuilder.js`), disparo automático do Cronista acima de 12 mensagens, buffer de 8 turnos, gravação consolidada de 1 escrita por turno no Firestore e debounce na ficha[cite: 6].

---

## 💡 Ideias e decisões em acompanhamento

- **Concluído:** `IAgent.md` alinhado como guia arquitetural para agentes e `README.md` como documentação geral[cite: 6].
- **Concluído:** arquitetura de dois mundos separados, Biblioteca Compartilhada (`Codex`), Biblioteca de Personas, Sanguessuga Destilador, BYOK com guia integrado e otimização de escritas para operação multiusuário no plano Spark do Firestore[cite: 6].