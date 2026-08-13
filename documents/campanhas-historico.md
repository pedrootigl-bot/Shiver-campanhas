# Histórico / auditoria de campanhas

Data: 13/08/2026

## O que foi feito

Sistema de auditoria integrado aos fluxos já existentes de criar, editar e excluir campanha. A tabela `campanhas_historico` **já existia** no Supabase Shiver. Nenhuma coluna nova foi criada.

## Colunas reais usadas

`id`, `created_at`, `campanha_id`, `usuario_id`, `acao`, `descricao`, `metadata`

O JSON em `metadata` guarda:

- `usuario_email` (quando o login atual entrega o e-mail)
- `campos` — lista de `{ campo, label, antes, depois }`
- `snapshot` — estado relevante na criação e na exclusão

## Como funciona

1. Admin autenticado cria/edita/exclui campanha (`requireAuth` + JWT do Supabase).
2. O backend grava um evento em `campanhas_historico` **depois** do sucesso da operação principal (na exclusão, **antes** de apagar a campanha).
3. Se a auditoria falhar, a campanha **não** é revertida. O erro vai para o log `[HISTÓRICO]`.
4. Edição sem mudança real de campo **não** gera registro.
5. O painel consulta `GET /api/campanhas/historico/:id` (autenticado) e mostra a timeline na página de detalhes.

Ações gravadas: `criada`, `atualizada`, `excluída`.

`usuario_id` só é preenchido com o `id` do usuário autenticado. Nenhum ID é inventado.

## Arquivos

Criados:

- `backend/services/campanhaHistorico.service.js`
- `documents/campanhas-historico-rls.sql`
- `documents/campanhas-historico.md`

Modificados:

- `backend/routes/campanhaRoutes.js`
- `frontend/admin/campanha-detalhes.html`
- `frontend/admin/campanha-detalhes.js`
- `frontend/css/admin/campanha-detalhes.css`

Banco: nenhuma coluna/tabela nova. SQL de RLS em `documents/campanhas-historico-rls.sql` (executar no SQL Editor do projeto Shiver se ainda não estiver aplicado).

## Segurança

- Rota de leitura exige Bearer JWT.
- A API pública (`GET /api/campanhas` e `GET /api/campanhas/:id`) **não** devolve histórico.
- RLS deve permanecer ligado na tabela. Anon/public sem grant.

## Configuração pendente

Rodar `documents/campanhas-historico-rls.sql` no SQL Editor do Supabase Shiver.

Se existir FK `campanha_id → campanhas.id` com `ON DELETE CASCADE`, o evento de exclusão some junto com a campanha. Para preservar a auditoria após o delete, a FK precisa ser `ON DELETE SET NULL` ou removida. Não alterei isso automaticamente.
