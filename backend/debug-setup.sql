-- Debug script to check and fix database issues

-- 1. Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'workouts', 'diet_logs', 'chat_history');

-- 2. Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'workouts', 'diet_logs', 'chat_history');

-- 3. Check if policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'workouts', 'diet_logs', 'chat_history');

-- 4. Check if trigger exists
SELECT trigger_name, event_manipulation, event_object_table, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles';

-- 5. Test inserting a profile (run this manually)
-- INSERT INTO profiles (id, email, name, created_at) 
-- VALUES ('test-user-id', 'test@example.com', 'Test User', NOW());

-- 6. Check for any constraint violations
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass;

-- 7. Disable trigger temporarily if causing issues
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 8. Re-enable trigger after testing
-- CREATE TRIGGER on_auth_user_created
--     AFTER INSERT ON auth.users
--     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 