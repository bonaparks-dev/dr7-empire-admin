-- Run this in Supabase SQL Editor to see the bookings table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'bookings'
ORDER BY 
    ordinal_position;
