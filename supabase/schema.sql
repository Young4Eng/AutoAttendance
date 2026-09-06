-- 출결메이트 1차. service_role은 브라우저에 두지 않는다.
-- Issue #58 CHECKs/RPCs: also see supabase/migrations/20260906120000_issue58_backend_checks.sql

create table if not exists roster (
  owner_id text not null,
  grade int not null,
  class int not null,
  number int not null,
  name text not null,
  primary key (owner_id, grade, class, number)
);

create table if not exists entries (
  owner_id text not null,
  date date not null,
  year int not null,
  grade int not null,
  class int not null,
  number int not null,
  name text not null,
  category text not null,
  type text not null,
  period int not null default 0,
  reason text not null default '',
  status text not null default 'draft',
  primary key (owner_id, date, grade, class, number, type, period)
);

alter table roster enable row level security;
alter table entries enable row level security;

create policy roster_own on roster
  for all using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

create policy entries_own on entries
  for all using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);


-- 학급 설정·명단 확장 (기능 갭)
create table if not exists class_settings (
  owner_id text primary key,
  grade int not null default 2,
  class int not null default 3,
  capacity int not null default 30
);
alter table class_settings enable row level security;
drop policy if exists class_settings_own on class_settings;
create policy class_settings_own on class_settings
  for all using (owner_id = auth.uid()::text)
  with check (owner_id = auth.uid()::text);

alter table roster add column if not exists status text not null default 'enrolled';
alter table roster add column if not exists note text not null default '';

-- ---------------------------------------------------------------------------
-- #58 entries CHECK (greenfield). Existing DBs: apply migrations/…_issue58_…
-- status keeps synced — data-contract + extension; #58 preview states are draft|queued|error
-- ---------------------------------------------------------------------------

alter table entries drop constraint if exists entries_category_check;
alter table entries add constraint entries_category_check
  check (category in ('illness', 'unexcused', 'other', 'recognized'));

alter table entries drop constraint if exists entries_type_check;
alter table entries add constraint entries_type_check
  check (type in ('absence', 'late', 'early_leave', 'result'));

alter table entries drop constraint if exists entries_status_check;
alter table entries add constraint entries_status_check
  check (status in ('draft', 'queued', 'error', 'synced'));

alter table entries drop constraint if exists entries_period_check;
alter table entries add constraint entries_period_check
  check (
    (type = 'absence' and period = 0)
    or (type <> 'absence' and period between 1 and 7)
  );

alter table entries drop constraint if exists entries_reason_other_check;
alter table entries add constraint entries_reason_other_check
  check (category <> 'other' or length(trim(reason)) > 0);

alter table entries drop constraint if exists entries_weekday_check;
alter table entries add constraint entries_weekday_check
  check (extract(isodow from date) between 1 and 5);

create index if not exists entries_owner_date_idx on entries (owner_id, date);

create or replace function aa_raise(code text)
returns void
language plpgsql
as $$
begin
  raise exception '%', code using errcode = 'P0001';
end;
$$;

create or replace function aa_validate_entry(
  p_type text,
  p_category text,
  p_period int,
  p_reason text,
  p_date date,
  p_status text default 'draft'
) returns void
language plpgsql
as $$
begin
  if p_type is null or p_type not in ('absence', 'late', 'early_leave', 'result') then
    perform aa_raise('bad_type');
  end if;
  if p_category is null or p_category not in ('illness', 'unexcused', 'other', 'recognized') then
    perform aa_raise('bad_category');
  end if;
  if p_status is null or p_status not in ('draft', 'queued', 'error', 'synced') then
    perform aa_raise('bad_status');
  end if;
  if p_type = 'absence' then
    if p_period is distinct from 0 then
      perform aa_raise('absence_period_must_be_0');
    end if;
  else
    if p_period is null or p_period < 1 or p_period > 7 then
      perform aa_raise('bad_period');
    end if;
  end if;
  if p_category = 'other' and length(trim(coalesce(p_reason, ''))) = 0 then
    perform aa_raise('reason_required');
  end if;
  if extract(isodow from p_date) not between 1 and 5 then
    perform aa_raise('weekend_not_allowed');
  end if;
end;
$$;

