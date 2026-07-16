-- Computes the user's current and longest consecutive-day activity streaks
-- from the events table, in SQL rather than pulling all rows to JS and
-- looping client-side.
create or replace function get_user_streaks(p_user_id uuid)
returns table(current_streak_days integer, longest_streak_days integer)
security invoker
as $$
  with activity_days as (
    select distinct date_trunc('day', created_at)::date as day
    from events
    where user_id = p_user_id
  ),
  -- Consecutive days share the same (day - row_number) value, a standard
  -- gaps-and-islands grouping trick.
  grouped as (
    select
      day,
      day - (row_number() over (order by day))::int * interval '1 day' as island
    from activity_days
  ),
  streaks as (
    select count(*)::int as streak_len, max(day) as streak_end
    from grouped
    group by island
  )
  select
    coalesce(
      (select streak_len from streaks where streak_end >= current_date - interval '1 day' order by streak_end desc limit 1),
      0
    ) as current_streak_days,
    coalesce((select max(streak_len) from streaks), 0) as longest_streak_days;
$$ language sql stable;

grant execute on function get_user_streaks(uuid) to authenticated;
