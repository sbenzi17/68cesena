-- Schema del database dell'Archivio Fotografico.
-- Da incollare una sola volta in Supabase > SQL Editor > New query > Run.

-- Una riga per scheda del catalogo (stesse colonne dell'Excel)
create table public.schede (
  id            text primary key,          -- identificativo, es. '084'
  status        text not null default 'ok',
  fondo         text,
  serie         text,
  titolo        text,
  autore        text,
  luogo_stampa  text,
  data          text,
  data_ord      text,                      -- data per ordinamento, es. '1977.03.08'
  citta         text,
  luogo         text,
  evento        text,
  formazione    text[] not null default '{}',
  persone       text[] not null default '{}',
  parole        text[] not null default '{}',
  sequenza      text,
  tipologia     text,
  supporto      text,
  dimensioni    text,
  orientamento  text,
  colore        text,
  particolare   text,
  fronte_retro  text,
  pagine        text,
  risoluzione   text,
  note          text,
  immagini      text[] not null default '{}', -- nomi dei file su R2 in ordine, es. {084-001,084-002}
  pdf           text,                         -- nome del PDF su R2, es. '084.pdf'
  audio         text,                         -- nome del file audio su R2 (cartella audio/)
  video         text,                         -- link di YouTube
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Chi può modificare: utenti di Supabase Auth elencati qui
create table public.admin (
  user_id uuid primary key references auth.users on delete cascade,
  nome    text
);

-- Storico di ogni modifica, per poter sempre ricostruire una scheda
create table public.schede_storico (
  id         bigint generated always as identity primary key,
  scheda_id  text not null,
  azione     text not null,               -- INSERT / UPDATE / DELETE
  prima      jsonb,
  dopo       jsonb,
  utente     uuid default auth.uid(),
  quando     timestamptz not null default now()
);

create function public.is_admin() returns boolean
language sql security definer stable set search_path = '' as $$
  select exists (select 1 from public.admin where user_id = auth.uid())
$$;

create function public.registra_modifica() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then new.updated_at := now(); end if;
  insert into public.schede_storico (scheda_id, azione, prima, dopo)
  values (coalesce(new.id, old.id), tg_op,
          case when tg_op <> 'INSERT' then to_jsonb(old) end,
          case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end $$;

create trigger schede_storico_trg
  before insert or update or delete on public.schede
  for each row execute function public.registra_modifica();

-- Permessi (Row Level Security)
alter table public.schede enable row level security;
alter table public.admin enable row level security;
alter table public.schede_storico enable row level security;

create policy "tutti leggono le schede pubblicate" on public.schede
  for select using (status = 'ok' or public.is_admin());
create policy "admin inseriscono" on public.schede
  for insert to authenticated with check (public.is_admin());
create policy "admin modificano" on public.schede
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admin eliminano" on public.schede
  for delete to authenticated using (public.is_admin());

create policy "ognuno vede se è admin" on public.admin
  for select to authenticated using (user_id = auth.uid());

create policy "admin leggono lo storico" on public.schede_storico
  for select to authenticated using (public.is_admin());

create index schede_data_ord_idx on public.schede (data_ord);

-- Per un database creato prima dell'aggiunta di audio e video (ottobre 2026):
-- alter table public.schede add column if not exists audio text, add column if not exists video text;

-- Contatore delle visite (una riga per giorno, ora italiana): scrive chiunque tramite la funzione, leggono solo gli admin
create table if not exists public.visite (
  giorno date primary key,
  visite integer not null default 0
);
alter table public.visite enable row level security;
create policy "admin leggono le visite" on public.visite
  for select to authenticated using (public.is_admin());
create or replace function public.registra_visita() returns void
language sql security definer set search_path = '' as $$
  insert into public.visite (giorno, visite) values ((now() at time zone 'Europe/Rome')::date, 1)
  on conflict (giorno) do update set visite = public.visite.visite + 1;
$$;
grant execute on function public.registra_visita() to anon, authenticated;

-- Dimensione del database per la pagina "Stato" del pannello (la chiama solo il Worker con la chiave service_role)
create or replace function public.dimensione_database() returns bigint
language sql security definer stable set search_path = '' as $$
  select pg_database_size(current_database())
$$;
revoke all on function public.dimensione_database() from public, anon, authenticated;
grant execute on function public.dimensione_database() to service_role;
