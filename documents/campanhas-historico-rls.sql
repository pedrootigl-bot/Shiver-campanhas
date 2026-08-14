-- Histórico de campanhas — SOMENTE no projeto Shiver.
-- Não executar no banco da Bullex.
-- Não desabilita RLS. Visitantes anônimos não leem esta tabela.
-- A trigger completa está em documents/campanhas-historico-trigger.sql.

alter table if exists public.campanhas_historico enable row level security;

revoke all on table public.campanhas_historico from anon, public;

revoke insert, update, delete on table public.campanhas_historico from authenticated;

drop policy if exists campanhas_historico_select_authenticated on public.campanhas_historico;
create policy campanhas_historico_select_authenticated
on public.campanhas_historico
for select
to authenticated
using (true);

-- Escrita: backend (service_role) e trigger SECURITY DEFINER.
-- Sem policy de insert/update/delete para anon ou authenticated.
-- Não há endpoint de edição ou exclusão do histórico.
