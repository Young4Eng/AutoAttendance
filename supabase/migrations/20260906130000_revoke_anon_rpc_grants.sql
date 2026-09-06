-- Follow-up to #58/#61: revoke anon execute on RPCs; authenticated only.
revoke execute on function replace_roster(jsonb) from anon;
revoke execute on function upsert_entry(jsonb) from anon;
revoke execute on function apply_repeat(int, int, int, text, text, text, int, text, date, date) from anon;

grant execute on function replace_roster(jsonb) to authenticated;
grant execute on function upsert_entry(jsonb) to authenticated;
grant execute on function apply_repeat(int, int, int, text, text, text, int, text, date, date) to authenticated;
