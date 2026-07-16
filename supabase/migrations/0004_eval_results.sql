-- Stores personalization eval results (phase 5) so the reported metric is
-- backed by durable, queryable data rather than a one-off script's stdout.
-- Written by a server-side eval script using the service role, not by
-- end users, so no user-facing RLS policy is needed -- RLS is still enabled
-- with no policies, which denies all access via the anon/authenticated roles
-- by default and keeps results readable only via the service role.

create table if not exists eval_runs (
    id uuid default uuid_generate_v4() primary key,
    run_at timestamptz default now(),
    variant text not null check (variant in ('baseline', 'profile_conditioned')),
    eval_case_id text not null,
    score numeric not null,
    judge_rationale text,
    raw_response text
);

create index if not exists idx_eval_runs_variant on eval_runs(variant);
create index if not exists idx_eval_runs_run_at on eval_runs(run_at);

alter table eval_runs enable row level security;
