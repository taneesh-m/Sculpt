-- AI-generated workout/meal plans (phase 4's structured-output tools), kept
-- separate from workouts/diet_logs since a "plan" is a suggestion, not
-- something the user has actually done -- the UI treats these as distinct
-- concepts (separate tabs).

create table if not exists ai_plans (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    plan_type text not null check (plan_type in ('workout', 'meal')),
    payload jsonb not null,
    created_at timestamptz default now()
);

create index if not exists idx_ai_plans_user_id on ai_plans(user_id);
create index if not exists idx_ai_plans_user_created on ai_plans(user_id, created_at);

alter table ai_plans enable row level security;

create policy "Users can view own ai plans" on ai_plans for select using (auth.uid() = user_id);
create policy "Users can insert own ai plans" on ai_plans for insert with check (auth.uid() = user_id);
create policy "Users can delete own ai plans" on ai_plans for delete using (auth.uid() = user_id);
