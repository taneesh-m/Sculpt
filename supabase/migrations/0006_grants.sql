-- RLS policies restrict *which rows* a role can see, but PostgREST also
-- requires a table-level GRANT before it will let a role attempt the
-- operation at all. Local/hosted Supabase auto-grants this for tables
-- created through Studio, but not for tables created via raw migrations,
-- so it must be done explicitly here.

grant usage on schema public to authenticated;

grant select, insert, update, delete on
    profiles,
    workouts,
    exercises,
    diet_logs,
    nutrition_goals,
    progress_tracking,
    chat_history,
    events,
    ai_plans
to authenticated;

grant select on user_daily_nutrition_summary to authenticated;

-- eval_runs is written only by the offline eval script via the service role
-- (which bypasses grants and RLS entirely), so no authenticated grant here.
