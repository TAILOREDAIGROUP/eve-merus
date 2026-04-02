import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGetUser = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: mockGetUser,
    },
  }),
}));

import { requireAuth } from '@/lib/auth/requireAuth';

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns user when authenticated', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    mockGetUser.mockResolvedValue({ data: { user: mockUser }, error: null });

    const result = await requireAuth();
    expect(result.user).toEqual(mockUser);
    expect(result.error).toBeUndefined();
  });

  it('returns 401 response when not authenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const result = await requireAuth();
    expect(result.user).toBeUndefined();
    expect(result.error).toBeDefined();

    const body = await result.error!.json();
    expect(body.error).toBe('Unauthorized');
  });

  it('returns 401 response on auth error', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: new Error('Token expired'),
    });

    const result = await requireAuth();
    expect(result.user).toBeUndefined();
    expect(result.error).toBeDefined();
  });
});
