import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { plan } = await req.json()
  if (!plan) return NextResponse.json({ error: "Plan description required" }, { status: 400 })

  const prompt = `
You are a productivity psychologist and burnout prevention expert. Analyze the following plan someone is considering.

Plan: "${plan}"

Be direct, honest, and grounded. NOT motivational. NOT a cheerleader.

Return a JSON object with this exact structure:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL",
  "burnoutScore": <number 0-100, where 100 = guaranteed burnout>,
  "issues": ["Specific problem 1", "Specific problem 2"],
  "verdict": "One blunt sentence verdict on whether this plan is sustainable",
  "suggestedSchedule": "A concrete alternative schedule that IS sustainable",
  "psychologyNote": "One insight about why people make this kind of plan and what actually works",
  "isDoable": <true | false>
}

Be specific to what they wrote. If the plan is actually fine, say so honestly.
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const analysis = JSON.parse(text)

    await db.aIAnalysis.create({
      data: {
        type: "REALITY_CHECK",
        prompt: plan,
        response: text,
        userId: session.user.id,
      },
    })

    return NextResponse.json(analysis)
  } catch (err) {
    console.error("Gemini reality-check error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
