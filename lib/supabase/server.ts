import { createClient } from '@supabase/supabase-js';

// Service-role client for server-only code (route handlers, webhooks).
// Never import this from a Client Component — the key must not reach the browser.
//
// Supports both the classic Supabase key names (SUPABASE_URL /
// SUPABASE_SERVICE_ROLE_KEY) and the newer sb_publishable_/sb_secret_ key
// format (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SECRET_KEY) — the secret key
// carries the same RLS-bypass privileges the service role key did.
export function getSupabaseServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !secretKey) {
    throw new Error(
      'Missing Supabase credentials — set SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (or NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY)'
    );
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false },
  });
}
