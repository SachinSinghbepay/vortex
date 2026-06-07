import { withAuth } from "next-auth/middleware"

export default withAuth

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/goals/:path*",
    "/tasks/:path*",
    "/focus/:path*",
    "/analytics/:path*",
    "/settings/:path*",
  ],
}
