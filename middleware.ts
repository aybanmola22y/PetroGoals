import { NextRequest, NextResponse } from 'next/server'

// Routes that require a valid auth token
const PROTECTED_ROUTES = ['/dashboard']

// Routes that should redirect authenticated users away (e.g., back to dashboard)
const AUTH_ROUTES = ['/login']

// Security headers applied to every middleware response (including redirects)
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
}

/** Attach security headers to any NextResponse */
function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const authToken = request.cookies.get('auth_token')?.value
  const isAuthenticated = Boolean(authToken && authToken.trim().length > 0)

  // Redirect unauthenticated users trying to access protected routes
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url)
    // Preserve the original URL so the user can be redirected back after login
    loginUrl.searchParams.set('redirect', pathname)
    return applySecurityHeaders(NextResponse.redirect(loginUrl))
  }

  // Redirect already-authenticated users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  if (isAuthRoute && isAuthenticated) {
    return applySecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)))
  }

  // Allow the request to proceed
  return applySecurityHeaders(NextResponse.next())
}

// Configure which routes to apply middleware to
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
