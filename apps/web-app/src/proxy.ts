import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Define routes that require authentication
const isPrivateRoute = createRouteMatcher([
  // Dashboard and app routes
  '/app(.*)',
]);

export default clerkMiddleware(async (auth, request) => {
  // Protect private routes - everything else is public by default
  if (isPrivateRoute(request)) {
    const authResponse = await auth.protect();

    // Skip org check for onboarding page and invite accept page
    const isOnboardingPage =
      request.nextUrl.pathname.startsWith('/app/onboarding');
    const isInviteAcceptPage = request.nextUrl.pathname.startsWith(
      '/app/invite/accept/',
    );

    // All app routes require org except onboarding and invite accept
    if (
      authResponse.userId &&
      !authResponse.orgId &&
      !isOnboardingPage &&
      !isInviteAcceptPage
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/app/onboarding';
      url.searchParams.set('redirectTo', request.nextUrl.pathname);

      return NextResponse.redirect(url);
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
    '/app(.*)',
  ],
};
