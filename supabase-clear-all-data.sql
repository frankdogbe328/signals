-- ============================================
-- CLEAR ALL DATA FROM SUPABASE
-- Run this in Supabase SQL Editor to prepare for testing
-- WARNING: This will delete ALL users, materials, and progress!
-- ============================================

-- Step 1: Delete all progress records (this must be done first due to foreign keys)
DELETE FROM progress;

-- Step 2: Delete all materials (this will also delete related progress via CASCADE)
DELETE FROM materials;

-- Step 3: Delete all users (this will also delete related progress via CASCADE)
DELETE FROM users;

-- Step 4: Verify all tables are empty
-- SELECT COUNT(*) as total_users FROM users;
-- SELECT COUNT(*) as total_materials FROM materials;
-- SELECT COUNT(*) as total_progress FROM progress;

-- ============================================
-- All data cleared! The system is now ready for fresh testing.
-- ============================================

