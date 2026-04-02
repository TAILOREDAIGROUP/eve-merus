import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase/middleware';

/**
 * EVE Merus root middleware
 * - Supabase Auth session verification
 * - CSP nonce per request
 * - OWASP security headers
 * - Request ID tracing
 */

const PUBLIC_ROUTES = new Set([
  '/',
  '/login',
  '/signup',
  '/api/health',
]);

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  if (pathname.startsWith('/login')) return true;
  if (pathname.startsWith('/signup')) return true;
  if (pathname.startsWith('/auth/callback')) return true;
  if (pathname.startsWith('/api/webhooks/')) return true;
  return false;
}

export async function middleware(req: NextRequest) {
  const requestId = crypto.randomUUID();
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

  let response = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  // Create Supabase client and refresh session
  const supabase = createSupabaseMiddlewareClient(req, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Protect non-public routes
  if (!isPublicRoute(pathname)) {
    if (!user) {
      // API routes get 401, pages get redirect
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401, headers: { 'x-request-id': requestId } }
        );
      }
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    response.headers.set('x-user-id', user.id);
  }

  // Request ID
  response.headers.set('x-request-id', requestId);

  // OWASP security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  response.headers.set(
    'Content-Security-Policy',
    [
      `default-src 'self'`,
      `script-src 'self' 'nonce-${nonce}'`,
      `style-src 'self' 'nonce-${nonce}'`,
      `img-src 'self' data: https:`,
      `font-src 'self'`,
      `connect-src 'self' https://*.supabase.co`,
      `frame-ancestors 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
    ].join('; ')
  );
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  return response;
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
