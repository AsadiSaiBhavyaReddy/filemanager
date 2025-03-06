import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

// Configure routes that should not require authentication
export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)", // Protect all routes except static files
    "/",
    "/(api|trpc)(.*)",
  ],
};
