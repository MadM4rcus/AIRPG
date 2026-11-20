# AIRPG — Two-World Character Chat & Hardcore PbtA Engine

Plataforma pessoal e colaborativa para roleplay imersivo e simulação de RPG de mesa autônomo. Separa completamente a experiência de **Conversa Livre com Personagens** (estilo SpicyChat / narrativa irrestrita com agência própria dos NPCs) da experiência de **Campanhas RPG Hardcore** (motor determinístico PbtA / Dungeon World onde os dados `2d6` são os juízes), sustentadas por **Memória Econômica em 3 Camadas**, **Multi-Provider BYOK** e **Login Google (Gmail)** isolado por usuário.

- **App em Produção:** [https://madrpg.web.app](https://madrpg.web.app)

---

## 📜 Manifesto Técnico

1. **Dois Mundos Completamente Separados (Sem Mistura de Modos):**
   - **Personagens — Conversa Livre & Narrativa (`type: 'chat'`):** Biblioteca e coleção própria (`airpg_users/{uid}/characters`). Interface limpa, sem ficha de RPG, sem HP e sem rolagem de dados; gaveta lateral dedicada a **The Vault** e **The Chronicle**. Foco em diálogo, tensão dramática, romance/NSFW irrestrito e **vontade própria dos NPCs**.
   - **Campanhas RPG — Mestre PbtA / Dungeon World (`type: 'rpg'`):** Biblioteca e coleção própria (`airpg_users/{uid}/campaigns`) com ficha Dungeon Paper vinculada. Barra superior com **HP**, acesso rápido à **Ficha** e botão de rolagem **`2d6` (Movimentos PbtA)**. O Mestre conduz o mundo com rigor e os dados decidem o desfecho.

2. **Interruptor "Modo Deus" (`God Mode` — Único Botão em Comum):**
   - Combate o viés de bajulação (*sycophancy*) das IAs.
   - **Realista (`godMode = false` — Padrão):** No RPG, os dados `2d6`, atributos, nível e equipamento são a lei — declarações impossíveis falham de forma verossímil. Nos Personagens, os NPCs mantêm personalidade, orgulho, limites e ritmo emocional próprios, exigindo conquista e coerência.
   - **Modo Deus (`godMode = true`):** Libera fantasia de poder / sandbox livre onde as declarações do jogador são aceitas como verdade absoluta.

3. **Autenticação Google & Multi-Provider BYOK (Zero Custo / Tier Gratuito):**
   - Login obrigatório via **Google (Gmail)** antes do acesso à interface, isolando chaves, personas, personagens, campanhas, fichas e chats em `airpg_users/{uid}`.
   - Suporte a **OpenRouter** (modelos `:free` sem censura/roleplay), **Groq** (Llama/Mixtral ultra-rápido) e **Google AI Studio** (Gemini Flash/Pro gratuito), com possibilidade de definir um modelo rápido dedicado para o Cronista.

4. **Memória Econômica em 3 Camadas (Token-Saver):**
   - **Tier A — The Chronicle:** Resumo evolutivo automático disparado quando o chat ultrapassa 12 mensagens, compactando turnos antigos em 1–2 parágrafos densos.
   - **Tier B — The Vault:** Caixas de fatos imutáveis com `#tags` injetadas no prompt apenas quando acionadas na cena (4 a 6 caixas por turno).
   - **Tier C — Active Buffer:** Os últimos 8 turnos inteiros (4 pares de fala) para continuidade imediata sem desperdício de tokens.

5. **Protocolo de Mutação Silenciosa (`<state_update>`) & Sanguessuga:**
   - Metadados ocultos em `<state_update>` atualizam o Vault silenciosamente ao final de cada turno.
   - Importação rápida de bots via **Character Cards V2 (JSON)**, **Bookmarklet** ou **Colar Bruto**, além do **Arquiteto de Mundos** assistido por IA para gerar campanhas RPG completas.

---

## 🛠️ Stack & Infraestrutura

- **Frontend:** React 18 + Vite (JavaScript/JSX) + Tailwind CSS v3 + `lucide-react`
- **Hospedagem & Backend:** Firebase Hosting (`https://madrpg.web.app`, projeto `mad-pjct`), Firebase Auth (`GoogleAuthProvider`) e Cloud Firestore (`airpg_users/{uid}/...`).

---

## 🗺️ Roadmap Vertical

Legenda: **[x] implementado** · **[~] parcial** · **[ ] pendente**.

- [x] **Passo 1: Fundação, BYOK e Interface**
  - App Vite/React, configuração de modelos/chaves e interface responsiva.
- [x] **Passo 2: Inferência e `<state_update>`**
  - Serviço para OpenRouter, Groq e Gemini; parser que separa prosa e mutações de memória.
- [x] **Passo 3: Autenticação Google (Gmail) & Sincronização Cloud por Usuário**
  - Tela de login obrigatória (`LoginScreen.jsx`), isolamento completo em `airpg_users/{uid}`, sincronização automática de chaves BYOK, User Persona, perfis, ficha Dungeon Paper e histórico de chats entre dispositivos.
- [ ] **Passo 4: Separação Completa dos Dois Mundos (Personagens vs. Campanhas RPG)**
  - Coleções separadas (`characters` vs. `campaigns`), abas dedicadas no Feed, remoção da alternância de modo dentro do chat e ficha vinculada por campanha.
- [ ] **Passo 5: Interruptor Realista vs. Modo Deus (`godMode`)**
  - Motores de prompt separados (`chatPromptBuilder.js` e `rpgPromptBuilder.js`) com regras rígidas anti-bajulação e toggle no topo do chat.
- [ ] **Passo 6: Memória Econômica Automática & BYOK Multi-Agente**
  - Disparo automático do Cronista acima de 12 mensagens, buffer otimizado de 8 turnos e seletor opcional de modelo secundário rápido/gratuito para compactação.

---

## 💡 Ideias e decisões em acompanhamento

- **Aprovado:** manter `IAgent.md` como guia arquitetural para agentes e este `README.md` como roadmap legível.
- **Aprovado:** separar totalmente **Personagens (Conversa Livre)** e **Campanhas RPG (PbtA)** em coleções, abas e prompts distintos, mantendo apenas o toggle **Realista / Modo Deus** em comum.
- **Aprovado:** priorizar economia máxima de tokens e requisições para rodar confortavelmente em tiers gratuitos (OpenRouter `:free`, Groq e Gemini).