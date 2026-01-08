-- Disable Row Level Security (RLS) for custom authentication
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Since we're using custom username/password auth (not Supabase Auth),
-- we'll disable RLS and handle security at the application level

ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE progress DISABLE ROW LEVEL SECURITY;

-- Note: RLS is disabled because we're using custom authentication.
-- Security is handled at the application level in JavaScript.

