# LMS Database Scripts

This folder contains all SQL scripts related to the Learning Management System (LMS) database setup and maintenance.

## 📋 Files

### Setup Scripts
- **`supabase-database-setup.sql`** - Main database setup (users, materials, progress tables)
- **`supabase-storage-setup.sql`** - Storage bucket setup for file uploads
- **`supabase-complete-setup.sql`** - Complete setup script (all-in-one)

### Maintenance Scripts
- **`supabase-clear-all-data.sql`** - Clear all data from database
- **`supabase-clear-all-data-complete.sql`** - Complete data clearing (including storage)
- **`supabase-clear-demo-accounts-only.sql`** - Clear only demo accounts
- **`supabase-courses-readable-view.sql`** - Create view for readable course display
- **`supabase-disable-rls.sql`** - Disable Row Level Security (for custom auth)
- **`supabase-fix-role-constraint-final.sql`** - Fix role constraint issues
- **`supabase-organize-by-role.sql`** - Organize users by role
- **`CLEAR_DATABASE_SIMPLE.sql`** - Simple database clearing script

## 🚀 Usage

1. **Initial Setup:**
   - Run `supabase-database-setup.sql` first
   - Then run `supabase-storage-setup.sql` for file uploads
   - Or use `supabase-complete-setup.sql` for all-in-one setup

2. **Maintenance:**
   - Use clearing scripts when needed to reset data
   - Use other scripts as needed for specific tasks

## ⚠️ Important Notes

- Always backup your database before running clearing scripts
- Test scripts in a development environment first
- Some scripts may require specific permissions

## 📖 Documentation

For detailed instructions, see the `docs/` folder in the root directory.

