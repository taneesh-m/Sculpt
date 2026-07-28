-- Remembers the user's preferred measurement system for display. All height
-- and weight values are still stored canonically (cm / kg); this only drives
-- how the UI shows and collects them.
alter table profiles
    add column if not exists unit_system text not null default 'metric'
        check (unit_system in ('metric', 'imperial'));
