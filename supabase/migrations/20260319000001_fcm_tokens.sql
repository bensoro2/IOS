create table if not exists public.fcm_tokens (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  token text not null,
  created_at timestamp with time zone default now(),
  constraint fcm_tokens_user_token_unique unique (user_id, token)
);

alter table public.fcm_tokens enable row level security;

create policy "Users can manage their own FCM tokens"
  on public.fcm_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
