import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return new Response("Unauthorized", { status: 401 })

  const { messages } = await req.json()
  if (!messages?.length) return new Response("No messages", { status: 400 })

  const [goals, tasks, focusLogs] = await Promise.all([
    db.goal.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { title: true, progress: true, type: true, deadline: true },
      take: 8,
    }),
    db.task.findMany({
      where: { userId: session.user.id, completed: false },
      select: { title: true, priority: true, goalId: true },
      orderBy: { priority: "desc" },
      take: 12,
    }),
    db.focusLog.findMany({
      where: { userId: session.user.id },
      select: { energy: true, focus: true, stress: true, duration: true, taskTitle: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ])

  const avg = (arr: number[]) =>
    arr.length ? (arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1) : "N/A"

  const weeklyFocusMin = focusLogs.reduce((s, l) => s + l.duration, 0)
  const linkedTasks = tasks.filter((t) => t.goalId).length
  const alignmentScore = tasks.length > 0 ? Math.round((linkedTasks / tasks.length) * 100) : 0
  const avgStress = focusLogs.length
    ? focusLogs.reduce((s, l) => s + l.stress, 0) / focusLogs.length
    : 0
  const burnoutLevel = avgStress >= 7 ? "HIGH" : avgStress >= 4.5 ? "MEDIUM" : "LOW"

  const systemPrompt = `You are Cortex AI, this user's personal productivity coach. You have full context on their current situation — use it.

USER CONTEXT (live data):
Active Goals (${goals.length}):
${goals.map((g) => `- "${g.title}" — ${g.progress}% done [${g.type}]${g.deadline ? `, due ${new Date(g.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}` : ""}`).join("\n") || "- No active goals set"}

Pending Tasks (${tasks.length}):
${tasks.slice(0, 8).map((t) => `- "${t.title}" [${t.priority}]${t.goalId ? " ✓linked" : ""}`).join("\n") || "- No pending tasks"}

Focus Sessions (${focusLogs.length} recent):
- Avg energy: ${avg(focusLogs.map((l) => l.energy))}/10
- Avg focus: ${avg(focusLogs.map((l) => l.focus))}/10
- Avg stress: ${avg(focusLogs.map((l) => l.stress))}/10
- Recent focus time: ${weeklyFocusMin} minutes
- Burnout level: ${burnoutLevel}

Goal-Task Alignment: ${alignmentScore}% of tasks are linked to goals
Today: ${new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}

HOW TO RESPOND:
- Reference their specific goals and tasks by name — never give advice so generic it could apply to anyone
- Be direct, honest, and occasionally blunt. Not a cheerleader.
- 2-4 short paragraphs max. No bullet point walls. Write like a person, not a report.
- If their alignment is low, point it out. If their stress is high, address it.
- You can ask ONE clarifying question per response if it would help, but don't always ask questions
- You know everything about their situation. Act like it.`

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
    })

    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const lastMessage = messages[messages.length - 1].content
    const result = await chat.sendMessageStream(lastMessage)

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text()
            if (text) controller.enqueue(encoder.encode(text))
          }
        } finally {
          controller.close()
        }
      },
    })

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (err) {
    console.error("Coach error:", err)
    return new Response(String(err), { status: 500 })
  }
}
