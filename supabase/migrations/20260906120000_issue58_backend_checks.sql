-- Issue #58 / docs/BACKEND.md 1차
-- CHECK + replace_roster + upsert_entry + apply_repeat
-- status: draft|queued|error per #58; also allow synced (data-contract + extension already use it)
-- Apply in Supabase SQL editor or CLI when project is available. CI does not apply automatically.

-- ---------------------------------------------------------------------------
-- 1) entries CHECK constraints
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

-- Weekend reject (ISODOW Mon=1 .. Sun=7). No documented exception for 1차.
alter table entries drop constraint if exists entries_weekday_check;
alter table entries add constraint entries_weekday_check
  check (extract(isodow from date) between 1 and 5);

create index if not exists entries_owner_date_idx on entries (owner_id, date);

-- ---------------------------------------------------------------------------
-- 2) Shared validators (RPC error codes match BACKEND.md)
-- ---------------------------------------------------------------------------

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

-- ---------------------------------------------------------------------------
-- 3) replace_roster(rows jsonb) — one transaction; failure keeps previous roster
-- ---------------------------------------------------------------------------

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
grant execute on function replace_roster(jsonb) to anon;

-- ---------------------------------------------------------------------------
-- 4) upsert_entry(p_row jsonb) — #55 rules + named error codes
-- ---------------------------------------------------------------------------

create or replace function upsert_entry(p_row jsonb)
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

  v_date := (p_row->>'date')::date;
  v_year := coalesce((p_row->>'year')::int, extract(year from v_date)::int);
  v_grade := (p_row->>'grade')::int;
  v_class := (p_row->>'class')::int;
  v_number := (p_row->>'number')::int;
  v_name := trim(coalesce(p_row->>'name', ''));
  v_category := p_row->>'category';
  v_type := p_row->>'type';
  v_period := coalesce((p_row->>'period')::int, 0);
  v_reason := coalesce(p_row->>'reason', '');
  v_status := coalesce(nullif(trim(p_row->>'status'), ''), 'draft');

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
grant execute on function upsert_entry(jsonb) to anon;

-- ---------------------------------------------------------------------------
-- 5) apply_repeat — weekdays only, all-or-nothing, upsert same keys
-- ---------------------------------------------------------------------------

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

  -- Template checks (weekend checked per date below)
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
grant execute on function apply_repeat(int, int, int, text, text, text, int, text, date, date) to anon;
