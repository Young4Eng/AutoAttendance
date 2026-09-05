-- 출결메이트 1차. service_role은 브라우저에 두지 않는다.

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
