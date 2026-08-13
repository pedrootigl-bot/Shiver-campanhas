# Shiver-Campanhas — conexão com o Supabase novo

Data: 2026-08-13

## Objetivo

- Projeto **Bullex**: continua mandando e recebendo dados do **banco da Bullex**. Este repositório **não altera** esse banco.
- Projeto **Shiver-Campanhas**: manda e recebe dados **somente** do banco novo (`monzskndwumwmmhaoaaf.supabase.co`).

Não houve cópia de campanhas, materiais, copies, regras, destaques ou arquivos do banco da Bullex para o Shiver.

## Arquivos alterados

- `backend/server.js` — `GET /api/public-config` (URL + anon do `.env`, sem service role)
- `frontend/admin/supabase-client.js` — removeu URL/key hardcoded da Bullex; carrega config do backend
- `frontend/admin/login.js` — login via client inicializado no projeto Shiver
- `frontend/admin/dashboard.js` — logout no mesmo client
- `frontend/admin/campanha-form.js` — upload de card/material via `POST /api/upload` (Storage do banco novo)
- `backend/.env.example` — nomes das variáveis, sem segredos
- `backend/scripts/criar-buckets-novo.js` — cria buckets só no projeto novo
- `documents/supabase-schema-policies.sql` — RLS/policies **somente** no SQL Editor do projeto novo

## Tabelas identificadas (código Shiver)

Usadas: `campanhas`, `materiais`, `copies`, `regras`, `angulos_divulgacao`, `kits`, `destaques`, `notificacoes`.

Não usada pelo código: `mecanicas` (existe no banco novo; não foi alterada).

Stats não é tabela — agregação em `backend/routes/stats.js`.

## Configurações do Supabase

| Item | Valor |
|------|--------|
| Destino Shiver | `monzskndwumwmmhaoaaf.supabase.co` via `backend/.env` |
| Backend | `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (já estava no `.env`) |
| Admin Auth | anon via `/api/public-config` (`SUPABASE_ANON_KEY` ou fallback `SUPABASE_KEY`) |
| Bullex hardcoded | removido de `frontend/admin/supabase-client.js` |

## Dados migrados

Nenhum. O banco novo permanece com as tabelas vazias. Cadastros novos do Shiver nascem só nele.

## Buckets / arquivos

Criados **no projeto novo**:

- `campanhas` (público)
- `stories` (público)

Nenhum arquivo foi copiado do Storage da Bullex. Nenhum bucket da Bullex foi modificado.

## Policies / RLS

SQL pronto em `documents/supabase-schema-policies.sql` para rodar **apenas** no SQL Editor do projeto Shiver:

- RLS ligado nas 8 tabelas do app (CRUD continua pelo backend `service_role`)
- Leitura pública de `storage.objects` nos buckets `campanhas` e `stories`

## Auth

Usuário admin criado no **projeto novo** (`pedrootigl@gmail.com`, e-mail confirmado). O login do painel usa `POST /api/auth/login` no backend Shiver, não o Auth da Bullex.

## Referência ao banco antigo

Busca no código do Shiver: **zero** ocorrências de `trakfklbjqynwonqyrfh`.

O `.env` do backend aponta só para o host novo. A service role não é usada contra a Bullex.

## Pendência

A variável `SUPABASE_KEY` atual do `.env` foi rejeitada pela API como chave inválida (`Invalid API key`). Cole em `SUPABASE_ANON_KEY` (ou substitua `SUPABASE_KEY`) a **anon public** do projeto `monzskndwumwmmhaoaaf` (Dashboard → Settings → API). Sem isso, o login do admin não autentica no banco novo.

## Testes realizados

- Backend novo na porta 3000: `GET /` → `API Bullex funcionando!`
- `GET /api/public-config` → host `monzskndwumwmmhaoaaf.supabase.co` (não é o host da Bullex)
- `GET /api/campanhas` → `[]` (banco Shiver vazio, como esperado)
- `GET /api/stats` → tudo zero
- Logs do scheduler: `total=0` no banco novo
- Buckets `campanhas` e `stories` criados no host novo
- Código do admin sem URL/JWT da Bullex
- Uploads do form passam pela API do Shiver (`/api/upload`)
- Script de migração de dados da Bullex **não** foi criado nem executado
