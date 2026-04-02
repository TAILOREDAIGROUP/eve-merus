import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the server client module
vi.mock('@/lib/supabase/server', () => ({
  createSupabaseServerClient: vi.fn().mockResolvedValue({
    from: vi.fn(),
    auth: { getUser: vi.fn() },
  }),
}));

import { getSupabaseClient, getServiceClient, resetSupabaseClient } from '@/lib/supabase';

describe('Supabase Client', () => {
  beforeEach(() => {
    resetSupabaseClient();
  });

  describe('getSupabaseClient', () => {
    it('returns a Supabase client (async)', async () => {
      const client = await getSupabaseClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');
    });
  });

  describe('getServiceClient', () => {
    it('throws when environment variables are missing', () => {
      const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const origKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => getServiceClient()).toThrow(
        'Missing Supabase service role environment variables'
      );

      if (origUrl) process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
      if (origKey) process.env.SUPABASE_SERVICE_ROLE_KEY = origKey;
    });

    it('creates service client when environment variables are set', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

      const client = getServiceClient();
      expect(client).toBeDefined();
      expect(typeof client.from).toBe('function');

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    it('returns the same service client instance', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

      const client1 = getServiceClient();
      const client2 = getServiceClient();
      expect(client1).toBe(client2);

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });

    it('creates new service client after reset', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key';

      const client1 = getServiceClient();
      resetSupabaseClient();
      const client2 = getServiceClient();
      expect(client1).not.toBe(client2);

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    });
  });
});
