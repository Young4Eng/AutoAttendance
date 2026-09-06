-- Hotfix: upsert_entry(row jsonb) fails in Supabase SQL Editor because `row` is reserved.
-- Rename parameter to p_row. Authenticated-only grants (match #62).
-- Already-applied DBs: run this migration. Greenfield: 20260906120000 also uses p_row
-- (rewritten by #64), but DBs that already applied the old row signature still need this.

drop function if exists upsert_entry(jsonb);

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
revoke all on function upsert_entry(jsonb) from anon;
grant execute on function upsert_entry(jsonb) to authenticated;
