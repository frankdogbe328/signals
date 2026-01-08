# How to Setup Supabase Storage for File Uploads

## Overview
The LMS now uses Supabase Storage to store uploaded files instead of storing them as base64 in the database. This provides:
- ✅ Faster uploads and downloads
- ✅ Support for larger files (up to 50MB)
- ✅ Better performance
- ✅ Reduced database size

## Setup Steps

### 1. Create Storage Bucket
1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **Storage** in the left sidebar
4. Click **"Create Bucket"** button
5. Fill in the form:
   - **Name:** `learning-materials`
   - **Public:** ✅ **Yes** (checked) - This allows students to download files
   - **File size limit:** `50MB` (or as needed)
   - **Allowed MIME types:** Leave empty for all types, or specify:
     - `application/pdf`
     - `image/*`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-powerpoint`
     - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
     - `text/plain`
6. Click **"Create Bucket"**

### 2. Run Storage Policies SQL
1. Go to **SQL Editor** in Supabase Dashboard
2. Click **New Query**
3. Copy and paste the contents of `supabase-storage-setup.sql`
4. Click **Run** (or press Ctrl+Enter)

This creates the policies that:
- Allow public access to download files
- Allow authenticated users to upload files
- Allow authenticated users to delete files

### 3. Verify Setup
After setup, you can verify by:
1. Upload a file through the lecturer dashboard
2. Check **Storage** → **learning-materials** bucket
3. You should see the uploaded file there
4. Students should be able to download the file

## How It Works

### For Lecturers:
1. Select a file to upload (PDF, image, Word, PowerPoint, etc.)
2. File is uploaded to Supabase Storage
3. A public URL is generated and stored in the database
4. Original file name and type are preserved

### For Students:
1. When viewing a material, the system uses the storage URL
2. Files download directly from Supabase Storage
3. Original file format is preserved
4. Downloads are faster than base64 storage

## Benefits Over Base64 Storage

| Feature | Base64 (Old) | Supabase Storage (New) |
|---------|-------------|------------------------|
| **Max File Size** | ~10MB (database limit) | 50MB+ (configurable) |
| **Upload Speed** | Slow (must encode) | Fast (direct upload) |
| **Download Speed** | Slow (must decode) | Fast (direct download) |
| **Database Size** | Large (base64 bloats) | Small (only URLs stored) |
| **Performance** | Poor for large files | Excellent for all sizes |

## Troubleshooting

### Files Not Uploading
1. Check that the bucket `learning-materials` exists
2. Verify bucket is set to **Public**
3. Check that storage policies are applied (run SQL again)
4. Check browser console for error messages

### Students Can't Download Files
1. Verify bucket is **Public**
2. Check that the "Public Access for Learning Materials" policy exists
3. Test the file URL directly in browser

### Files Uploaded But URL Not Stored
1. Check browser console for errors
2. Verify Supabase client is initialized
3. Check that `createMaterialInSupabase` function is working

## Migration from Base64

Existing materials stored as base64 will continue to work. New uploads will use Supabase Storage. To migrate existing files:

1. Re-upload the file through the lecturer dashboard
2. The system will automatically use Supabase Storage
3. Old base64 data will be ignored if storage URL exists

## Storage Costs

Supabase Free Tier includes:
- 1 GB of file storage
- 2 GB bandwidth per month

This is usually enough for many learning materials. Monitor usage in Supabase Dashboard → Storage → Usage.

