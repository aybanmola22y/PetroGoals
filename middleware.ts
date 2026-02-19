import { NextRequest, NextResponse } from 'next/server'

// Routes that require a valid auth token
const PROTECTED_ROUTES = ['/dashboard']

// Routes that should redirect authenticated users away (e.g., back to dashboard)
const AUTH_ROUTES = ['/login']

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
    return NextResponse.redirect(loginUrl)
  }

  // Redirect already-authenticated users away from auth pages
  const isAuthRoute = AUTH_ROUTES.some(route => pathname.startsWith(route))
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Allow the request to proceed
  return NextResponse.next()
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
