import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { exam, target, timeframe, hoursPerDay, weakAreas } = await req.json()
  if (!exam?.trim() || !target?.trim())
    return NextResponse.json({ error: "Exam and target required" }, { status: 400 })

  const prompt = `
You are a world-class exam coach. Create a specific, actionable study plan for this student.

Exam/Goal: "${exam}"
Target score/level: "${target}"
Available time: ${timeframe}
Study hours per day: ${hoursPerDay} hours
Weak areas: "${weakAreas || "Not specified — build a general plan"}"

Return a JSON object:
{
  "overview": "2-3 sentence assessment of this goal and the right approach",
  "isAchievable": <true|false>,
  "achievabilityNote": "Honest, direct assessment — is this realistic? If not, what IS realistic?",
  "weeklyPlan": [
    {
      "week": 1,
      "phase": "Phase name (e.g. Foundation, Practice, Mastery)",
      "focus": "What to focus on this week in 1 sentence",
      "topics": ["Specific topic to cover 1", "Specific topic to cover 2"],
      "dailyTasks": ["Concrete daily action 1 (be specific)", "Concrete daily action 2"],
      "weeklyGoal": "What you should achieve by Sunday of this week"
    }
  ],
  "dailySchedule": {
    "morning": "Specific morning block activity",
    "afternoon": "Specific afternoon block activity",
    "evening": "Evening review/practice activity"
  },
  "milestones": [
    { "label": "Milestone name", "week": 2, "description": "What success looks like here" }
  ],
  "examTips": [
    "Tip specific to ${exam} — not generic study advice",
    "Another specific tip"
  ],
  "resources": [
    "Specific, real resource name for this exam (book/site/app)",
    "Another specific resource"
  ]
}

Critical rules:
- Everything must be specific to "${exam}" — no generic "review your notes" advice
- For timeframes over 2 months, group into phases (show one entry per week still, but mark the phase)
- Daily tasks should name specific things to DO (e.g. "Complete 50 IELTS Reading questions and review mistakes" not "study reading")
- Resources should be real, well-known tools for this exact exam
- Limit weeklyPlan to max 12 entries — for longer plans, group weeks (e.g. "Week 9-12")
- Be honest in achievabilityNote — if the target needs more time, say so
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const plan = JSON.parse(text)

    await db.aIAnalysis.create({
      data: {
        type: "STUDY_PLAN",
        prompt: `${exam} → ${target} in ${timeframe}`,
        response: text,
        userId: session.user.id,
      },
    })

    return NextResponse.json(plan)
  } catch (err) {
    console.error("Study plan error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
