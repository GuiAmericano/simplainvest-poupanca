-- MetaPoupança — schema inicial
-- Execute este SQL no Supabase: SQL Editor > New query > Run

-- Tabela de metas financeiras
create table if not exists public.metas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  valor_objetivo numeric(12, 2) not null check (valor_objetivo > 0),
  data_limite date not null,
  taxa_rendimento_anual numeric(6, 4) not null default 0 check (taxa_rendimento_anual >= 0),
  created_at timestamptz not null default now()
);

-- Tabela de movimentações (aportes e retiradas)
create table if not exists public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  meta_id uuid not null references public.metas(id) on delete cascade,
  valor numeric(12, 2) not null check (valor > 0),
  tipo text not null default 'aporte' check (tipo in ('aporte', 'retirada')),
  descricao text,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

-- Índice para buscar movimentações por meta
create index if not exists idx_movimentacoes_meta_id on public.movimentacoes(meta_id);

-- Habilitar Row Level Security (preparado para auth futura)
alter table public.metas enable row level security;
alter table public.movimentacoes enable row level security;

-- Políticas temporárias: acesso público (MVP sem login)
-- Trocar por políticas com auth na Fase 4
create policy "Permitir leitura de metas"
  on public.metas for select
  using (true);

create policy "Permitir inserção de metas"
  on public.metas for insert
  with check (true);

create policy "Permitir atualização de metas"
  on public.metas for update
  using (true);

create policy "Permitir exclusão de metas"
  on public.metas for delete
  using (true);

create policy "Permitir leitura de movimentações"
  on public.movimentacoes for select
  using (true);

create policy "Permitir inserção de movimentações"
  on public.movimentacoes for insert
  with check (true);

create policy "Permitir atualização de movimentações"
  on public.movimentacoes for update
  using (true);

create policy "Permitir exclusão de movimentações"
  on public.movimentacoes for delete
  using (true);
