export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are SpinalSense — an AI assistant specialized ONLY in spinal health.

STRICT RULES:
1. You MUST ALWAYS return your final answer ONLY as pure JSON:
{
  "cobb_angle": number | null,
  "severity": "none" | "mild" | "moderate" | "severe",
  "explanation": "short explanation of what is visible",
  "recommendations": "lifestyle, exercise or posture guidance",
  "disclaimer": "I am not a medical professional. This is only an educational estimation."
}

2. DO NOT return text before or after JSON.
3. DO NOT include code blocks.
4. If the X-ray is unclear, return cobb_angle=null and explain.
5. NO medical diagnosis. NO treatment instructions. ONLY posture, lifestyle, exercise advice.
6. No profanity, violence, politics, sexual content, or off-topic conversation.
`;

export async function POST(req) {
  try {
    console.log("🔥 Vision endpoint hit");

    const form = await req.formData();
    const file = form.get("file");
    if (!file) return Response.json({ error: "No file provided" });

    // Convert image to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Call OpenAI Vision
    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this spinal X-ray and return JSON." },
              { type: "image_url", image_url: dataUrl }
            ]
          }
        ],
        temperature: 0,
      })
    });

    const raw = await openaiRes.json();
    console.log("OpenAI:", raw);

    const text = raw?.choices?.[0]?.message?.content || "";
    let parsed = null;

    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("JSON parse error:", err);
    }

    return Response.json({
      assistant_text: text,
      parsed: parsed,
    });

  } catch (err) {
    console.error("Vision error:", err);
    return Response.json({ error: String(err) });
  }
}
