create table if not exists document_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  conversation_id text,
  content_json jsonb not null,
  format text not null,
  version integer default 1,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table document_sessions enable row level security;

create policy "Users can view their own document sessions"
  on document_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own document sessions"
  on document_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own document sessions"
  on document_sessions for update
  using (auth.uid() = user_id);
