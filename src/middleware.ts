import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { format } from 'date-fns';

export async function middleware(request: NextRequest) {
  const { response, user } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Define public and protected routes
  const protectedRoutes = ['/day', '/panel', '/dashboard', '/calendar', '/analytics', '/tasks'];
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  if (user && pathname.startsWith('/login')) {
    // Redirect authenticated users from login page to the day view with the current date
    const today = format(new Date(), 'yyyy-MM-dd');
    return NextResponse.redirect(new URL(`/day?date=${today}`, request.url));
  }

  if (user && (pathname === '/' || pathname === '/dashboard')) {
    const today = format(new Date(), 'yyyy-MM-dd');
    // Redirect root and dashboard to the new day view
    return NextResponse.redirect(new URL(`/day?date=${today}`, request.url));
  }
  
  if (user && pathname === '/day') {
    const today = format(new Date(), 'yyyy-MM-dd');
    // If accessing /day directly, ensure it has the date query param
    if (!request.nextUrl.searchParams.has('date')) {
        return NextResponse.redirect(new URL(`/day?date=${today}`, request.url));
    }
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
