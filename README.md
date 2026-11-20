# AIRPG — Dual-Mode Character Chat & Hardcore RAG-RPG Engine

Plataforma pessoal e colaborativa para roleplay imersivo e simulação de RPG de mesa autônomo. Combina a liberdade narrativa de chats baseados em perfis/personas (estilo SpicyChat / Freeroam) com um motor determinístico de tolerância zero para campanhas RPG hardcore, sustentado por **Memória Híbrida em 3 Camadas** e **Multi-Provider BYOK** (foco em modelos gratuitos/baratos).

- **App em Produção:** [https://madrpg.web.app](https://madrpg.web.app)

---

## 📜 Manifesto Técnico

1. **Arquitetura Dual-Mode (Freeroam vs. Hardcore RPG):**
   - **Modo Freeroam / Character Chat:** Foco total em diálogo, personalidade, cenário e dinâmica relacional. Sem rolagens de dado ou blocos numéricos visíveis; o motor de memória atua silenciosamente em segundo plano para manter consistência de fatos, roupas, segredos e estado emocional.
   - **Modo RPG Hardcore (O Código é o Juiz):** Ativa ficha de personagem, escassez de recursos e resolução mecânica determinística no JavaScript (dados, atributos, CDs). A IA atua estritamente como narradora neutra e nunca suaviza falhas críticas.
   - **Alternância Dinâmica:** Uma sessão pode iniciar em modo Freeroam e ativar o modo RPG a qualquer momento caso a narrativa exija combate, exploração ou sobrevivência.

2. **Multi-Provider BYOK (Zero Custo / Tier Gratuito):**
   - Suporte nativo a chaves trazidas pelo usuário (*Bring Your Own Key*) em provedores compatíveis com padrão OpenAI/REST: **OpenRouter** (modelos `:free` sem censura/roleplay), **Groq** (Llama/Mixtral ultra-rápido) e **Google AI Studio** (Gemini Flash/Pro gratuito).
   - Configuração granular: cada Perfil/Bot pode ter um provedor e modelo preferido vinculado.

3. **Memória Híbrida em 3 Camadas (RAG + Janela Deslizante):**
   - **Tier A — The Chronicle (Macro-Linha do Tempo):** Resumos históricos comprimidos preservando a cronologia da história.
   - **Tier B — The Vault (Caixas de Lore com Tags Dinâmicas):** Entidades estruturadas em JSON (NPCs, locais, regras do mundo, fatos relacionais) injetadas no prompt *apenas* quando palavras-chave são acionadas na cena. Verdade imutável.
   - **Tier C — Active Buffer (Micro-Janela):** Os últimos 5 a 10 turnos brutos para fluidez imediata da conversa.

4. **Protocolo de Mutação Silenciosa (`<state_update>`):**
   - Ao final de cada turno, a IA retorna metadados ocultos em `<state_update>` para atualizar atributos (no modo RPG) ou criar/atualizar caixas de memória no Vault (em ambos os modos). O parser intercepta o bloco antes de renderizar a prosa na tela.

5. **Mecanismo "Sanguessuga" (Importador de Tropes & Character Cards):**
   - Importação rápida de bots encontrados na web via **Character Cards V2 (JSON/PNG)**, **Bookmarklet de extração direta do navegador** ou **Colar Bruto + Estruturação Assistida por IA**.

---

## 🛠️ Stack & Infraestrutura

- **Frontend:** React + Vite (JavaScript/JSX) + Tailwind CSS
- **Hospedagem:** Firebase Hosting (`https://madrpg.web.app`, projeto `mad-pjct`, site `madrpg`).
- **Persistência local:** `localStorage` para configurações BYOK, perfis, persona, ficha e dados de conversa/memória.
- **Firebase:** autenticação anônima e Firestore com coleções isoladas `airpg_profiles` e `airpg_chats`; gravação cloud ativa, restando integrar a restauração/sincronização completa entre dispositivos. Personas ficam locais; Firebase Storage para avatares ainda não está implementado.

---

## 🗺️ Roadmap Vertical (Do Zero ao MVP Jogável)

Legenda: **[x] implementado no código** · **[~] parcial** · **[ ] pendente**.

- [x] **Passo 1: Fundação, BYOK e interface**
  - App Vite/React, configuração de modelos/chaves no `localStorage` e interface com perfis, chat e painéis contextuais.
- [x] **Passo 2: Inferência e `<state_update>`**
  - Serviço para OpenRouter, Groq e Gemini; prompts Freeroam/Hardcore; parser que separa narrativa e mutações.
- [~] **Passo 3: Perfis, User Persona e Sanguessuga**
  - Perfis/persona, importação de Character Card JSON e texto, além de bookmarklet implementados.
  - PNG ainda não é suportado; persistência cloud da persona também pendente.
- [x] **Passo 4: Memória — The Vault e The Chronicle**
  - Seleção de lore por tags/contexto, aplicação de `vault_updates` e compressão de mensagens antigas em crônica integradas ao app.
- [x] **Passo 5: RPG Hardcore**
  - Ficha de Dungeon World e resolução determinística PbtA (2d6 + atributo); não é um sistema d20/d100.
- [~] **Passo 6: Firebase e sincronização**
  - Projeto `mad-pjct` configurado, Auth anônima ativa, regras Firestore publicadas (`airpg_profiles`/`airpg_chats`), gravação cloud conectada e app publicado em `https://madrpg.web.app`.
  - Pendente: restaurar dados cloud automaticamente no app, completar estratégia de sincronização entre dispositivos e adicionar Storage para avatares.

## 💡 Ideias e decisões em acompanhamento

- **Confirmado:** manter `IAgent.md` como guia compacto para agentes e log de cada mudança; este README é o roadmap e registro legível para pessoas.
- **Confirmado:** publicar o app sob o domínio `https://madrpg.web.app` (site `madrpg` dentro do projeto `mad-pjct`) com coleções isoladas no Firestore.
- Novas propostas discutidas devem entrar aqui com estado **proposta**, **em discussão**, **aprovada** ou **descartada**; atualizar os passos afetados quando houver decisão ou correção.