import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware to protect internal routes if onboarding is not complete
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // List of internal routes to protect
  const protectedRoutes = ['/dashboard', '/profile', '/job-search', '/reminders', '/reminders-calendar', '/resume-management', '/user-profile'];

  // Allow public routes and API routes
  if (
    pathname.startsWith('/api') ||
    pathname === '/' ||
    pathname.startsWith('/auth') ||
    pathname === '/onboarding' ||
    pathname === '/signin' ||
    pathname === '/signup'
  ) {
    return NextResponse.next();
  }

  // Check if the requested path is protected
  // Onboarding check is now handled client-side in OnboardingCheck component
  // if (protectedRoutes.some((route) => pathname.startsWith(route))) {
  //   // Check onboarding completion from cookies (assuming onboardingComplete cookie is set on client)
  //   const onboardingComplete = request.cookies.get('onboardingComplete')?.value === 'true';

  //   if (!onboardingComplete) {
  //     // Redirect to onboarding page if not complete
  //     return NextResponse.redirect(new URL('/onboarding', request.url));
  //   }
  // }

  return NextResponse.next();
}

// Specify the paths where middleware should run
export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/job-search/:path*', '/reminders/:path*', '/reminders-calendar/:path*', '/resume-management/:path*', '/user-profile/:path*'],
};
