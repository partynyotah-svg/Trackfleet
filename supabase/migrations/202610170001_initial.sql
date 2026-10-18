create extension if not exists pgcrypto;

create type public.app_role as enum ('admin','manager','dispatcher','driver','user');
create type public.vehicle_status as enum ('active','maintenance','inactive');
create type public.delivery_status as enum ('pending','assigned','in_transit','delivered','failed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role public.app_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create function public.current_role() returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate_number text not null unique,
  make text,
  model text,
  status public.vehicle_status not null default 'active',
  tracker_code text unique,
  tracker_phone text,
  tracker_init_pin_hash text,
  tracker_initialized_at timestamptz,
  tracker_last_seen_at timestamptz,
  tracker_status text not null default 'not_configured',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tracker_pin_requires_code check (tracker_init_pin_hash is null or tracker_code is not null)
);

create table public.drivers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null,
  email text,
  license_number text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now()
);

create table public.deliveries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  recipient_name text not null,
  recipient_phone text,
  destination text not null,
  status public.delivery_status not null default 'pending',
  vehicle_id uuid references public.vehicles(id) on delete set null,
  driver_id uuid references public.drivers(id) on delete set null,
  scheduled_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.maintenance_records (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  maintenance_type text not null,
  description text,
  cost numeric(12,2) check (cost is null or cost >= 0),
  service_date date not null default current_date,
  next_service_date date,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.tracker_events (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  sender_phone text not null,
  event_type text not null,
  message text,
  created_at timestamptz not null default now()
);

create index deliveries_status_created_idx on public.deliveries(status, created_at desc);
create index deliveries_vehicle_idx on public.deliveries(vehicle_id);
create index tracker_events_vehicle_idx on public.tracker_events(vehicle_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.drivers enable row level security;
alter table public.deliveries enable row level security;
alter table public.maintenance_records enable row level security;
alter table public.tracker_events enable row level security;

create policy "users read own profile" on public.profiles for select to authenticated using (id = auth.uid() or public.current_role() = 'admin');
create policy "users update own name" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid() and role = public.current_role());
create policy "staff read vehicles" on public.vehicles for select to authenticated using (public.current_role() in ('admin','manager','dispatcher','driver'));
create policy "staff create vehicles" on public.vehicles for insert to authenticated with check (public.current_role() in ('admin','manager','dispatcher'));
create policy "staff update vehicles" on public.vehicles for update to authenticated using (public.current_role() in ('admin','manager','dispatcher')) with check (public.current_role() in ('admin','manager','dispatcher'));
create policy "admin delete vehicles" on public.vehicles for delete to authenticated using (public.current_role() = 'admin');

create policy "staff read drivers" on public.drivers for select to authenticated using (public.current_role() in ('admin','manager','dispatcher','driver'));
create policy "staff write drivers" on public.drivers for all to authenticated using (public.current_role() in ('admin','manager','dispatcher')) with check (public.current_role() in ('admin','manager','dispatcher'));

create policy "staff read deliveries" on public.deliveries for select to authenticated using (public.current_role() in ('admin','manager','dispatcher','driver'));
create policy "staff create deliveries" on public.deliveries for insert to authenticated with check (public.current_role() in ('admin','manager','dispatcher'));
create policy "staff update deliveries" on public.deliveries for update to authenticated using (public.current_role() in ('admin','manager','dispatcher','driver')) with check (public.current_role() in ('admin','manager','dispatcher','driver'));
create policy "admin delete deliveries" on public.deliveries for delete to authenticated using (public.current_role() = 'admin');

create policy "staff read maintenance" on public.maintenance_records for select to authenticated using (public.current_role() in ('admin','manager','dispatcher'));
create policy "staff write maintenance" on public.maintenance_records for all to authenticated using (public.current_role() in ('admin','manager','dispatcher')) with check (public.current_role() in ('admin','manager','dispatcher'));
create policy "staff read tracker events" on public.tracker_events for select to authenticated using (public.current_role() in ('admin','manager','dispatcher'));
create policy "admin manage profiles" on public.profiles for all to authenticated using (public.current_role() = 'admin') with check (public.current_role() = 'admin');

-- Critical: tracker_init_pin_hash must be populated by a trusted admin/backend with SHA-256 of a random one-time code.
-- Never accept a plaintext initialization code from public signup metadata.


-- Prevent self-service role escalation. A trusted admin can still promote/demote accounts.
create or replace function public.prevent_self_role_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and public.current_role() <> 'admin' then
    raise exception 'Only an administrator may change account roles';
  end if;
  return new;
end; $$;
create trigger prevent_profile_role_escalation
before update of role on public.profiles
for each row execute procedure public.prevent_self_role_change();
