-- handle_new_user() only sets id/email/name/avatar_url on signup, leaving
-- the text[] columns NULL rather than empty. The client always treats them
-- as arrays (e.g. settings.fitness_goals.map(...)), which crashes for every
-- newly-created profile. Default to '{}' and backfill existing NULL rows.

alter table profiles
    alter column fitness_goals set default '{}',
    alter column medical_conditions set default '{}',
    alter column dietary_restrictions set default '{}',
    alter column available_equipment set default '{}';

update profiles set fitness_goals = '{}' where fitness_goals is null;
update profiles set medical_conditions = '{}' where medical_conditions is null;
update profiles set dietary_restrictions = '{}' where dietary_restrictions is null;
update profiles set available_equipment = '{}' where available_equipment is null;
