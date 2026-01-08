# Vercel Deployment - Video Background Setup

## Issue
The `gif.mp4` file is not being deployed to Vercel, causing a 404 error and black background.

## Solution

### Step 1: Add the Video File
1. Place your `gif.mp4` file in the **root directory** of your project (same level as `index.html`)
2. Make sure the filename is exactly `gif.mp4` (case-sensitive)

### Step 2: Add to Git
```bash
git add gif.mp4
git commit -m "Add background video file"
git push origin main
```

### Step 3: Verify File Size
- If the file is larger than 100MB, Git/GitHub may reject it
- Vercel has a 100MB file size limit per file
- If your video is too large, consider:
  - Compressing the video
  - Using a video hosting service (YouTube, Vimeo, Cloudinary)
  - Hosting it on Supabase Storage

### Step 4: Redeploy on Vercel
- Vercel will automatically redeploy when you push to GitHub
- Or manually trigger a redeploy from the Vercel dashboard

## Alternative: Use Supabase Storage (Recommended for Large Files)

If your video file is large, upload it to Supabase Storage and update the video source:

1. Upload `gif.mp4` to Supabase Storage bucket `learning-materials`
2. Get the public URL from Supabase
3. Update `index.html`:
```html
<source src="YOUR_SUPABASE_STORAGE_URL" type="video/mp4">
```

## Current Status
- ✅ Fallback gradient background is working (blue gradient shows when video fails)
- ❌ Video file needs to be added to the repository

