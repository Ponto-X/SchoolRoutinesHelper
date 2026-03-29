-- Tabelas do School Routines Helper
-- Execute no SQL Editor do Supabase

-- Tasks
create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text default '',
  assignee text not null,
  status text not null default 'pendente'
    check (status in ('pendente','em_andamento','concluida','atrasada')),
  due_date text not null,
  created_at timestamptz default now()
);

-- Events
create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date text not null,
  created_at timestamptz default now()
);

-- Checklist items
create table if not exists checklist_items (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events(id) on delete cascade,
  text text not null,
  done boolean default false,
  created_at timestamptz default now()
);

-- Contacts
create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  parent_name text not null,
  phone text not null,
  turma text not null,
  created_at timestamptz default now()
);

-- Absences
create table if not exists absences (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  turma text not null,
  date text not null,
  reason text default '',
  notified boolean default false,
  notified_at timestamptz,
  created_at timestamptz default now()
);

-- Message logs
create table if not exists message_logs (
  id uuid primary key default gen_random_uuid(),
  recipient text not null,
  message text not null,
  template text not null,
  sent_at timestamptz default now()
);

-- RLS: habilita mas permite tudo (app tem anon key, ajustar depois conforme necessidade)
alter table tasks enable row level security;
alter table events enable row level security;
alter table checklist_items enable row level security;
alter table contacts enable row level security;
alter table absences enable row level security;
alter table message_logs enable row level security;

create policy "allow all tasks" on tasks for all using (true) with check (true);
create policy "allow all events" on events for all using (true) with check (true);
create policy "allow all checklist" on checklist_items for all using (true) with check (true);
create policy "allow all contacts" on contacts for all using (true) with check (true);
create policy "allow all absences" on absences for all using (true) with check (true);
create policy "allow all message_logs" on message_logs for all using (true) with check (true);
