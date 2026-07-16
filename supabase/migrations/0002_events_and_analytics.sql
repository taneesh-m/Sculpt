-- Product-analytics event log. One row per meaningful user action, used by
-- the progress/streak logic (phase 6) and any future analytics dashboard.

create table if not exists events (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    event_type text not null check (event_type in (
        'workout_logged',
        'diet_logged',
        'chat_message_sent',
        'plan_generated'
    )),
    metadata jsonb default '{}'::jsonb,
    created_at timestamptz default now()
);

create index if not exists idx_events_user_id on events(user_id);
create index if not exists idx_events_user_created on events(user_id, created_at);
create index if not exists idx_events_type on events(event_type);

alter table events enable row level security;

create policy "Users can view own events" on events for select using (auth.uid() = user_id);
create policy "Users can insert own events" on events for insert with check (auth.uid() = user_id);
