-- Supabase Storage Setup SQL
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- This creates a storage bucket for learning materials

-- 1. Create storage bucket for learning materials (if not exists)
-- Note: You may need to create this manually in Supabase Dashboard:
-- Go to: Storage → Create Bucket
-- Bucket Name: learning-materials
-- Public: Yes (so students can download files)
-- File Size Limit: 50MB (or as needed)
-- Allowed MIME Types: Leave empty for all types, or specify: application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,text/plain

-- 2. Create storage policy to allow public access for downloads
-- This allows anyone with the URL to download files (students can access materials)
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Public Access for Learning Materials" ON storage.objects;
CREATE POLICY "Public Access for Learning Materials"
ON storage.objects
FOR SELECT
USING (bucket_id = 'learning-materials');

-- 3. Create storage policy to allow authenticated users to upload
-- This allows lecturers to upload files (we'll handle auth at app level)
-- Since we're using custom auth, we'll use a policy that allows all inserts
-- For better security, you can restrict this further based on your needs
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Allow Uploads to Learning Materials" ON storage.objects;
CREATE POLICY "Allow Uploads to Learning Materials"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'learning-materials');

-- 4. Create storage policy to allow authenticated users to delete
-- This allows lecturers to delete files
-- Drop policy if it exists first
DROP POLICY IF EXISTS "Allow Deletes from Learning Materials" ON storage.objects;
CREATE POLICY "Allow Deletes from Learning Materials"
ON storage.objects
FOR DELETE
USING (bucket_id = 'learning-materials');

-- Note: If you get an error that policies already exist, you can drop them first:
-- DROP POLICY IF EXISTS "Public Access for Learning Materials" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow Uploads to Learning Materials" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow Deletes from Learning Materials" ON storage.objects;

-- IMPORTANT: After running this SQL:
-- 1. Go to Supabase Dashboard → Storage
-- 2. If bucket doesn't exist, click "Create Bucket"
-- 3. Name: learning-materials
-- 4. Public: Yes (checked)
-- 5. File size limit: 50MB (adjust as needed)
-- 6. Click "Create Bucket"
-- 7. The policies above will apply automatically

