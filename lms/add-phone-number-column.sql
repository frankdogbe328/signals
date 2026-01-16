-- Add phone_number column to users table
-- This column stores phone numbers for students (required, Ghana format: +233XXXXXXXXX)

-- Add the column if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Create index for faster lookups (optional, but helpful for searches)
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Add comment to document the column
COMMENT ON COLUMN users.phone_number IS 'Phone number for students (Ghana format: +233XXXXXXXXX)';
