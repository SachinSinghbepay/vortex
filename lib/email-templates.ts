import { APP_URL } from "@/lib/resend"

const baseStyle = `
  body { margin:0; padding:0; background:#f4f4f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
  * { box-sizing:border-box; }
`

const card = (content: string, extraStyle = "") =>
  `<table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;border-radius:16px;overflow:hidden;max-width:560px;margin:0 auto;${extraStyle}">${content}</table>`

const row = (content: string, padding = "24px 28px", borderBottom = false) =>
  `<tr><td style="padding:${padding};${borderBottom ? "border-bottom:1px solid rgba(255,255,255,0.07);" : ""}">${content}</td></tr>`

// ─── OTP Verification ─────────────────────────────────────────────────────────

export function otpEmailHtml(name: string, otp: string): string {
  const digits = otp.split("").map(d =>
    `<td style="width:48px;height:56px;text-align:center;vertical-align:middle;background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.3);border-radius:10px;font-size:28px;font-weight:700;color:white;font-family:monospace;">${d}</td>`
  ).join(`<td style="width:8px;"></td>`)

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyle}</style></head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 16px;">
<tr><td align="center">
${card(`
  ${row(`
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:14px;">🧠</td>
      <td style="padding-left:8px;color:white;font-size:15px;font-weight:600;">Cortex</td>
    </tr></table>
  `, "20px 28px", true)}
  ${row(`
    <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px;">Your verification code, ${name} 🔐</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">Enter this code on the verification screen to activate your Cortex account. It expires in <strong style="color:white;">10 minutes</strong>.</p>
  `, "28px 28px 24px")}
  ${row(`
    <div style="text-align:center;">
      <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
        <tr>${digits}</tr>
      </table>
    </div>
  `, "0 28px 28px")}
  ${row(`
    <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:0;">
      If you didn't request this, you can safely ignore this email.<br>
      Don't share this code with anyone.
    </p>
  `, "0 28px 24px")}
`)}
</td></tr></table>
</body></html>`
}

// ─── Email Verification (legacy link) ─────────────────────────────────────────

export function verificationEmailHtml(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyle}</style></head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 16px;">
<tr><td align="center">
${card(`
  ${row(`
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:14px;">🧠</td>
      <td style="padding-left:8px;color:white;font-size:15px;font-weight:600;">Cortex</td>
    </tr></table>
  `, "20px 28px", true)}
  ${row(`
    <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px;">Verify your email, ${name} 👋</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;line-height:1.6;margin:0;">
      You're one step away from your Cortex workspace. Click the button below to verify your email address and get started.
    </p>
  `, "28px 28px 20px")}
  ${row(`
    <div style="text-align:center;">
      <a href="${verifyUrl}" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:14px 36px;border-radius:10px;font-size:15px;font-weight:600;">
        Verify Email →
      </a>
    </div>
    <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin:16px 0 0;">
      This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
    </p>
  `, "0 28px 28px")}
`)}
</td></tr></table>
</body></html>`
}

// ─── Morning Brief ────────────────────────────────────────────────────────────

interface MorningBriefData {
  name: string
  streak: number
  mit: string
  goals: Array<{ title: string; progress: number }>
  weeklyFocusMin: number
  quote: { text: string; author: string }
}

