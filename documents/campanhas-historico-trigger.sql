-- Histórico automático de campanhas — SOMENTE no projeto Shiver.
-- Não executar no banco da Bullex.
-- SQL Editor do projeto: monzskndwumwmmhaoaaf
--
-- O backend usa service_role (não auth.uid()). O admin autenticado
-- é gravado em campanhas.updated_by a cada UPDATE vindo da API.

-- ============================================================
-- Colunas de auditoria na campanha
-- ============================================================

alter table if exists public.campanhas
    add column if not exists updated_by uuid;

alter table if exists public.campanhas
    add column if not exists updated_at timestamptz default now();

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conname = 'campanhas_updated_by_fkey'
    ) then
        alter table public.campanhas
            add constraint campanhas_updated_by_fkey
            foreign key (updated_by)
            references auth.users (id)
            on delete set null;
    end if;
exception
    when others then
        -- Sem permissão em auth.users ou FK já equivalente: segue sem bloquear.
        raise notice 'FK campanhas.updated_by não aplicada: %', sqlerrm;
end
$$;

-- metadata em jsonb (idempotente se já for jsonb)
do $$
begin
    if exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'campanhas_historico'
          and column_name = 'metadata'
          and udt_name = 'json'
    ) then
        alter table public.campanhas_historico
            alter column metadata type jsonb
            using metadata::jsonb;
    end if;
end
$$;

-- ============================================================
-- Índices
-- ============================================================

create index if not exists idx_campanhas_historico_campanha_id
    on public.campanhas_historico (campanha_id);

create index if not exists idx_campanhas_historico_created_at
    on public.campanhas_historico (created_at desc);

create index if not exists idx_campanhas_historico_usuario_id
    on public.campanhas_historico (usuario_id);

create index if not exists idx_campanhas_updated_by
    on public.campanhas (updated_by);

-- ============================================================
-- Função + trigger AFTER UPDATE
-- ============================================================

create or replace function public.fn_campanhas_historico_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
    old_row jsonb := to_jsonb(old);
    new_row jsonb := to_jsonb(new);
    alteracoes jsonb := '{}'::jsonb;
    ignorar text[] := array[
        'id',
        'created_at',
        'updated_at',
        'updated_by',
        'pronta_publicacao'
    ];
    datas text[] := array['data_inicio', 'data_fim'];
    chave text;
    valor_antes jsonb;
    valor_depois jsonb;
    texto_antes text;
    texto_depois text;
    usuario_email text;
    usuario_nome text;
begin
    for chave in
        select jsonb_object_keys(new_row)
    loop
        if chave = any (ignorar) then
            continue;
        end if;

        valor_antes := old_row -> chave;
        valor_depois := new_row -> chave;

        if chave = any (datas) then
            texto_antes := left(coalesce(old_row ->> chave, ''), 10);
            texto_depois := left(coalesce(new_row ->> chave, ''), 10);

            if texto_antes = '' then
                texto_antes := null;
            end if;
            if texto_depois = '' then
                texto_depois := null;
            end if;

            if texto_antes is not distinct from texto_depois then
                continue;
            end if;

            valor_antes := to_jsonb(texto_antes);
            valor_depois := to_jsonb(texto_depois);
        elsif valor_antes is not distinct from valor_depois then
            continue;
        end if;

        alteracoes := alteracoes || jsonb_build_object(
            chave,
            jsonb_build_object(
                'antes', valor_antes,
                'depois', valor_depois
            )
        );
    end loop;

    if alteracoes = '{}'::jsonb then
        return new;
    end if;

    if new.updated_by is not null then
        begin
            select
                u.email,
                coalesce(
                    nullif(u.raw_user_meta_data ->> 'full_name', ''),
                    nullif(u.raw_user_meta_data ->> 'name', ''),
                    nullif(u.raw_user_meta_data ->> 'nome', ''),
                    u.email
                )
            into usuario_email, usuario_nome
            from auth.users u
            where u.id = new.updated_by;
        exception
            when others then
                usuario_email := null;
                usuario_nome := null;
        end;
    end if;

    insert into public.campanhas_historico (
        campanha_id,
        usuario_id,
        acao,
        descricao,
        metadata
    ) values (
        new.id,
        new.updated_by,
        'UPDATE',
        'Informações da campanha alteradas',
        jsonb_build_object(
            'alteracoes', alteracoes,
            'usuario_email', usuario_email,
            'usuario_nome', usuario_nome
        )
    );

    return new;
end;
$$;

drop trigger if exists trg_campanhas_historico_update on public.campanhas;

create trigger trg_campanhas_historico_update
after update on public.campanhas
for each row
execute procedure public.fn_campanhas_historico_update();

comment on function public.fn_campanhas_historico_update() is
    'Auditoria AFTER UPDATE de campanhas. Ações futuras (CREATE, PUBLISH, ACTIVATE, PAUSE, FINISH, DELETE, DUPLICATE) podem ser triggers separadas.';

-- RLS: leitura autenticada; escrita só service_role / trigger definer.
alter table if exists public.campanhas_historico enable row level security;

revoke all on table public.campanhas_historico from anon, public;

revoke insert, update, delete on table public.campanhas_historico from authenticated;

drop policy if exists campanhas_historico_select_authenticated on public.campanhas_historico;
create policy campanhas_historico_select_authenticated
on public.campanhas_historico
for select
to authenticated
using (true);
