export const runtime = "nodejs";
import { checkModeration } from "../../utils/moderation";
import { sanitizeContent, containsProfanity } from "../../utils/sanitize";
import { isSpineRelated } from "../../utils/topicCheck";
import { RateLimiter } from "../../utils/rateLimiter";

const limiter = new RateLimiter({ windowMs: 60000, max: 25 });

export async function POST(req) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Rate limit
    if (!limiter.consume(ip)) {
      return Response.json(
        { error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const { messages } = await req.json();

    if (!Array.isArray(messages)) {
      return Response.json(
        { error: "Messages array required" },
        { status: 400 }
      );
    }

    const user = [...messages].reverse().find((m) => m.role === "user");
    if (!user) {
      return Response.json({ error: "No user message found" }, { status: 400 });
    }

    let content = sanitizeContent(user.content);

    // ❌ 1. Profanity block
    if (containsProfanity(content)) {
      return Response.json(
        {
          error: "Profanity is not allowed in SpinalSense.",
          assistant: {
            role: "assistant",
            content:
              "⚠️ Please avoid using profanity. I can only help with spinal health questions.",
          },
        },
        { status: 400 }
      );
    }

    // ❌ 2. Topic restriction → ONLY spine-related questions allowed
    if (!isSpineRelated(content)) {
      return Response.json(
        {
          error: "Off-topic",
          assistant: {
            role: "assistant",
            content:
              "⚠️ I can only answer questions related to spine health, posture, scoliosis, exercises, physiotherapy basics, or ergonomics.",
          },
        },
        { status: 400 }
      );
    }

    // ❌ 3. Moderation check on input
    const modIn = await checkModeration(content);
    if (modIn.flagged) {
      return Response.json({
        assistant: {
          role: "assistant",
          content:
            "⚠️ Your message cannot be processed as it violates safety guidelines.",
        },
      });
    }

    // SYSTEM SAFETY PROMPT
    const systemPrompt = `
You are SpinalSense, an AI assistant limited ONLY to spinal health education.

### HARD SAFETY RULES (DO NOT BREAK)
- You cannot give medical diagnosis, predict disease, or provide treatment.
- You cannot recommend surgeries, medications, injections, or clinical procedures.
- You cannot estimate Cobb angle without explicit model output.
- You must refuse unrelated topics (politics, relationships, sex, finance, coding, etc.)
- You must refuse profanity, sexual content, violence, self-harm, or illegal content.
- You must refuse any content about other body systems beyond posture/spine.

### WHEN ANSWERING:
- ALWAYS include this disclaimer at the bottom:
- Provide **gentle, general, low-risk educational guidance only.**
- NEVER provide high-risk exercises (heavy lifting, aggressive stretching).
- ALWAYS suggest consulting a physiotherapist for personalized advice.
- Keep tone friendly, supportive, and professional.

### OUTPUT FORMAT:
Respond in clean natural language. Avoid JSON.
`;

    const finalMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const apiKey = process.env.OPENAI_API_KEY;

    const openaiRes = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: finalMessages,
          temperature: 0.2,
          max_tokens: 700,
        }),
      }
    );

    const data = await openaiRes.json();

    const assistant = data?.choices?.[0]?.message;

    // ❌ 4. Moderation check on output
    const modOut = await checkModeration(assistant.content);
    if (modOut.flagged) {
      return Response.json(
        {
          assistant: {
            role: "assistant",
            content:
              "⚠️ I cannot provide that response due to safety guidelines.",
          },
        },
        { status: 200 }
      );
    }

    return Response.json({ assistant: safeOutput });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
