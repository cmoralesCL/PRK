
import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Define public and protected routes
  const protectedRoutes = ['/panel', '/dashboard', '/calendar', '/agente'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  // In a real production app, you'd want to enforce this.
  // For the workshop, we are relaxing this to avoid login loops in dev.
  if (!user && isProtectedRoute) {
    // return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user && pathname.startsWith('/login')) {
    // Redirect authenticated users from login page to the panel
    return NextResponse.redirect(new URL('/panel', request.url));
  }
  
  if (!user && pathname === '/') {
    // Redirect unauthenticated users from root to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Return the response object, which may have been modified by updateSession
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
