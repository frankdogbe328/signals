# Supabase Setup Guide for Signal Training School LMS

## Why Supabase?
- ✅ **No credit card required**
- ✅ Free tier available
- ✅ PostgreSQL database (powerful)
- ✅ Built-in authentication
- ✅ File storage included
- ✅ Works with HTML/CSS/JS

## Step 1: Create Supabase Account

1. **Go to:** https://supabase.com
2. Click **"Start your project"** or **"Sign up"** (top right)
3. **Sign up with GitHub** (recommended) or email
   - If you don't have GitHub, create one at https://github.com (free)
   - Or use email signup
4. Verify your email if needed

## Step 2: Create a New Project

1. Once logged in, click **"New Project"** button
2. **Organization:** Create new or select existing
3. **Project details:**
   - **Name:** `signal-training-school-lms` (or any name)
   - **Database Password:** Create a strong password (save it!)
   - **Region:** Choose closest to Ghana:
     - **Best:** `West Europe (Ireland)` or `North Europe (Frankfurt)`
     - **Alternative:** `US East (North Virginia)` or `Asia Pacific (Singapore)`
4. Click **"Create new project"**
5. Wait 2-3 minutes for project to be created

## Step 3: Get Your Supabase Credentials

1. In your project dashboard, click **"Settings"** (gear icon) in left menu
2. Click **"API"** in the settings menu
3. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string starting with `eyJ...`)
   - **service_role key** (keep this secret!)

4. **Copy these values** - you'll need them:
   ```javascript
   const supabaseUrl = 'https://xxxxx.supabase.co'
   const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   ```

## Step 4: Enable Authentication

1. Click **"Authentication"** in left menu
2. Click **"Providers"** tab
3. **Email** provider is enabled by default ✅
4. You can disable other providers if you want (optional)

## Step 5: Create Database Tables

We need to create tables for:
- `users` - Store user accounts
- `materials` - Store learning materials
- `progress` - Store student progress

**I'll create a SQL script for you to run** (see next section)

## Step 6: Set Up Storage (for file uploads)

1. Click **"Storage"** in left menu
2. Click **"Create a new bucket"**
3. **Name:** `materials` (or `learning-materials`)
4. **Public bucket:** Toggle ON (so files can be accessed)
5. Click **"Create bucket"**

## Step 7: Set Up Storage Policies

1. In Storage, click on your bucket (e.g., `materials` or `learning-materials`)
2. Go to **"Policies"** tab
3. Click **"New Policy"**
4. Select **"For full customization"**
5. **Policy name:** `Allow authenticated uploads`
6. **Allowed operation:** Select all (SELECT, INSERT, UPDATE, DELETE)
7. **Policy definition:** Use this SQL (replace `materials` with your bucket name):
   ```sql
   bucket_id = 'materials'
   ```
8. **WITH CHECK expression:** Use this:
   ```sql
   bucket_id = 'materials' AND auth.role() = 'authenticated'
   ```
9. Click **"Review"** then **"Save policy"**

**OR use the simpler method:**
1. In Storage → Policies
2. Click **"New Policy"**
3. Select **"Create a policy from scratch"**
4. **Policy name:** `Allow authenticated users`
5. **Allowed operation:** Check all boxes (SELECT, INSERT, UPDATE, DELETE)
6. **Policy definition:** 
   ```sql
   bucket_id = 'materials'
   ```
7. **WITH CHECK:**
   ```sql
   bucket_id = 'materials' AND auth.role() = 'authenticated'
   ```
8. Click **"Save policy"**

**Note:** Replace `'materials'` with your actual bucket name (e.g., `'learning-materials'` if that's what you named it)

## Next Steps

After you complete these steps and get your credentials:
1. Share your `supabaseUrl` and `supabaseAnonKey`
2. I'll integrate Supabase into your codebase
3. I'll create the database tables for you
4. Your system will work across all devices!

## Free Tier Limits

- ✅ 500 MB database
- ✅ 2 GB file storage
- ✅ 2 million API requests/month
- ✅ 50,000 monthly active users
- ✅ No credit card required!

## Important Notes

- **Database Password:** Save it! You'll need it if you want to access the database directly
- **API Keys:** Keep your `service_role` key secret (don't share it)
- **Region:** Once set, you can't change it easily, so choose carefully

Once you have your credentials, let me know and I'll integrate Supabase into your code!

