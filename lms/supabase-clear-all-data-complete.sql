-- ============================================
-- COMPLETE DATABASE CLEAR - ALL TEST DATA
-- Run this in Supabase SQL Editor
-- WARNING: This will delete ALL users, materials, progress, and storage files!
-- ============================================

-- Step 1: Delete all progress records (this must be done first due to foreign keys)
DELETE FROM progress;

-- Step 2: Delete all materials (this will also delete related progress via CASCADE)
DELETE FROM materials;

-- Step 3: Delete all users (this will also delete related progress via CASCADE)
DELETE FROM users;

-- Step 4: Clear all files from Supabase Storage
-- This deletes all files in the learning-materials bucket
DO $$
DECLARE
    file_record RECORD;
BEGIN
    -- Delete all files from the learning-materials bucket
    FOR file_record IN 
        SELECT name, bucket_id 
        FROM storage.objects 
        WHERE bucket_id = 'learning-materials'
    LOOP
        DELETE FROM storage.objects 
        WHERE bucket_id = 'learning-materials' 
        AND name = file_record.name;
    END LOOP;
END $$;

-- Step 5: Verify all tables are empty
-- Uncomment the lines below to verify after running:
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_materials FROM materials;
-- SELECT COUNT(*) as total_progress FROM progress;
-- SELECT COUNT(*) as total_files FROM storage.objects WHERE bucket_id = 'learning-materials';

-- ============================================
-- All data cleared! The system is now ready for fresh testing.
-- ============================================

