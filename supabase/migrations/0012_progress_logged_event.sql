-- `POST /api/progress` tracks a 'progress_logged' event, which the original
-- events check constraint didn't allow. trackEvent is fire-and-forget, so
-- without this the insert would fail silently on every check-in and progress
-- would be missing from the event stream.
alter table events drop constraint if exists events_event_type_check;

alter table events
    add constraint events_event_type_check check (event_type in (
        'workout_logged',
        'diet_logged',
        'progress_logged',
        'chat_message_sent',
        'plan_generated'
    ));
