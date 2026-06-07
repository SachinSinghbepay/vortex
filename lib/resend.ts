import { Resend } from "resend"

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const FROM_EMAIL = process.env.EMAIL_FROM ?? "Cortex <onboarding@resend.dev>"
export const APP_URL = process.env.NEXTAUTH_URL ?? "http://localhost:3000"
