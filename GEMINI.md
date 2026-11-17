# Instruções do Projeto — AIRPG (Dual-Mode Roleplay & RAG-RPG Engine)

## 1. Regra de Ouro de Execução
- **NUNCA escreva, crie ou modifique arquivos sem antes me explicar o plano e pedir confirmação.**
- Antes de executar qualquer tarefa, apresente:
  1. Arquivos que serão criados ou alterados.
  2. Resumo direto da lógica aplicada.
  3. Comandos de terminal necessários.
- Aguarde minha aprovação explícita antes de aplicar diffs ou rodar comandos.

## 2. Estilo e Contexto do Workspace
- Comunicação direta, técnica e informal. Sem floreios.
- Estamos dentro da pasta `AIRPG/`. Ignore outras pastas irmãs em `/media/marcus/Husky/z app/` a menos que eu cite explicitamente com `@` (como `@Storycraft` para reaproveitar credenciais/serviços do Firebase `storycraft-a5f7c`).
- Todo dado gravado no Firestore/Storage do projeto `storycraft-a5f7c` deve usar obrigatoriamente o prefixo `airpg_` nas coleções e pastas para não colidir com o projeto legado.

## 3. Convenções de Arquitetura e Código
- **Stack:** React + Vite (JavaScript puro `.jsx`/`.js`, sem TypeScript) + Tailwind CSS + Firebase.
- **Isolamento de Responsabilidades:**
  - `src/components/` -> Componentes puros de UI (Chat, Cards de Perfil, Modal BYOK, Importador Sanguessuga, Ficha RPG).
  - `src/engine/` -> Lógica determinística (rolagens RPG, construtor de prompts Dual-Mode, parser de `<state_update>`, pescador de tags do Vault, parser de Character Cards).
  - `src/services/` -> Comunicação unificada com APIs LLM (OpenRouter, Groq, Gemini) e camada Firebase (`airpg_*`).
  - `src/hooks/` -> Gerenciamento de estado da sessão ativa e persistência.