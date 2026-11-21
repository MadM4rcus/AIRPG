# AIRPG — Two-World Freeroam Chat & Hardcore PbtA Engine

Plataforma pessoal e colaborativa para roleplay narrativo imersivo e simulação de RPG de mesa autônomo. Separa completamente a experiência de **Conversas Livres / Freeroam** (mundos vivos com múltiplos NPCs, locais e agência própria) da experiência de **Campanhas RPG Hardcore** (motor determinístico PbtA / Dungeon World onde os dados `2d6` são os juízes), sustentadas por **Biblioteca Compartilhada (Codex)**, **Biblioteca de Personas**, **Memória Econômica em 3 Camadas**, **Multi-Provider BYOK** e **Login Google (Gmail)** isolado por usuário.

- **App em Produção:** [https://madrpg.web.app](https://madrpg.web.app)

---

## 📜 Manifesto Técnico

1. **Dois Mundos Completamente Separados (Sem Mistura de Modos):**
   - **Conversas Livres / Freeroam (`type: 'chat'`):** Coleção própria (`airpg_users/{uid}/characters`). Interface limpa, sem ficha de RPG, sem HP e sem rolagem de dados; gaveta lateral dedicada a **The Vault** e **The Chronicle**. Foco em diálogo, tensão dramática, múltiplos NPCs e **vontade própria dos personagens**.
   - **Campanhas RPG — Mestre PbtA / Dungeon World (`type: 'rpg'`):** Coleção própria (`airpg_users/{uid}/campaigns`) com ficha Dungeon Paper vinculada. Barra superior com **PV (`HP`)**, acesso rápido à **Ficha** e botão de rolagem **`2d6` (Movimentos PbtA)**. O Mestre conduz o mundo com rigor e os dados decidem o desfecho.

2. **Biblioteca Compartilhada (`Codex`), Biblioteca de Personas & Arquiteto de Mundos:**
   - **Codex Global:** Cadastre **NPCs**, **Locais** e **Regras de Mundo** curtos (1–2 frases) uma única vez e reutilize-os em qualquer Conversa Livre ou Campanha RPG. O Pescador RAG injeta apenas os itens fixados ou citados na cena.
   - **Biblioteca de Personas:** Crie múltiplos personagens seus (nome, avatar e descrição) e alterne entre eles com um clique no cabeçalho do Feed ou diretamente dentro de uma sessão de chat.
   - **Arquiteto de Mundos:** Workspace local de rascunho em três etapas. O copiloto cria mundos do zero, extrai dados de textos brutos colados ou aplica alterações preservando conteúdo não solicitado; publicar cria a sessão, os itens novos do Codex e o histórico inicial em lote no Firestore.

3. **Interruptor "Modo Deus" (`God Mode` — Único Botão em Comum):**
   - Combate o viés de bajulação (*sycophancy*) das IAs.
   - **Realista (`godMode = false` — Padrão):** No RPG, os dados `2d6`, atributos, nível e equipamento são a lei — declarações impossíveis falham de forma verossímil. Nas Conversas Livres, os NPCs mantêm personalidade, orgulho, limites e ritmo emocional próprios, exigindo conquista e coerência.
   - **Modo Deus (`godMode = true`):** Libera fantasia de poder / sandbox livre onde as declarações do jogador são aceitas como verdade absoluta.

4. **Autenticação Google & Multi-Provider BYOK (Zero Custo / Tier Gratuito):**
   - Login obrigatório via **Google (Gmail)** antes do acesso à interface, isolando chaves, personas, conversas, campanhas, biblioteca, fichas e chats em `airpg_users/{uid}`.
   - Suporte a **OpenRouter** (modelos `:free`), **Groq** (Qwen 3 / Llama / GPT-OSS ultra-rápidos) e **Google AI Studio** (Gemini Flash gratuito), com tutorial passo a passo integrado na tela de configuração e opção de **Agente Cronista Secundário** para resumir memórias sem gastar a cota do modelo principal.

5. **Memória Econômica em 3 Camadas & Firestore Spark-Safe:**
   - **Tier A — The Chronicle:** Resumo evolutivo automático disparado quando o chat ultrapassa 12 mensagens, compactando turnos antigos em 1–2 parágrafos densos.
   - **Tier B — The Vault & Codex:** Caixas de fatos dinâmicos com `#tags` somadas às entidades da Biblioteca Compartilhada injetadas sob demanda na cena.
   - **Tier C — Active Buffer:** Os últimos 8 turnos inteiros (4 pares de fala) para continuidade imediata sem desperdício de tokens.
   - **Economia de Escritas (Firestore Spark):** Gravação consolidada de apenas **1 escrita por turno** no chat e *debounce* de 2 segundos nos ajustes de HP/atributos da ficha, permitindo compartilhar o banco gratuito entre pequenos grupos sem estourar a cota diária.

6. **Controle de Tamanho da Resposta:**
   - Slider por perfil com quatro níveis: **Curta**, **Média** (padrão), **Longa** e **Detalhada**.
   - A preferência é salva no `localStorage` e aplicada pelo construtor de prompt (`promptBuilder.js`), mantendo folgado o limite de tokens da API.

7. **Hospedagem de Imagens e GIFs & Lightbox Global:**
   - `imageUploadService.js` hospeda uploads no ImgBB; a chave opcional é configurada no modal BYOK. Imagens estáticas podem ser otimizadas via Canvas, enquanto GIFs ignoram Canvas para manter a animação.
   - `ImagePicker.jsx` oferece upload, importação de URL e colagem de imagem/link com foco mobile-first.
   - `ImageLightbox.jsx` é controlado globalmente pelo `App.jsx` e oferece navegação por swipe no celular. Avatares e imagens nas telas de Feed/Chat e nas bibliotecas de Personas/Codex podem ser ampliados; `BYOKModal.jsx` gerencia a chave ImgBB.

8. **Chat Multi-Personagem & Barra de Diretor de Cena:**
   - As respostas podem separar falas e ações de NPCs em bolhas individuais, com identificação de personagem e narração concisa.
   - A barra permite selecionar um NPC para protagonizar o próximo turno; tocar novamente nele dispara uma continuação silenciosa.

---

## 🛠️ Stack & Infraestrutura

- **Frontend:** React 19 + Vite 8 (JavaScript/JSX) + Tailwind CSS v4 + `lucide-react`
- **Hospedagem & Backend:** Firebase Hosting (`https://madrpg.web.app`, projeto `mad-pjct`), Firebase Auth (`GoogleAuthProvider`) e Cloud Firestore (`airpg_users/{uid}/...`, plano Spark).

---

## 🗺️ Roadmap Vertical

Legenda: **[x] implementado** · **[~] parcial** · **[ ] pendente**.

- [x] **Passo 1: Fundação, BYOK e Interface**
  - App Vite/React, configuração de modelos/chaves com guia integrado e interface responsiva.
- [x] **Passo 2: Inferência e `<state_update>`**
  - Serviço para OpenRouter, Groq e Gemini; parser que separa prosa e mutações de memória.
- [x] **Passo 3: Autenticação Google (Gmail) & Sincronização Cloud por Usuário**
  - Tela de login obrigatória (`LoginScreen.jsx`), isolamento completo em `airpg_users/{uid}`, sincronização automática de chaves BYOK, Biblioteca de Personas, perfis, ficha Dungeon Paper e histórico de chats entre dispositivos.
- [x] **Passo 4: Separação Completa dos Dois Mundos (Conversas Livres vs. Campanhas RPG)**
  - Coleções separadas (`characters` vs. `campaigns`), abas dedicadas no Feed, interface específica por modo e ficha vinculada nas campanhas.
- [x] **Passo 5: Biblioteca Compartilhada (`Codex`) & Biblioteca de Personas**
  - Repositório reutilizável de NPCs, Locais e Regras de Mundo (`useCodex.js`, `CodexModal.jsx`) e gerenciador de múltiplas personas do jogador (`PersonaLibraryModal.jsx`).
- [x] **Passo 6: Interruptor Realista vs. Modo Deus (`godMode`), Memória Econômica & Firestore Spark-Safe**
  - Motores de prompt dedicados (`chatPromptBuilder.js` e `rpgPromptBuilder.js`), disparo automático do Cronista acima de 12 mensagens, buffer de 8 turnos, gravação consolidada de 1 escrita por turno no Firestore e debounce na ficha.
- [x] **Passo 7: Controle de Tamanho da Resposta, Hospedagem ImgBB & Lightbox Global**
  - Preferência de extensão em quatro níveis aplicada ao prompt; upload de imagens/GIFs, preservação da animação, colagem mobile-first e visualização ampliada com swipe.
- [x] **Passo 8: Chat Multi-Personagem & Diretor de Cena**
  - Formatação identificada por personagem nos prompts, bolhas individuais no chat e seleção de NPC para conduzir o próximo turno.
- [x] **Passo 9: Vitrine em Pôsteres, Lobby do Mundo & Arquiteto de Mundos**
  - Pôsteres verticais mobile-first e Lobby com elenco vinculado; workspace de criação em três etapas com copiloto IA e publicação consolidada no Firestore.

---
