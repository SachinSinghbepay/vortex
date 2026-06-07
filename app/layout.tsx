import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthSessionProvider } from "@/components/session-provider"
import { ServiceWorkerRegister } from "@/components/sw-register"
import { Toaster } from "sonner"

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Cortex — AI Productivity OS",
  description:
    "Break down goals, beat burnout, and work smarter every day. Your AI-powered cognitive operating system.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Cortex",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "Cortex — AI Productivity OS",
    description: "Your AI-powered cognitive operating system.",
    type: "website",
  },
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icon" />
      </head>
      <body>
        <AuthSessionProvider>
          <ThemeProvider>{children}</ThemeProvider>
          <Toaster richColors position="bottom-right" theme="system" />
        </AuthSessionProvider>
        <ServiceWorkerRegister />
      </body>
    </html>
  )
}
