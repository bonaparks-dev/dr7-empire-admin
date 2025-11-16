-- Run this in Supabase SQL Editor to check the bookings table schema

-- Check table structure
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bookings'
ORDER BY ordinal_position;

-- Check constraints
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'bookings'::regclass;

-- Check triggers
SELECT
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bookings';

-- Check if there's an issue with ID generation
SELECT column_name, column_default
FROM information_schema.columns
WHERE table_name = 'bookings' AND column_name = 'id';
