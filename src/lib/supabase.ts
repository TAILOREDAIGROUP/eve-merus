import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServerClient } from '@/lib/supabase/server';

/**
 * Get a Supabase client scoped to the current user session (via cookies).
 * Used in API routes and server components. Respects RLS.
 * Creates a new client per call since each request has different cookies.
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  return createSupabaseServerClient();
}

/**
 * Service role client for admin operations only.
 * Bypasses RLS. Never use in client-facing code paths unless explicitly required.
 */
let _serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient {
  if (_serviceClient) return _serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing Supabase service role environment variables. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  _serviceClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return _serviceClient;
}

// Reset clients (for testing)
export function resetSupabaseClient(): void {
  _serviceClient = null;
}
