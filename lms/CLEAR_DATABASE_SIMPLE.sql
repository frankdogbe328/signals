-- ============================================
-- SIMPLE DATABASE CLEAR - COPY AND PASTE THIS
-- ============================================

-- Delete all progress
DELETE FROM progress;

-- Delete all materials
DELETE FROM materials;

-- Delete all users
DELETE FROM users;

-- Delete all storage files
DELETE FROM storage.objects WHERE bucket_id = 'learning-materials';

-- Done! All test data is cleared.

