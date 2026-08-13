-- Histórico de campanhas — SOMENTE no projeto Shiver.
-- Não executar no banco da Bullex.
-- Não desabilita RLS. Visitantes anônimos não leem esta tabela.

alter table if exists public.campanhas_historico enable row level security;

revoke all on table public.campanhas_historico from anon, public;

drop policy if exists campanhas_historico_select_authenticated on public.campanhas_historico;
create policy campanhas_historico_select_authenticated
on public.campanhas_historico
for select
to authenticated
using (true);

-- Escrita continua pelo backend (service_role).
-- Não há policy de insert/update/delete para anon.
