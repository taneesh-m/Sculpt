-- service_role bypasses RLS but, like any other role, still needs a
-- table-level GRANT before it can act on a table at all -- confirmed by
-- the eval script failing with "permission denied for table eval_runs"
-- even via the service-role client. Standard Supabase projects grant
-- service_role full access across the public schema by default; this
-- migration does the same explicitly, since these tables were created
-- outside that default bootstrap.

grant usage on schema public to service_role;

grant all on
    profiles,
    workouts,
    exercises,
    diet_logs,
    nutrition_goals,
    progress_tracking,
    chat_history,
    events,
    ai_plans,
    eval_runs
to service_role;

grant all on user_daily_nutrition_summary to service_role;
