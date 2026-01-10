# CSRF Validation Edge Function

This Supabase Edge Function provides server-side CSRF token validation.

## Setup

1. Deploy to Supabase:
   ```bash
   supabase functions deploy csrf-validate
   ```

2. Set environment variables in Supabase Dashboard:
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key (for admin operations)

## Usage

Call this function from your client-side code before submitting forms:

```javascript
async function validateCSRFToken(token) {
  const response = await fetch('https://YOUR_PROJECT.supabase.co/functions/v1/csrf-validate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'x-csrf-token': token
    },
    body: JSON.stringify({})
  });
  
  const result = await response.json();
  return result.valid;
}
```

## Notes

- This is a basic implementation
- For production, implement proper session/CSRF token storage in a database table
- Consider rate limiting to prevent abuse
- Add logging for security monitoring
