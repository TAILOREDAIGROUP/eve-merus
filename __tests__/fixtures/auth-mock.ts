import { vi } from 'vitest';

/**
 * Standard mock user for authenticated API route tests.
 * Import this and call vi.mock('@/lib/auth/requireAuth', ...) in each test file.
 */
export const MOCK_USER = {
  id: 'user-uuid-123',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  app_metadata: {},
  user_metadata: {},
  created_at: '2026-01-01T00:00:00Z',
} as const;

/**
 * Creates the requireAuth mock factory.
 * Usage: vi.mock('@/lib/auth/requireAuth', () => createAuthMock())
 */
export function createAuthMock() {
  return {
    requireAuth: vi.fn().mockResolvedValue({ user: MOCK_USER }),
  };
}
