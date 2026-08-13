-- SOMENTE no projeto Shiver (monzskndwumwmmhaoaaf).
-- NÃO executar no banco da Bullex.
-- O app acessa o banco só pelo backend. RLS nas tabelas estava
-- bloqueando insert/upload porque a chave sb_secret não bypassa.

alter table if exists public.campanhas disable row level security;
alter table if exists public.materiais disable row level security;
alter table if exists public.copies disable row level security;
alter table if exists public.regras disable row level security;
alter table if exists public.angulos_divulgacao disable row level security;
alter table if exists public.kits disable row level security;
alter table if exists public.destaques disable row level security;
alter table if exists public.notificacoes disable row level security;

drop policy if exists shiver_campanhas_public_read on storage.objects;
create policy shiver_campanhas_public_read
on storage.objects for select
using (bucket_id = 'campanhas');

drop policy if exists shiver_stories_public_read on storage.objects;
create policy shiver_stories_public_read
on storage.objects for select
using (bucket_id = 'stories');

drop policy if exists shiver_storage_insert on storage.objects;
create policy shiver_storage_insert
on storage.objects for insert
with check (bucket_id in ('campanhas', 'stories'));

drop policy if exists shiver_storage_update on storage.objects;
create policy shiver_storage_update
on storage.objects for update
using (bucket_id in ('campanhas', 'stories'))
with check (bucket_id in ('campanhas', 'stories'));

drop policy if exists shiver_storage_delete on storage.objects;
create policy shiver_storage_delete
on storage.objects for delete
using (bucket_id in ('campanhas', 'stories'));
