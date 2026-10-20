-- Appointments for the single barber. Overlapping times on the same day are rejected.

create extension if not exists btree_gist;

drop table if exists public.bookings cascade;

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  style_id text not null,
  style_name text not null,
  minutes integer not null,
  price integer not null,
  booking_date date not null,
  time text not null,
  start_minute integer not null,
  client_name text not null,
  phone text not null,
  client_email text,
  status text not null default 'potvrden' check (status in ('potvrden', 'odbijen')),
  created_at timestamptz not null default now(),
  constraint bookings_no_overlap exclude using gist (
    booking_date with =,
    int4range(start_minute, start_minute + minutes, '[)') with &&
  ) where (status = 'potvrden')
);

create index bookings_date_idx on public.bookings (booking_date, time);

create or replace function public.prepare_booking()
returns trigger
language plpgsql
as $$
declare
  open_min integer;
  close_min integer;
  dow integer;
  starts_at timestamptz;
begin
  if new.status is null or btrim(new.status) = '' then
    new.status := 'potvrden';
  end if;
  if new.status not in ('potvrden', 'odbijen') then
    raise exception 'Nepoznat status';
  end if;

  new.client_name := btrim(new.client_name);
  new.phone := regexp_replace(new.phone, '[^0-9+]', '', 'g');
  new.time := btrim(new.time);

  if new.style_id = 'fade' then
    new.style_name := 'Skin fade';
    new.minutes := 40;
    new.price := 1800;
  elsif new.style_id = 'classic' then
    new.style_name := 'Klasični rez';
    new.minutes := 30;
    new.price := 1400;
  elsif new.style_id = 'crop' then
    new.style_name := 'Teksturirani crop';
    new.minutes := 45;
    new.price := 1900;
  elsif new.style_id = 'beard' then
    new.style_name := 'Šišanje i brada';
    new.minutes := 60;
    new.price := 2500;
  else
    raise exception 'Nepoznata frizura';
  end if;

  if char_length(new.client_name) < 2 or char_length(new.client_name) > 48 then
    raise exception 'Upiši ime i prezime';
  end if;

  if new.phone !~ '^(0[0-9]{8,9}|\+381[0-9]{8,9})$' then
    raise exception 'Upiši ispravan broj telefona';
  end if;

  new.client_email := nullif(lower(btrim(coalesce(new.client_email, ''))), '');
  if tg_op = 'INSERT' and (new.client_email is null or new.client_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$') then
    raise exception 'Upiši ispravan email';
  end if;
  if new.client_email is not null and new.client_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'Upiši ispravan email';
  end if;

  if new.time !~ '^([01][0-9]|2[0-3]):(00|30)$' then
    raise exception 'Termin mora da počne na pola sata';
  end if;

  new.start_minute := split_part(new.time, ':', 1)::integer * 60
    + split_part(new.time, ':', 2)::integer;

  dow := extract(dow from new.booking_date)::integer;
  if dow = 0 then
    raise exception 'Nedeljom ne radimo';
  elsif dow = 6 then
    open_min := 9 * 60;
    close_min := 15 * 60;
  else
    open_min := 9 * 60;
    close_min := 19 * 60;
  end if;

  if new.start_minute < open_min or new.start_minute + new.minutes > close_min then
    raise exception 'Termin je van radnog vremena';
  end if;

  starts_at := (new.booking_date::timestamp + make_interval(mins => new.start_minute))
    at time zone 'Europe/Belgrade';
  if tg_op = 'INSERT' and starts_at <= now() then
    raise exception 'Taj termin je već prošao';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_prepare on public.bookings;
create trigger bookings_prepare
  before insert or update on public.bookings
  for each row
  execute function public.prepare_booking();

alter table public.bookings enable row level security;

grant select, insert, update, delete on public.bookings to anon, authenticated;

drop policy if exists "Čitanje termina" on public.bookings;
create policy "Čitanje termina"
  on public.bookings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Zakazivanje termina" on public.bookings;
create policy "Zakazivanje termina"
  on public.bookings
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Izmena termina" on public.bookings;
create policy "Izmena termina"
  on public.bookings
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Otkazivanje termina" on public.bookings;
create policy "Otkazivanje termina"
  on public.bookings
  for delete
  to anon, authenticated
  using (true);

notify pgrst, 'reload schema';