create or replace function replace_roster(rows jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid text := auth.uid()::text;
  r jsonb;
  v_grade int;
  v_class int;
  v_number int;
  v_name text;
  v_status text;
  v_note text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  if rows is null or jsonb_typeof(rows) <> 'array' then
    raise exception 'bad_rows';
  end if;

  delete from roster where owner_id = uid;

  for r in select * from jsonb_array_elements(rows)
  loop
    v_grade := (r->>'grade')::int;
    v_class := (r->>'class')::int;
    v_number := (r->>'number')::int;
    v_name := trim(coalesce(r->>'name', ''));
    v_status := coalesce(nullif(trim(r->>'status'), ''), 'enrolled');
    v_note := coalesce(r->>'note', '');
    if v_name = '' or v_grade is null or v_class is null or v_number is null then
      raise exception 'bad_roster_row';
    end if;
    if v_status not in ('enrolled', 'transferred') then
      v_status := 'enrolled';
    end if;
    insert into roster (owner_id, grade, class, number, name, status, note)
    values (uid, v_grade, v_class, v_number, v_name, v_status, v_note);
  end loop;
end;
$$;

revoke all on function replace_roster(jsonb) from public;
grant execute on function replace_roster(jsonb) to authenticated;

create or replace function upsert_entry(row jsonb)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid text := auth.uid()::text;
  v_date date;
  v_year int;
  v_grade int;
  v_class int;
  v_number int;
  v_name text;
  v_category text;
  v_type text;
  v_period int;
  v_reason text;
  v_status text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  v_date := (row->>'date')::date;
  v_year := coalesce((row->>'year')::int, extract(year from v_date)::int);
  v_grade := (row->>'grade')::int;
  v_class := (row->>'class')::int;
  v_number := (row->>'number')::int;
  v_name := trim(coalesce(row->>'name', ''));
  v_category := row->>'category';
  v_type := row->>'type';
  v_period := coalesce((row->>'period')::int, 0);
  v_reason := coalesce(row->>'reason', '');
  v_status := coalesce(nullif(trim(row->>'status'), ''), 'draft');

  if v_name = '' or v_number is null or v_grade is null or v_class is null then
    raise exception 'bad_entry_row';
  end if;

  perform aa_validate_entry(v_type, v_category, v_period, v_reason, v_date, v_status);

  insert into entries (
    owner_id, date, year, grade, class, number, name,
    category, type, period, reason, status
  ) values (
    uid, v_date, v_year, v_grade, v_class, v_number, v_name,
    v_category, v_type, v_period, v_reason, v_status
  )
  on conflict (owner_id, date, grade, class, number, type, period)
  do update set
    year = excluded.year,
    name = excluded.name,
    category = excluded.category,
    reason = excluded.reason,
    status = excluded.status;
end;
$$;

revoke all on function upsert_entry(jsonb) from public;
grant execute on function upsert_entry(jsonb) to authenticated;

create or replace function apply_repeat(
  p_grade int,
  p_class int,
  p_number int,
  p_name text,
  p_type text,
  p_category text,
  p_period int,
  p_reason text,
  p_start date,
  p_end date
)
returns jsonb
language plpgsql
security invoker
set search_path = public
as $$
declare
  uid text := auth.uid()::text;
  d date;
  dates date[] := array[]::date[];
  v_period int;
  v_name text;
  v_reason text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_start is null or p_end is null or p_start > p_end then
    raise exception 'bad_range';
  end if;

  v_name := trim(coalesce(p_name, ''));
  v_reason := coalesce(p_reason, '');
  if v_name = '' or p_number is null or p_grade is null or p_class is null then
    raise exception 'bad_entry_row';
  end if;

  v_period := case when p_type = 'absence' then 0 else coalesce(p_period, 0) end;

  if p_type is null or p_type not in ('absence', 'late', 'early_leave', 'result') then
    perform aa_raise('bad_type');
  end if;
  if p_category is null or p_category not in ('illness', 'unexcused', 'other', 'recognized') then
    perform aa_raise('bad_category');
  end if;
  if p_type = 'absence' then
    if v_period is distinct from 0 then
      perform aa_raise('absence_period_must_be_0');
    end if;
  else
    if v_period < 1 or v_period > 7 then
      perform aa_raise('bad_period');
    end if;
  end if;
  if p_category = 'other' and length(trim(v_reason)) = 0 then
    perform aa_raise('reason_required');
  end if;

  d := p_start;
  while d <= p_end loop
    if extract(isodow from d) between 1 and 5 then
      perform aa_validate_entry(p_type, p_category, v_period, v_reason, d, 'draft');
      insert into entries (
        owner_id, date, year, grade, class, number, name,
        category, type, period, reason, status
      ) values (
        uid, d, extract(year from d)::int, p_grade, p_class, p_number, v_name,
        p_category, p_type, v_period, v_reason, 'draft'
      )
      on conflict (owner_id, date, grade, class, number, type, period)
      do update set
        year = excluded.year,
        name = excluded.name,
        category = excluded.category,
        reason = excluded.reason,
        status = excluded.status;
      dates := array_append(dates, d);
    end if;
    d := d + 1;
  end loop;

  return jsonb_build_object(
    'dates', to_jsonb(dates),
    'count', coalesce(array_length(dates, 1), 0)
  );
end;
$$;

revoke all on function apply_repeat(int, int, int, text, text, text, int, text, date, date) from public;
grant execute on function apply_repeat(int, int, int, text, text, text, int, text, date, date) to authenticated;
