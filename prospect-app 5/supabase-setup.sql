-- Paste this whole block into Supabase's SQL Editor and click "Run".
-- It creates the one table the app uses to sync your prospects across devices.

create table if not exists kv (
  k text primary key,
  value jsonb,
  updated_at timestamptz default now()
);

-- Allow the app to read/write (single-user app; anon key access).
alter table kv enable row level security;

create policy "allow all" on kv
  for all
  using (true)
  with check (true);
