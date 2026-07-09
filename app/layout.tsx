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
        {/* Runs synchronously before first paint — prevents theme flash; also stamps user timezone cookie for server-side date calculations */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme')||'system';var dark=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme:dark)').matches);document.documentElement.classList.toggle('dark',dark);}catch(e){}try{var tz=Intl.DateTimeFormat().resolvedOptions().timeZone;if(tz)document.cookie='tz='+encodeURIComponent(tz)+'; path=/; max-age=86400; SameSite=Lax';}catch(e){}})();`,
          }}
        />
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
