"use client"

import { useRef, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { toast } from "sonner"
import { Brain, Loader2, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email") ?? ""

  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const code = otp.join("")

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1)
    const next = [...otp]
    next[i] = digit
    setOtp(next)
    if (digit && i < 5) inputRefs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6)
    if (pasted.length === 6) {
      setOtp(pasted.split(""))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    if (code.length < 6) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: code }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        return
      }

      // Try to auto sign-in using the stashed credentials from sign-up
      const stashed = sessionStorage.getItem("_cortex_pending")
      if (stashed) {
        const { email: e, password } = JSON.parse(stashed)
        sessionStorage.removeItem("_cortex_pending")
        const result = await signIn("credentials", { email: e, password, redirect: false })
        if (result?.ok) {
          toast.success("Email verified! Welcome to Cortex 🎉")
          router.push("/dashboard")
          return
        }
      }

      // Fallback: redirect to sign-in with success message
      router.push("/sign-in?verified=1")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || !email) return
    setResending(true)
    setError("")
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSuccess("New code sent!")
        setCountdown(60)
        setOtp(["", "", "", "", "", ""])
        inputRefs.current[0]?.focus()
        setTimeout(() => setSuccess(""), 3000)
      }
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-lg shadow-violet-500/25">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <h1 className="text-lg font-semibold text-white">Check your email</h1>
          <p className="mt-1 text-sm text-white/40">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-medium text-violet-400">{email || "your email"}</p>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-7 backdrop-blur-xl">
          <div className="space-y-5">
            {/* OTP inputs */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  className="h-13 w-11 rounded-xl border border-white/[0.07] bg-white/4 text-center text-xl font-bold text-white outline-none transition focus:border-violet-500/50 focus:bg-white/[0.07]"
                  style={{ height: "52px" }}
                />
              ))}
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-sm text-red-400">
                {error}
              </p>
            )}
            {success && (
              <p className="text-center text-sm text-emerald-400">{success}</p>
            )}

            <Button
              onClick={handleVerify}
              disabled={code.length < 6 || loading}
              className="w-full bg-violet-600 text-white hover:bg-violet-500"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Email"}
            </Button>
          </div>
        </div>

        {/* Resend */}
        <div className="mt-5 flex flex-col items-center gap-2">
          <p className="text-[13px] text-white/35">Didn&apos;t receive the code?</p>
          <button
            onClick={handleResend}
            disabled={resending || countdown > 0}
            className="flex items-center gap-1.5 text-sm text-violet-400 transition hover:text-violet-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {countdown > 0 ? `Resend in ${countdown}s` : resending ? "Sending..." : "Resend code"}
          </button>
        </div>
      </div>
    </div>
  )
}
