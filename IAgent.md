# AIRPG — Guia e registro operacional para agentes de IA

## Leia primeiro / faça sempre
1. Leia este guia; use `README.md` para o roadmap e as decisões destinadas a pessoas.
2. Confira o código, os arquivos relevantes e `git status`; não presuma que documentação antiga descreve o estado atual.
3. Faça mudanças pequenas e relacionadas ao pedido; preserve trabalho preexistente. Não reverta alterações alheias.
4. Valide o que mudou. `package.json` oferece `npm run build`; não há script de testes ou lint configurado.
5. Após qualquer mudança no projeto, atualize este arquivo: corrija o inventário se necessário e acrescente uma linha ao log. Inclua também mudanças apenas documentais.
6. Atualize o roadmap do `README.md` quando status, ideia discutida ou decisão/correção do plano mudar. Diferencie propostas de decisões aprovadas; não transforme especulação em requisito.
7. Na resposta final, resuma alteração, validação e pendências; não declare o que não verificou.

## Dados pessoais e segredos — prioridade
- `zzznotes.md`, `zzznotes.*` e `zzznotes/` são anotações pessoais do proprietário: não ler, pesquisar, copiar, resumir ou divulgar seu conteúdo.
- Exceção: se o proprietário pedir explicitamente uma edição, altere apenas o trecho solicitado sem consultar nem reproduzir valores secretos existentes; não registre o conteúdo alterado no log.
- `.gitignore` já ignora esses caminhos. Nunca force sua inclusão (`git add -f`) nem os envie a serviços externos.
- `.env*` também é privado/ignorado. Não inclua seus valores em código, docs, logs, comandos ou respostas; consulte apenas nomes de variáveis quando necessário.

## Projeto e dependências
AIRPG é um app React/Vite de roleplay com BYOK, memória Vault/Chronicle, perfis e regras PbtA/Dungeon World. Código em JavaScript/JSX, sem TypeScript.

- Dependências de execução (`package.json`): `react`, `react-dom`, `firebase`, `lucide-react`.
- Desenvolvimento/build: `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`.
- `package-lock.json` fixa a árvore de dependências npm. Não editar manualmente; use npm ao mudar dependências.
- Scripts: `npm run dev` inicia Vite; `npm run build` compila; `npm run preview` serve o build. Não há scripts de teste/lint.

## Infraestrutura & Deploy (Produção)
- **URL Oficial:** `https://madrpg.web.app`
- **Projeto Firebase:** `mad-pjct` (site Hosting: `madrpg`; diretório público: `dist`)
- **Banco de Dados & Auth:** Firebase Anonymous Auth e Firestore com coleções isoladas `airpg_profiles` e `airpg_chats` protegidas por `request.auth.uid`.
- **Comando de publicação:** `npm run build && firebase deploy --only hosting`

## Inventário retrospectivo dos arquivos
Estado/função atual inspecionados em 2026-11-20. Isto é um mapa do conteúdo, não um histórico cronológico de cada edição; não invente autoria ou mudanças passadas.

### Raiz
- `.gitignore` — exclui dependências/build, arquivos locais de ambiente e notas pessoais (`zzznotes*`).
- `firebase.json` — configuração do Firebase Hosting apontando para o site `madrpg` e pasta `dist` (SPA rewrite para `/index.html`).
- `.firebaserc` — vínculo do diretório com o projeto Firebase `mad-pjct`.
- `package.json` — metadados, dependências e comandos npm.
- `package-lock.json` — versões resolvidas das dependências npm.
- `vite.config.js` — plugins React e Tailwind para Vite.
- `index.html` — documento inicial, metadados e ponto de montagem React.
- `README.md` — apresentação humana, manifesto, estado do roadmap e ideias/decisões.
- `IAgent.md` — este guia, inventário do código e log conciso para agentes.
- `GEMINI.md` — removido na cópia de trabalho atual; conteúdo não inspecionado. Não restaurar sem pedido.
- `.env` — configuração local do Firebase (`mad-pjct`); ignorada pelo Git. Nunca registrar valores.

### Aplicação e estilos (`src/`)
- `main.jsx` — cria a raiz React, importa o CSS e monta `App`.
- `App.jsx` — tela e estado centrais; integra chat, perfis, BYOK, prompt, memória (buffer de 10 turnos + Vault + Chronicle), ficha, modais, avatares URL/emoji e status de gravação cloud.
- `index.css` — importa Tailwind e define estilos base da interface.

