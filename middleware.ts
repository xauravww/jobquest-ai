import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    // Debug log to confirm middleware runs
    console.log("Middleware running for:", req.nextUrl.pathname);
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    },
  }
)

export const config = {
  matcher: [
    "/application-tracking/:path*",
    "/resume-management/:path*",
    "/dashboard/:path*",
    "/user-profile/:path*",
    "/reminders/:path*",
    "/reminders-calendar/:path*",
    "/events/:path*",
    "/ai-filtering/:path*",
    "/job-search/:path*",
    "/onboarding/:path*"
  ],
};
