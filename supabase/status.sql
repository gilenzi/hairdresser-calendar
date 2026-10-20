alter table public.bookings
  add column if not exists status text not null default 'potvrden';

alter table public.bookings drop constraint if exists bookings_status_check;
alter table public.bookings
  add constraint bookings_status_check check (status in ('potvrden', 'odbijen'));

alter table public.bookings drop constraint if exists bookings_no_overlap;
alter table public.bookings
  add constraint bookings_no_overlap
  exclude using gist (
    booking_date with =,
    int4range(start_minute, start_minute + minutes, '[)') with &&
  ) where (status = 'potvrden');

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

grant update on public.bookings to anon, authenticated;

drop policy if exists "Izmena termina" on public.bookings;
create policy "Izmena termina"
  on public.bookings
  for update
  to anon, authenticated
  using (true)
  with check (true);

notify pgrst, 'reload schema';