### UI (`src/components/`)
- `BYOKModal.jsx` — configura provedor, modelo e chave de API.
- `DungeonPaperModal.jsx` — visualiza/edita ficha Dungeon World, vínculos e inventário; importa/exporta JSON validado.
- `PbtaRollModal.jsx` — seleciona movimento, rola 2d6 e confirma resultado para o chat.
- `SanguessugaModal.jsx` — cria/importa perfil, edita persona e oferece bookmarklet/Arquiteto de Mundos.
- `WorldArchitectChat.jsx` — conversa com LLM e instancia mundos a partir de blueprint.

### Lógica (`src/engine/`)
- `cardParser.js` — interpreta Character Cards JSON e texto colado; contém código do bookmarklet.
- `chronicleCompressor.js` — resume turnos antigos via LLM para atualizar a Chronicle.
- `dungeonWorldClasses.js` — catálogo de classes/playbooks, PV, carga e movimentos iniciais.
- `pbtaEngine.js` — movimentos PbtA e resolução determinística 2d6 + atributo.
- `promptBuilder.js` — monta instruções de modo, personagem, jogador, ficha, Vault e protocolo de mutação.
- `stateParser.js` — remove `<state_update>` da resposta e interpreta o JSON.
- `vaultFisher.js` — seleciona caixas de lore relevantes por tags/palavras da cena.
- `worldArchitectPrompt.js` — instruções e formato JSON do Arquiteto de Mundos.

### Estado e integrações
- `hooks/useBYOK.js` — modelos/provedores e configuração BYOK em `localStorage`.
- `hooks/useCharacterSheet.js` — ficha Dungeon World, regras de atributos e persistência local.
- `hooks/useProfiles.js` — perfis e persona padrão, CRUD, persistência local e gravação cloud de novos perfis.
- `services/llmService.js` — chamadas HTTP para OpenRouter, Groq e Gemini.
- `services/firebase.js` — configuração Firebase via variáveis de ambiente, Auth anônima e operações Firestore `airpg_profiles`/`airpg_chats`; gravação cloud ativa, restauração completa pendente.

`node_modules/` e `dist/` são artefatos/dependências gerados, ignorados e fora do inventário-fonte. Não inspecione nem documente arquivos pessoais ignorados.

## Regras de confiabilidade
- Não invente requisitos, status, resultados de validação ou comportamento não inspecionado.
- Atualize documentação relacionada e call sites dependentes; não faça correções fora do escopo.
- Mantenha erros relevantes visíveis; não introduza fallback silencioso.
- Evite dependências novas. Prefira testes focados para comportamento novo quando houver infraestrutura adequada.
- Log em texto simples, pesquisável e econômico; não usar binário/hex: `AAAA-MM-DD | tipo | arquivos | resultado | validação`. Nunca registrar segredos ou dados pessoais.

## Log de alterações
- 2026-11-20 | docs | `IAgent.md`, `README.md` | Criado protocolo de rastreio e alinhado roadmap à implementação encontrada | revisão documental; sem build
- 2026-11-20 | inventário | arquivos da raiz e `src/` | Mapeadas responsabilidades atuais, dependências e scripts; registrada a proteção de `zzznotes*` | conferido com código e `package.json`
- 2026-11-20 | instruções | `IAgent.md` | Definida exceção segura para edições explicitamente solicitadas em notas pessoais | regra de privacidade revisada
- 2026-11-20 | fix | `src/App.jsx`, `src/hooks/useProfiles.js`, `src/engine/promptBuilder.js`, `src/components/WorldArchitectChat.jsx`, `src/components/DungeonPaperModal.jsx`, `IAgent.md` | Aplicado buffer de 10 turnos, suporte a avatar URL, status real de sync Firebase, gravação cloud de novos perfis, validação de JSON na ficha, limpeza de crases no blueprint e remoção de `diceEngine.js` | build validado com `npm run build`
- 2026-11-20 | deploy | `firebase.json`, `.firebaserc`, `IAgent.md`, `README.md` | Configurado projeto Firebase `mad-pjct` (Auth Anônima + Firestore `airpg_profiles`/`airpg_chats`) e publicado no Firebase Hosting em `https://madrpg.web.app` | build e deploy concluídos no terminal