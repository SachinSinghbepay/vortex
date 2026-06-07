import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getGeminiModel } from "@/lib/gemini"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { decision, pros, cons, priorities } = await req.json()
  if (!decision?.trim()) return NextResponse.json({ error: "Decision required" }, { status: 400 })

  const prompt = `
You are a strategic decision-making advisor. Analyze this decision with clarity and directness.

Decision: "${decision}"
${pros?.length ? `Pros they see: ${pros.filter(Boolean).join(", ")}` : ""}
${cons?.length ? `Cons they see: ${cons.filter(Boolean).join(", ")}` : ""}
${priorities?.trim() ? `What matters most to them: "${priorities}"` : ""}

Return this exact JSON:
{
  "verdict": "One punchy, direct sentence summarizing your take",
  "recommendation": "2-3 sentences with your actual recommendation and core reasoning",
  "confidence": <number 0-100, how confident you are>,
  "tradeoffs": ["Real tradeoff 1", "Real tradeoff 2", "Real tradeoff 3"],
  "risks": ["Specific risk if they proceed", "Another risk"],
  "overlooked": "The one thing most people miss when making this type of decision",
  "nextStep": "The single most important action to take RIGHT NOW regardless of which way they decide",
  "leanToward": "YES" | "NO" | "BOTH_VALID" | "NEED_MORE_INFO"
}

Be direct. No hedging. No "it depends." Pick a side.
`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    const analysis = JSON.parse(text)

    await db.aIAnalysis.create({
      data: { type: "DECISION_ANALYSIS", prompt: decision, response: text, userId: session.user.id },
    })

    return NextResponse.json(analysis)
  } catch (err) {
    console.error("Decision AI error:", err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
