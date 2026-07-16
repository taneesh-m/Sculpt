-- Daily nutrition summary, aggregated in Postgres rather than pulled row-by-row
-- to the app on every dashboard load. Backed by a composite index matching the
-- view's user+day access pattern (the two existing single-column indexes on
-- diet_logs can't be combined as efficiently for this range+equality query).

create index if not exists idx_diet_logs_user_created on diet_logs(user_id, created_at);

-- security_invoker is required here: without it, Postgres evaluates the view
-- with the view owner's privileges (migrations run as a role that bypasses
-- RLS), which would leak every user's rows regardless of auth.uid().
create view user_daily_nutrition_summary
with (security_invoker = true)
as
select
    user_id,
    date_trunc('day', created_at) as day,
    sum(calories) as total_calories,
    sum(protein) as total_protein,
    sum(carbs) as total_carbs,
    sum(fat) as total_fat,
    sum(fiber) as total_fiber,
    count(*) as entry_count
from diet_logs
group by user_id, date_trunc('day', created_at);
