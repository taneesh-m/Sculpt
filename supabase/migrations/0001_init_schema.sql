-- Core schema: profiles (extends auth.users), workouts, exercises, diet logs,
-- nutrition goals, progress tracking, chat history. RLS scopes every table to
-- its owning user via auth.uid().

create extension if not exists "uuid-ossp";

create table if not exists profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    email text unique not null,
    name text not null,
    avatar_url text,
    height_cm integer,
    weight_kg decimal(5,2),
    age integer,
    gender text check (gender in ('male', 'female', 'other')),
    activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
    fitness_goals text[],
    current_fitness_level text check (current_fitness_level in ('beginner', 'intermediate', 'advanced')),
    medical_conditions text[],
    dietary_restrictions text[],
    preferred_workout_duration integer, -- minutes
    workout_frequency integer, -- days per week
    available_equipment text[],
    weight_goal text check (weight_goal in ('lose', 'maintain', 'gain')),
    target_weight decimal(5,2),
    target_date date,
    body_fat_percentage decimal(4,2),
    muscle_mass decimal(5,2), -- kg
    measurements jsonb,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists workouts (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    name text not null,
    type text check (type in ('strength', 'cardio', 'flexibility', 'mixed')) not null,
    duration integer, -- minutes
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists exercises (
    id uuid default uuid_generate_v4() primary key,
    workout_id uuid references workouts(id) on delete cascade not null,
    name text not null,
    sets integer,
    reps integer,
    weight decimal(6,2), -- kg
    duration integer, -- seconds
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists diet_logs (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    food_name text not null,
    calories decimal(8,2) not null,
    protein decimal(6,2),
    carbs decimal(6,2),
    fat decimal(6,2),
    fiber decimal(6,2),
    meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
    serving_size text,
    notes text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists nutrition_goals (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade unique not null,
    daily_calories integer,
    daily_protein decimal(6,2),
    daily_carbs decimal(6,2),
    daily_fat decimal(6,2),
    daily_fiber decimal(6,2),
    weight_goal text check (weight_goal in ('lose', 'maintain', 'gain')),
    target_weight decimal(5,2),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists progress_tracking (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    weight decimal(5,2),
    body_fat_percentage decimal(4,2),
    muscle_mass decimal(5,2),
    measurements jsonb,
    progress_notes text,
    created_at timestamptz default now()
);

create table if not exists chat_history (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references profiles(id) on delete cascade not null,
    user_message text not null,
    ai_response text not null,
    created_at timestamptz default now()
);

create index if not exists idx_workouts_user_id on workouts(user_id);
create index if not exists idx_workouts_created_at on workouts(created_at);
create index if not exists idx_exercises_workout_id on exercises(workout_id);
create index if not exists idx_diet_logs_user_id on diet_logs(user_id);
create index if not exists idx_diet_logs_created_at on diet_logs(created_at);
create index if not exists idx_diet_logs_meal_type on diet_logs(meal_type);
create index if not exists idx_progress_tracking_user_id on progress_tracking(user_id);
create index if not exists idx_progress_tracking_created_at on progress_tracking(created_at);
create index if not exists idx_chat_history_user_id on chat_history(user_id);
create index if not exists idx_chat_history_created_at on chat_history(created_at);

alter table profiles enable row level security;
alter table workouts enable row level security;
alter table exercises enable row level security;
alter table diet_logs enable row level security;
alter table nutrition_goals enable row level security;
alter table progress_tracking enable row level security;
alter table chat_history enable row level security;

create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

create policy "Users can view own workouts" on workouts for select using (auth.uid() = user_id);
create policy "Users can insert own workouts" on workouts for insert with check (auth.uid() = user_id);
create policy "Users can update own workouts" on workouts for update using (auth.uid() = user_id);
create policy "Users can delete own workouts" on workouts for delete using (auth.uid() = user_id);

create policy "Users can view exercises from own workouts" on exercises for select using (
    exists (select 1 from workouts where workouts.id = exercises.workout_id and workouts.user_id = auth.uid())
);
create policy "Users can insert exercises to own workouts" on exercises for insert with check (
    exists (select 1 from workouts where workouts.id = exercises.workout_id and workouts.user_id = auth.uid())
);
create policy "Users can update exercises from own workouts" on exercises for update using (
    exists (select 1 from workouts where workouts.id = exercises.workout_id and workouts.user_id = auth.uid())
);
create policy "Users can delete exercises from own workouts" on exercises for delete using (
    exists (select 1 from workouts where workouts.id = exercises.workout_id and workouts.user_id = auth.uid())
);

create policy "Users can view own diet logs" on diet_logs for select using (auth.uid() = user_id);
create policy "Users can insert own diet logs" on diet_logs for insert with check (auth.uid() = user_id);
create policy "Users can update own diet logs" on diet_logs for update using (auth.uid() = user_id);
create policy "Users can delete own diet logs" on diet_logs for delete using (auth.uid() = user_id);

create policy "Users can view own nutrition goals" on nutrition_goals for select using (auth.uid() = user_id);
create policy "Users can insert own nutrition goals" on nutrition_goals for insert with check (auth.uid() = user_id);
create policy "Users can update own nutrition goals" on nutrition_goals for update using (auth.uid() = user_id);
create policy "Users can delete own nutrition goals" on nutrition_goals for delete using (auth.uid() = user_id);

create policy "Users can view own progress" on progress_tracking for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on progress_tracking for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on progress_tracking for update using (auth.uid() = user_id);
create policy "Users can delete own progress" on progress_tracking for delete using (auth.uid() = user_id);

create policy "Users can view own chat history" on chat_history for select using (auth.uid() = user_id);
create policy "Users can insert own chat history" on chat_history for insert with check (auth.uid() = user_id);
create policy "Users can delete own chat history" on chat_history for delete using (auth.uid() = user_id);

-- Auto-create a profile row on signup. Handles both email/password (no name
-- metadata) and Google OAuth (full_name/name/avatar_url in raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, name, avatar_url)
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'avatar_url'
    );
    return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at before update on profiles
    for each row execute function update_updated_at_column();
create trigger update_workouts_updated_at before update on workouts
    for each row execute function update_updated_at_column();
create trigger update_exercises_updated_at before update on exercises
    for each row execute function update_updated_at_column();
create trigger update_diet_logs_updated_at before update on diet_logs
    for each row execute function update_updated_at_column();
create trigger update_nutrition_goals_updated_at before update on nutrition_goals
    for each row execute function update_updated_at_column();
