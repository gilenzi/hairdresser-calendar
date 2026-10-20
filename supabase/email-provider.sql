-- Sends the customer confirmation and a notice to the barber.
-- The Brevo API key lives in Supabase Vault under the name brevo_api_key.

create or replace function public.email_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  api_key text;
  when_label text;
  customer_text text;
  barber_text text;
begin
  if new.status is distinct from 'potvrden' or new.client_email is null then
    return new;
  end if;

  select decrypted_secret into api_key
  from vault.decrypted_secrets
  where name = 'brevo_api_key'
  limit 1;

  if api_key is null or btrim(api_key) = '' then
    return new;
  end if;

  when_label := to_char(new.booking_date, 'DD.MM.YYYY') || ' u ' || new.time;
  customer_text := 'Zdravo ' || new.client_name || E',\n\n'
    || 'tvoj termin u REZ-u je zakazan.' || E'\n'
    || 'Frizura: ' || new.style_name || E'\n'
    || 'Termin: ' || when_label || E'\n'
    || 'Trajanje: ' || new.minutes || E' min\n\n'
    || 'Ako ne možeš da dođeš, javi se na 065 123 4567.';
  barber_text := 'Nova rezervacija.' || E'\n\n'
    || 'Frizura: ' || new.style_name || E'\n'
    || 'Termin: ' || when_label || E'\n'
    || 'Trajanje: ' || new.minutes || E' min\n'
    || 'Ime: ' || new.client_name || E'\n'
    || 'Telefon: ' || new.phone || E'\n'
    || 'Email: ' || new.client_email;

  if new.client_email is distinct from 'jasamtajogy@gmail.com' then
    perform net.http_post(
      url := 'https://api.brevo.com/v3/smtp/email',
      body := jsonb_build_object(
        'sender', jsonb_build_object('name', 'REZ', 'email', 'jasamtajogy@gmail.com'),
        'to', jsonb_build_array(jsonb_build_object('email', new.client_email, 'name', new.client_name)),
        'subject', 'Termin je zakazan — ' || when_label,
        'textContent', customer_text
      ),
      headers := jsonb_build_object(
        'accept', 'application/json',
        'content-type', 'application/json',
        'api-key', api_key
      ),
      timeout_milliseconds := 8000
    );
  end if;

  perform net.http_post(
    url := 'https://api.brevo.com/v3/smtp/email',
    body := jsonb_build_object(
      'sender', jsonb_build_object('name', 'REZ', 'email', 'jasamtajogy@gmail.com'),
      'to', jsonb_build_array(jsonb_build_object('email', 'jasamtajogy@gmail.com', 'name', 'REZ')),
      'replyTo', jsonb_build_object('email', new.client_email, 'name', new.client_name),
      'subject', 'Nova rezervacija — ' || when_label,
      'textContent', barber_text
    ),
    headers := jsonb_build_object(
      'accept', 'application/json',
      'content-type', 'application/json',
      'api-key', api_key
    ),
    timeout_milliseconds := 8000
  );

  return new;
end;
$$;
