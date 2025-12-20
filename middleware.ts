import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // List of protected routes that require authentication
  const protectedRoutes = ['/dashboard']
  
  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for auth token in cookies
    const authToken = request.cookies.get('auth_token')?.value

    if (!authToken) {
      // Redirect to login if no auth token
      return NextResponse.redirect(new URL('/login', request.url))
    }
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