export function morningBriefHtml({
  name,
  streak,
  mit,
  goals,
  weeklyFocusMin,
  quote,
}: MorningBriefData): string {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
  const streakEmoji = streak >= 30 ? "🏆" : streak >= 14 ? "🔥" : streak >= 7 ? "⚡" : streak > 0 ? "✨" : "🌱"
  const streakText = streak > 0 ? `${streakEmoji} ${streak}-day streak` : "🌱 Start your streak today"

  const goalsHtml = goals.slice(0, 3).map((g) => `
    <tr>
      <td style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.05);">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:rgba(255,255,255,0.7);font-size:13px;">${g.title}</td>
            <td align="right" style="color:rgba(124,58,237,0.8);font-size:13px;font-weight:600;white-space:nowrap;">${g.progress}%</td>
          </tr>
        </table>
        <div style="background:rgba(255,255,255,0.06);border-radius:4px;height:4px;margin-top:6px;overflow:hidden;">
          <div style="background:#7c3aed;height:4px;width:${g.progress}%;border-radius:4px;"></div>
        </div>
      </td>
    </tr>
  `).join("")

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyle}</style></head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 16px;">
<tr><td align="center">
${card(`
  ${row(`
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td>
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;font-size:14px;">🧠</td>
            <td style="padding-left:8px;color:white;font-size:15px;font-weight:600;">Cortex</td>
          </tr></table>
        </td>
        <td align="right" style="color:rgba(255,255,255,0.3);font-size:12px;">${today}</td>
      </tr>
    </table>
  `, "20px 28px", true)}

  ${row(`
    <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 6px;">Good morning, ${name} ☀️</h1>
    <p style="color:rgba(255,255,255,0.4);font-size:14px;margin:0;">${streakText}</p>
  `, "28px 28px")}

  ${row(`
    <div style="background:rgba(124,58,237,0.12);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:18px;">
      <p style="color:rgba(255,255,255,0.45);font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">Today's Focus</p>
      <p style="color:white;font-size:17px;font-weight:600;margin:0;line-height:1.4;">${mit}</p>
    </div>
  `, "0 28px 24px")}

  ${goals.length > 0 ? row(`
    <p style="color:rgba(255,255,255,0.45);font-size:10px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 12px;">Active Goals</p>
    <table width="100%" cellpadding="0" cellspacing="0">${goalsHtml}</table>
  `, "0 28px 24px") : ""}

  ${row(`
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="33%" align="center" style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;margin-right:8px;">
          <div style="color:white;font-size:18px;font-weight:700;">${goals.length}</div>
          <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:2px;">Active Goals</div>
        </td>
        <td width="4%"></td>
        <td width="30%" align="center" style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
          <div style="color:white;font-size:18px;font-weight:700;">${Math.floor(weeklyFocusMin / 60)}h ${weeklyFocusMin % 60}m</div>
          <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:2px;">Focus This Week</div>
        </td>
        <td width="4%"></td>
        <td width="29%" align="center" style="background:rgba(255,255,255,0.04);border-radius:10px;padding:12px;">
          <div style="color:white;font-size:18px;font-weight:700;">${streak}</div>
          <div style="color:rgba(255,255,255,0.35);font-size:11px;margin-top:2px;">Day Streak</div>
        </td>
      </tr>
    </table>
  `, "0 28px 24px")}

  ${row(`
    <div style="border-left:3px solid #7c3aed;padding-left:16px;">
      <p style="color:rgba(255,255,255,0.65);font-style:italic;font-size:14px;line-height:1.6;margin:0 0 8px;">"${quote.text}"</p>
      <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">— ${quote.author}</p>
    </div>
  `, "0 28px 28px")}

  ${row(`
    <div style="text-align:center;">
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:15px;font-weight:600;">
        Open Cortex →
      </a>
    </div>
  `, "0 28px 28px")}

  ${row(`
    <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin:0;">
      You're receiving this because morning briefs are enabled in your Cortex account.<br>
      <a href="${APP_URL}/settings" style="color:rgba(255,255,255,0.2);">Manage preferences</a>
    </p>
  `, "16px 28px")}
`)}
</td></tr></table>
</body></html>`
}

// ─── 30-Day Progress Report ───────────────────────────────────────────────────

interface ReportData {
  name: string
  tasksCompleted: number
  goalsCreated: number
  goalsCompleted: number
  focusHours: number
  streak: number
  topGoal: string | null
}

export function progressReportHtml({
  name,
  tasksCompleted,
  goalsCreated,
  goalsCompleted,
  focusHours,
  streak,
  topGoal,
}: ReportData): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${baseStyle}</style></head>
<body>
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 16px;">
<tr><td align="center">
${card(`
  ${row(`
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:linear-gradient(135deg,#7c3aed,#4f46e5);border-radius:8px;width:28px;height:28px;text-align:center;font-size:14px;">🧠</td>
          <td style="padding-left:8px;color:white;font-size:15px;font-weight:600;">Cortex</td>
        </tr></table>
      </td>
    </tr></table>
  `, "20px 28px", true)}

  ${row(`
    <p style="color:rgba(255,255,255,0.4);font-size:11px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">30-Day Report</p>
    <h1 style="color:white;font-size:22px;font-weight:700;margin:0 0 8px;">You've been using Cortex for 30 days, ${name} 🎉</h1>
    <p style="color:rgba(255,255,255,0.5);font-size:14px;margin:0;line-height:1.6;">Here's what you've accomplished. These are real numbers from your actual work — not projections.</p>
  `, "28px")}

  ${row(`
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td width="48%" style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.2);border-radius:12px;padding:18px;text-align:center;">
          <div style="color:#a78bfa;font-size:36px;font-weight:700;">${tasksCompleted}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">Tasks Completed</div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);border-radius:12px;padding:18px;text-align:center;">
          <div style="color:#34d399;font-size:36px;font-weight:700;">${focusHours}h</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">Deep Focus Work</div>
        </td>
      </tr>
      <tr><td colspan="3" style="padding:8px 0;"></td></tr>
      <tr>
        <td width="48%" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:18px;text-align:center;">
          <div style="color:#fbbf24;font-size:36px;font-weight:700;">${streak}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">Day Streak</div>
        </td>
        <td width="4%"></td>
        <td width="48%" style="background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.2);border-radius:12px;padding:18px;text-align:center;">
          <div style="color:#60a5fa;font-size:36px;font-weight:700;">${goalsCompleted}/${goalsCreated}</div>
          <div style="color:rgba(255,255,255,0.5);font-size:12px;margin-top:4px;">Goals Completed</div>
        </td>
      </tr>
    </table>
  `, "0 28px 24px")}

  ${topGoal ? row(`
    <div style="background:rgba(255,255,255,0.04);border-radius:12px;padding:18px;">
      <p style="color:rgba(255,255,255,0.35);font-size:11px;text-transform:uppercase;letter-spacing:0.1em;margin:0 0 8px;">Most Active Goal</p>
      <p style="color:white;font-size:16px;font-weight:600;margin:0;">${topGoal}</p>
    </div>
  `, "0 28px 24px") : ""}

  ${row(`
    <div style="background:rgba(124,58,237,0.1);border-radius:12px;padding:18px;">
      <p style="color:rgba(255,255,255,0.6);font-size:14px;line-height:1.7;margin:0;">
        30 days in. You've shown up consistently enough to build real data about your work habits.
        The people who stick with Cortex for 90 days see their goal completion rate improve by 3×.
        You're already past the hardest part — starting.
      </p>
    </div>
  `, "0 28px 24px")}

  ${row(`
    <div style="text-align:center;">
      <a href="${APP_URL}/analytics" style="display:inline-block;background:#7c3aed;color:white;text-decoration:none;padding:13px 32px;border-radius:10px;font-size:15px;font-weight:600;">
        View Full Analytics →
      </a>
    </div>
  `, "0 28px 28px")}

  ${row(`
    <p style="color:rgba(255,255,255,0.2);font-size:11px;text-align:center;margin:0;">
      <a href="${APP_URL}/settings" style="color:rgba(255,255,255,0.2);">Manage email preferences</a>
    </p>
  `, "16px 28px")}
`)}
</td></tr></table>
</body></html>`
}
