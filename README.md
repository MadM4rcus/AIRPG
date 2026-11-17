# AIRPG — Dual-Mode Character Chat & Hardcore RAG-RPG Engine

Plataforma pessoal e colaborativa para roleplay imersivo e simulação de RPG de mesa autônomo. Combina a liberdade narrativa de chats baseados em perfis/personas (estilo SpicyChat / Freeroam) com um motor determinístico de tolerância zero para campanhas RPG hardcore, sustentado por **Memória Híbrida em 3 Camadas** e **Multi-Provider BYOK** (foco em modelos gratuitos/baratos).

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
- **Backend / Persistência:** Firebase (reaproveitando o projeto `storycraft-a5f7c` com coleções isoladas sob o prefixo `airpg_`)
  - `airpg_profiles`: Galeria de bots/cenários criados ou importados.
  - `airpg_personas`: Perfis de jogador (User Personas).
  - `airpg_chats`: Sessões ativas (modo, mensagens recentes, Chronicle e Vault).

---

## 🗺️ Roadmap Vertical (Do Zero ao MVP Jogável)

- [ ] **Passo 1: Fundação, Multi-Provider BYOK e Casca da Interface**
  - Inicialização do projeto Vite + React + Tailwind dentro de `AIRPG/`.
  - Modal de configuração de Chaves API (`OpenRouter`, `Groq`, `Google Gemini`) salvas no `localStorage` + seletor de modelo ativo.
  - Layout base estilo app de roleplay: Sidebar de Perfis/Chats, Área Central de Narrativa e Painel Direito contextual (Ficha/Vault).
- [ ] **Passo 2: Motor de Inferência Multi-Provider & Parser `<state_update>`**
  - Serviço unificado (`llmService.js`) capaz de conversar com OpenRouter, Groq e Gemini usando a mesma interface.
  - Construtor dinâmico de System Prompt (alternando entre diretriz *Freeroam* e *RPG Hardcore*).
  - Interceptor de resposta para separar texto narrativo e mutações JSON ocultas.
- [ ] **Passo 3: Galeria de Perfis, User Personas & Mecanismo Sanguessuga**
  - CRUD de Perfis (Nome, Avatar, Personalidade, Cenário, First Message, Exemplos de Diálogo) e User Personas.
  - Módulo Sanguessuga: importador de arquivos JSON/PNG (Character Card V2), gerador de Bookmarklet para captura rápida em sites externos e conversor de texto bruto via IA.
- [ ] **Passo 4: Sistema de Memória — The Vault (Pescador de Tags)**
  - Implementação do extrator de palavras-chave do turno atual para injetar apenas as Caixas de Lore relevantes no contexto.
  - Aplicação automática das `memory_mutations` retornadas pela IA.
- [ ] **Passo 5: Motor Determinístico (Modo RPG Hardcore)**
  - Sistema de rolagens (`d20`/`d100`), atributos e cálculo de CD antes do envio do prompt, injetando o resultado mecânico imutável para a IA narrar.
- [ ] **Passo 6: Integração Firebase (`storycraft-a5f7c`) & The Chronicle**
  - Plug-in da camada Firebase (Auth + Firestore `airpg_*` + Storage para avatares) reaproveitando a configuração base do `@Storycraft`.
  - Rotina de compressão recursiva de turnos antigos para o *Chronicle*.