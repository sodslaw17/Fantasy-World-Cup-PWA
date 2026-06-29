// Provider-agnostic LLM caller for admin-triggered commentary generation.
// Switch providers by setting LLM_PROVIDER + the matching key env var:
//
//   LLM_PROVIDER=groq      GROQ_API_KEY=gsk_...        (free tier, recommended)
//   LLM_PROVIDER=gemini    GEMINI_API_KEY=AIza...       (free tier if project eligible)
//   LLM_PROVIDER=anthropic ANTHROPIC_API_KEY=sk-ant-... (~$0.002/call, $5 minimum)
//
// Default: gemini (preserves existing behaviour; swap by changing LLM_PROVIDER).

import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";

type Provider = "gemini" | "anthropic" | "groq";

async function callGemini(systemPrompt: string, prompt: string): Promise<string> {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: systemPrompt,
  });
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
}

async function callAnthropic(systemPrompt: string, prompt: string): Promise<string> {
  const client = new Anthropic();
  const msg = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    system: systemPrompt,
    messages: [{ role: "user", content: prompt }],
  });
  const block = msg.content[0];
  if (block.type !== "text") throw new Error("Unexpected Anthropic response type");
  return block.text.trim();
}

// Groq is OpenAI-compatible — no extra SDK needed, plain fetch.
async function callGroq(systemPrompt: string, prompt: string): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      max_tokens: 400,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Groq API error ${res.status}: ${body}`);
  }
  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content.trim();
}

export async function generateCommentary(
  systemPrompt: string,
  prompt: string,
): Promise<string> {
  const provider = (process.env.LLM_PROVIDER ?? "gemini") as Provider;
  switch (provider) {
    case "gemini":    return callGemini(systemPrompt, prompt);
    case "anthropic": return callAnthropic(systemPrompt, prompt);
    case "groq":      return callGroq(systemPrompt, prompt);
    default:
      throw new Error(
        `Unknown LLM_PROVIDER "${provider}". Valid values: gemini, anthropic, groq`,
      );
  }
}
