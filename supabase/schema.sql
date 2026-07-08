-- LogisticMap: общее хранилище данных для всех пользователей
-- Выполните в Supabase → SQL Editor → Run

create table if not exists public.app_state (
    id int primary key default 1,
    data jsonb not null default '{}'::jsonb,
    updated_at timestamptz not null default now()
);

insert into public.app_state (id, data)
values (1, '{}'::jsonb)
on conflict (id) do nothing;

alter table public.app_state enable row level security;

drop policy if exists "app_state_anon_select" on public.app_state;
drop policy if exists "app_state_anon_insert" on public.app_state;
drop policy if exists "app_state_anon_update" on public.app_state;

create policy "app_state_anon_select"
    on public.app_state for select
    to anon
    using (true);

create policy "app_state_anon_insert"
    on public.app_state for insert
    to anon
    with check (id = 1);

create policy "app_state_anon_update"
    on public.app_state for update
    to anon
    using (id = 1)
    with check (id = 1);

-- После выполнения SQL: Table Editor → app_state → включите Realtime
