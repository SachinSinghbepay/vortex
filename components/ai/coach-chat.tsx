"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Brain, Loader2, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

type Message = { role: "user" | "assistant"; content: string }

const SUGGESTIONS = [
  "Why am I not making progress on my goals?",
  "What's the one thing I should focus on today?",
  "Am I at risk of burnout right now?",
  "My tasks feel overwhelming. Where do I start?",
  "Review my week and tell me what I should change.",
]

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-violet-400/60"
          style={{
            animation: "bounce 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  )
}

export function CoachChat() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [streaming, setStreaming] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || streaming) return

    const userMsg: Message = { role: "user", content: trimmed }
    const history = [...messages, userMsg]
    setMessages([...history, { role: "assistant", content: "" }])
    setInput("")
    setStreaming(true)

    try {
      const res = await fetch("/api/ai/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })

      if (!res.ok) {
        const err = await res.text()
        setMessages((p) => {
          const u = [...p]
          u[u.length - 1] = { role: "assistant", content: `Something went wrong: ${err}` }
          return u
        })
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let content = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        content += decoder.decode(value, { stream: true })
        const snap = content
        setMessages((p) => {
          const u = [...p]
          u[u.length - 1] = { role: "assistant", content: snap }
          return u
        })
      }
    } catch (e) {
      setMessages((p) => {
        const u = [...p]
        u[u.length - 1] = { role: "assistant", content: "Connection error. Try again." }
        return u
      })
    } finally {
      setStreaming(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] min-h-[500px] flex-col overflow-hidden rounded-2xl border border-white/6 bg-white/[0.02]">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-3 border-b border-white/6 px-5 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/20">
          <Brain className="h-4 w-4 text-violet-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white">Cortex AI Coach</p>
          <p className="text-[11px] text-white/35">Knows your goals, tasks & energy history</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-[11px] text-white/30">Online</span>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-white/20 transition hover:text-white/50"
              title="Clear chat"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/15">
              <Brain className="h-6 w-6 text-violet-400" />
            </div>
            <h3 className="mb-1 text-sm font-semibold text-white">Your AI Productivity Coach</h3>
            <p className="mb-6 max-w-sm text-xs leading-relaxed text-white/40">
              I have full context on your goals, tasks, and energy levels. Ask me anything — I&apos;ll give you direct, personalized advice, not generic tips.
            </p>
            <div className="w-full max-w-sm space-y-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 text-left text-xs text-white/55 transition hover:border-violet-500/30 hover:bg-violet-500/5 hover:text-white/80"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={cn("flex gap-2.5", msg.role === "user" ? "flex-row-reverse" : "flex-row")}
              >
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600/20">
                    <Brain className="h-3 w-3 text-violet-400" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[82%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    msg.role === "user"
                      ? "rounded-tr-sm bg-violet-600 text-white"
                      : "rounded-tl-sm border border-white/6 bg-white/[0.04] text-white/80"
                  )}
                >
                  {msg.content ? (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  ) : (
                    <TypingDots />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-white/6 p-3">
        <div className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] px-4 py-2.5 transition focus-within:border-violet-500/30">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your coach anything..."
            disabled={streaming}
            className="flex-1 bg-transparent text-sm text-white outline-none placeholder-white/25 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || streaming}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-500 disabled:opacity-30"
          >
            {streaming ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-white/20">Enter to send · conversation resets on page reload</p>
      </div>

      <style jsx>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  )
}
