export { default } from "next-auth/middleware"

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
