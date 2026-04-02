import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/supabase/middleware', () => ({
  createSupabaseMiddlewareClient: vi.fn().mockReturnValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
  }),
}));

import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

function makeRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, 'http://localhost:3000'));
}

describe('middleware', () => {
  it('allows public routes without auth', async () => {
    const res = await middleware(makeRequest('/api/health'));
    // Public route should not redirect
    expect(res.status).not.toBe(401);
  });

  it('returns 401 for unauthenticated API requests', async () => {
    const res = await middleware(makeRequest('/api/libraries'));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe('Unauthorized');
  });

  it('redirects unauthenticated page requests to login', async () => {
    const res = await middleware(makeRequest('/dashboard'));

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
    expect(res.headers.get('location')).toContain('redirect=%2Fdashboard');
  });

  it('sets security headers on all responses', async () => {
    const res = await middleware(makeRequest('/api/health'));

    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('Strict-Transport-Security')).toContain('max-age');
    expect(res.headers.get('x-request-id')).toBeTruthy();
  });

  it('allows login page without auth', async () => {
    const res = await middleware(makeRequest('/login'));
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(307);
  });
});
