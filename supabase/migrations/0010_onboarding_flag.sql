-- Tracks whether a user has completed the initial profiling wizard. New rows
-- default to false (handle_new_user doesn't set it), so every new signup is
-- routed through /onboarding by the middleware until they finish.
alter table profiles
    add column if not exists onboarding_completed boolean not null default false;

-- Backfill: any existing profile that already has fitness goals recorded has
-- effectively been through profiling, so don't force those users to redo it.
update profiles
set onboarding_completed = true
where fitness_goals is not null and array_length(fitness_goals, 1) > 0;
