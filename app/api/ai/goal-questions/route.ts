import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { getGeminiModel } from "@/lib/gemini"

const fallbacks: Record<string, string[]> = {
  FITNESS: [
    "What is your current state? (e.g. weight, fitness level, any injuries)",
    "How many days per week can you realistically train?",
    "Do you have gym access, or are you training at home?",
  ],
  LEARNING: [
    "What is your current skill level in this area?",
    "How many hours per day can you dedicate to learning?",
    "Do you have any resources already — courses, books, mentor?",
  ],
  CAREER: [
    "What is your current role and experience level?",
    "What specific skills or gaps are you targeting?",
    "What's your biggest constraint — time, resources, or network?",
  ],
  FINANCE: [
    "What is your starting point? (e.g. current savings, debt)",
    "How much can you set aside or invest per month?",
    "Is there a specific reason for this deadline?",
  ],
  PERSONAL: [
    "What does your current situation look like?",
    "What is the main obstacle you've faced with this before?",
    "What resources or support do you have available?",
  ],
  CUSTOM: [
    "What is your starting point for this goal?",
    "How much time per week can you dedicate to it?",
    "What is the biggest challenge you expect?",
  ],
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { title, type, description } = await req.json()
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 })

  const prompt = `You are a goal coach. A user just set a goal and you need to ask them exactly 3 short, specific questions to understand their situation so you can build a truly personalized plan.

Goal: "${title}"
Type: ${type}
${description ? `Description: ${description}` : ""}

Return ONLY a JSON object:
{
  "questions": ["Question 1?", "Question 2?", "Question 3?"]
}

Rules:
- Exactly 3 questions, no more, no less
- Each question must be short (under 15 words) and specific to THIS goal
- Ask about: current state/starting point, available time or resources, key constraints
- For FITNESS: ask about current body stats, training days available, equipment access
- For LEARNING: ask about current skill level, daily hours, existing resources
- For CAREER: ask about current role/level, specific target skills, timeline constraints
- For FINANCE: ask about starting financial state, monthly capacity, specific deadline reason
- Never ask generic questions like "What motivates you?" — only specific, actionable ones
- Return valid JSON only, no markdown`

  try {
    const model = getGeminiModel()
    const result = await model.generateContent(prompt)
    let text = result.response.text().trim()
    if (text.startsWith("```")) text = text.replace(/```(?:json)?\n?/g, "").replace(/```$/g, "").trim()
    const data = JSON.parse(text)
    const questions = Array.isArray(data.questions) ? data.questions.slice(0, 3) : []
    if (!questions.length) throw new Error("empty")
    return NextResponse.json({ questions })
  } catch {
    return NextResponse.json({ questions: fallbacks[type] ?? fallbacks.PERSONAL })
  }
}
