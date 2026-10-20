-- Ejecutar en Supabase SQL Editor. Reemplaza admin@tudominio.com por el correo del usuario administrador creado previamente en Authentication.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('admin','veterinarian','owner')),
  full_name text not null default '',
  email text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, role, full_name, email)
  values (new.id, 'owner', coalesce(new.raw_user_meta_data->>'full_name',''), coalesce(new.email,''))
  on conflict (id) do update set email=excluded.email;
  return new;
end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create table if not exists public.veterinarian_profiles (
  id uuid primary key references public.profiles(id) on delete cascade,
  username text not null unique,
  company_name text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.owner_profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references public.profiles(id) on delete set null,
  veterinarian_id uuid references public.profiles(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint owner_link_required check (auth_user_id is not null or veterinarian_id is not null)
);
create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.owner_profiles(id) on delete cascade,
  name text not null,
  species text not null,
  breed text,
  sex text,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.profiles where id = auth.uid()
$$;
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$ select coalesce(public.current_role()='admin',false) $$;
create or replace function public.is_owner_for_owner(owner_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.owner_profiles o where o.id=owner_uuid and o.auth_user_id=auth.uid())
$$;
create or replace function public.is_veterinarian_for_owner(owner_uuid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
 select exists(select 1 from public.owner_profiles o where o.id=owner_uuid and o.veterinarian_id=auth.uid())
$$;

alter table public.profiles enable row level security;
alter table public.veterinarian_profiles enable row level security;
alter table public.owner_profiles enable row level security;
alter table public.pets enable row level security;

drop policy if exists "profiles read self or admin" on public.profiles;
create policy "profiles read self or admin" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
drop policy if exists "veterinarians admin read" on public.veterinarian_profiles;
create policy "veterinarians admin read" on public.veterinarian_profiles for select to authenticated using (public.is_admin());
drop policy if exists "owners scoped read" on public.owner_profiles;
create policy "owners scoped read" on public.owner_profiles for select to authenticated using (public.is_admin() or veterinarian_id=auth.uid() or auth_user_id=auth.uid());
drop policy if exists "owners vet create" on public.owner_profiles;
create policy "owners vet create" on public.owner_profiles for insert to authenticated with check (public.current_role()='veterinarian' and veterinarian_id=auth.uid() and auth_user_id is null);
drop policy if exists "owners vet update" on public.owner_profiles;
create policy "owners vet update" on public.owner_profiles for update to authenticated using (public.is_admin() or veterinarian_id=auth.uid()) with check (public.is_admin() or veterinarian_id=auth.uid());
drop policy if exists "owners vet delete" on public.owner_profiles;
create policy "owners vet delete" on public.owner_profiles for delete to authenticated using (public.is_admin() or veterinarian_id=auth.uid());

drop policy if exists "pets scoped read" on public.pets;
create policy "pets scoped read" on public.pets for select to authenticated using (public.is_admin() or public.is_veterinarian_for_owner(owner_id) or exists(select 1 from public.owner_profiles o where o.id=owner_id and o.auth_user_id=auth.uid()));
drop policy if exists "pets vet insert" on public.pets;
create policy "pets vet insert" on public.pets for insert to authenticated with check ((public.current_role()='veterinarian' and public.is_veterinarian_for_owner(owner_id)) or (public.current_role()='owner' and public.is_owner_for_owner(owner_id)));
drop policy if exists "pets scoped update" on public.pets;
create policy "pets scoped update" on public.pets for update to authenticated using (public.is_admin() or public.is_veterinarian_for_owner(owner_id) or exists(select 1 from public.owner_profiles o where o.id=owner_id and o.auth_user_id=auth.uid())) with check (public.is_admin() or public.is_veterinarian_for_owner(owner_id) or exists(select 1 from public.owner_profiles o where o.id=owner_id and o.auth_user_id=auth.uid()));
drop policy if exists "pets scoped delete" on public.pets;
create policy "pets scoped delete" on public.pets for delete to authenticated using (public.is_admin() or public.is_veterinarian_for_owner(owner_id) or exists(select 1 from public.owner_profiles o where o.id=owner_id and o.auth_user_id=auth.uid()));

create table if not exists public.formulas_medicas (
 id uuid primary key default gen_random_uuid(), fecha text, nombre_paciente text, especie text, raza text, sexo text, edad text,
 medicamentos jsonb not null default '[]'::jsonb, recomendaciones jsonb not null default '[]'::jsonb,
 created_by uuid references public.profiles(id) on delete set null,
 created_at timestamptz not null default now()
);
alter table public.formulas_medicas add column if not exists fecha text;
alter table public.formulas_medicas add column if not exists nombre_paciente text;
alter table public.formulas_medicas add column if not exists especie text;
alter table public.formulas_medicas add column if not exists raza text;
alter table public.formulas_medicas add column if not exists sexo text;
alter table public.formulas_medicas add column if not exists edad text;
alter table public.formulas_medicas add column if not exists medicamentos jsonb not null default '[]'::jsonb;
alter table public.formulas_medicas add column if not exists recomendaciones jsonb not null default '[]'::jsonb;
alter table public.formulas_medicas add column if not exists created_at timestamptz not null default now();
alter table public.formulas_medicas add column if not exists created_by uuid references public.profiles(id) on delete set null;
do $$ declare pol record; begin for pol in select policyname from pg_policies where schemaname='public' and tablename='formulas_medicas' loop execute format('drop policy if exists %I on public.formulas_medicas',pol.policyname); end loop; end $$;
alter table public.formulas_medicas enable row level security;
drop policy if exists "formulas scoped read" on public.formulas_medicas;
create policy "formulas scoped read" on public.formulas_medicas for select to authenticated using (public.is_admin() or created_by=auth.uid());
drop policy if exists "formulas vet insert" on public.formulas_medicas;
create policy "formulas vet insert" on public.formulas_medicas for insert to authenticated with check ((public.current_role()='veterinarian' or public.is_admin()) and created_by=auth.uid());
drop policy if exists "formulas scoped update" on public.formulas_medicas;
create policy "formulas scoped update" on public.formulas_medicas for update to authenticated using (public.is_admin() or created_by=auth.uid()) with check (public.is_admin() or created_by=auth.uid());
drop policy if exists "formulas scoped delete" on public.formulas_medicas;
create policy "formulas scoped delete" on public.formulas_medicas for delete to authenticated using (public.is_admin() or created_by=auth.uid());

-- Bootstrap: crea antes el usuario desde Authentication > Users y asigna su correo aquí.
insert into public.profiles(id,role,full_name,email)
select u.id,'admin',coalesce(nullif(u.raw_user_meta_data->>'full_name',''),'Administrador'),coalesce(u.email,'')
from auth.users u where lower(u.email)=lower('gspcoder@gmail.com')
on conflict (id) do update set role='admin';


