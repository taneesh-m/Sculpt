# Database Setup Guide

## Step 1: Apply Database Schema (Safe Version)

Since you encountered the "policy already exists" error, use the safe version of the schema:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Navigate to the **SQL Editor** in the left sidebar
3. Copy and paste the contents of `backend/supabase-schema-safe.sql` into the SQL editor
4. Click **Run** to execute the schema

This safe version will:
- ✅ Check for existing policies before creating them
- ✅ Use `CREATE TABLE IF NOT EXISTS` for tables
- ✅ Use `CREATE INDEX IF NOT EXISTS` for indexes
- ✅ Drop and recreate triggers safely
- ✅ Handle existing objects gracefully

## Step 2: Verify Tables Created

After running the schema, you should see these tables created:
- `profiles`
- `workouts`
- `exercises`
- `diet_logs`
- `nutrition_goals`
- `progress_tracking`
- `chat_history`

## Step 3: Check RLS Policies

The schema also creates Row Level Security (RLS) policies for each table. You can verify these in the **Authentication > Policies** section of your Supabase dashboard.

## Step 4: Test the Setup

After applying the schema, the registration and profile creation should work properly.

## Troubleshooting

If you encounter issues:

1. **Check if tables exist**: Go to **Table Editor** in Supabase dashboard
2. **Check RLS policies**: Go to **Authentication > Policies**
3. **Check triggers**: The schema creates a trigger `on_auth_user_created` that should automatically create profiles

## Alternative: Manual Schema Application

If you prefer to run the schema manually, you can copy the contents of `backend/supabase-schema-safe.sql` and run it in your Supabase SQL editor.

## What the Safe Schema Does

The safe schema includes:
- **Policy checks**: Uses `IF NOT EXISTS` logic to avoid duplicate policy errors
- **Table safety**: Uses `CREATE TABLE IF NOT EXISTS` to avoid table conflicts
- **Trigger safety**: Drops existing triggers before recreating them
- **Index safety**: Uses `CREATE INDEX IF NOT EXISTS` for indexes

This should resolve the "policy already exists" error you encountered! 