# Histórico / auditoria de campanhas

Data: 14/08/2026

## O que foi feito

Histórico automático de alterações em `campanhas`, com o administrador responsável e o diff dos campos. A tabela `campanhas_historico` **já existia**. Foram adicionadas colunas de auditoria em `campanhas` (`updated_by`, `updated_at`) e uma trigger `AFTER UPDATE`.

## Colunas

`campanhas_historico`: `id`, `created_at`, `campanha_id`, `usuario_id`, `acao`, `descricao`, `metadata`

`campanhas` (auditoria): `updated_by` (UUID do admin autenticado), `updated_at`

O JSON em `metadata` para UPDATE:

```json
{
  "alteracoes": {
    "titulo": { "antes": "HAVAL H9", "depois": "HAVAL H9 GT" }
  },
  "usuario_email": "admin@exemplo.com",
  "usuario_nome": "Pedro Henrique"
}
```

Registros antigos (criação/edição/exclusão feitos pelo backend) continuam com `metadata.campos` e `acao` em português (`criada`, `atualizada`, `excluída`). A interface lê os dois formatos.

## Como funciona

1. Admin autentica com JWT (`requireAuth` + `supabase.auth.getUser`). O backend usa **service_role**, então `auth.uid()` na trigger não identifica o admin.
2. Em criar / editar / ativar, o backend grava `updated_by` e `updated_at` a partir de `req.user.id`. O frontend **não** envia `updated_by`.
3. A trigger `trg_campanhas_historico_update` compara `OLD` e `NEW` com `IS DISTINCT FROM`, ignora campos técnicos (`updated_at`, `updated_by`, `pronta_publicacao`, `id`, `created_at`) e insere **um** registro com `acao = UPDATE` só se houver mudança real.
4. Criação e exclusão continuam registradas pelo backend (`criada` / `excluída`).
5. Sincronização automática de status (job) zera `updated_by` para não atribuir a mudança ao último admin. A UI mostra **Sistema**.
6. Antecipação de data: depois do UPDATE, o backend anexa `confirmacao_data_pendente` no registro mais recente (flag interna, sem endpoint de edição para o admin).
7. Painel: `GET /api/campanhas/:id/historico` (alias: `/api/campanhas/historico/:id`), autenticado, `created_at DESC`.

## SQL a executar

Rodar no SQL Editor do projeto Shiver:

`documents/campanhas-historico-trigger.sql`

Inclui colunas, índices, função, trigger e RLS.

## Arquivos

- `documents/campanhas-historico-trigger.sql`
- `documents/campanhas-historico-rls.sql`
- `documents/campanhas-historico.md`
- `backend/services/campanhaHistorico.service.js`
- `backend/routes/campanhaRoutes.js`
- `backend/utils/campanhaStatus.js`
- `frontend/admin/campanha-detalhes.html`
- `frontend/admin/campanha-detalhes.js`
- `frontend/css/admin/campanha-detalhes.css`

## Segurança

- Rota de leitura exige Bearer JWT.
- API pública **não** devolve histórico.
- Sem endpoints de PATCH/DELETE em `campanhas_historico`.
- RLS ligado; anon sem grant; authenticated só SELECT.
- Escrita: service_role e trigger `SECURITY DEFINER`.

## Identificação do admin

`req.user` vem de `supabase.auth.getUser(token)`. `updated_by = req.user.id`. A trigger copia para `usuario_id` e tenta ler e-mail/nome em `auth.users`.

## Pendência

Executar `documents/campanhas-historico-trigger.sql` no SQL Editor do Supabase Shiver.

Enquanto as colunas `updated_by` / `updated_at` não existirem, o backend **continua salvando** a campanha e registra o UPDATE pelo serviço (sem duplicar depois que a trigger estiver ativa).
