import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export function getGeminiModel(json = true) {
  return genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: json ? { responseMimeType: "application/json" } : undefined,
  })
}
