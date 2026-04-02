import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Infrastructure health check endpoint.
 * No auth required. Used by Docker healthcheck and external monitoring.
 */
export async function GET() {
  const checks: Record<string, string> = {};
  let healthy = true;

  // Check database connectivity
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      checks.database = 'missing_config';
      healthy = false;
    } else {
      const client = createClient(url, key, {
        auth: { persistSession: false },
      });
      const { error } = await client
        .from('libraries')
        .select('id')
        .limit(1);

      checks.database = error ? 'error' : 'ok';
      if (error) healthy = false;
    }
  } catch {
    checks.database = 'unreachable';
    healthy = false;
  }

  return NextResponse.json(
    {
      status: healthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '0.1.0',
      checks,
    },
    { status: healthy ? 200 : 503 }
  );
}
