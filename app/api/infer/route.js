// app/api/infer/route.js
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("❌ OPENAI_API_KEY missing");
    return null;
  }
  return new OpenAI({ apiKey: key });
}

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return Response.json({ error: "No file uploaded." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/png";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const client = getClient();
    if (!client) {
      return Response.json(
        { error: "Server missing API key" },
        { status: 500 }
      );
    }

    const prompt = `
You are a professional radiology assistant.
Return STRICT JSON only with this shape:

{
  "can_measure": true|false,
  "cobb_angle": number|null,
  "severity": "none"|"mild"|"moderate"|"severe"|null,
  "explanation": "short text"
}
`;

    // ✅ Use ONLY gpt-4.1 (no iteration!)
    const response = await client.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "image_url", image_url: dataUrl }
          ]
        }
      ],
      max_tokens: 500
    });

    const raw = response?.choices?.[0]?.message?.content;

    if (!raw) {
      console.error("❌ Empty model response");
      return Response.json(
        { error: "OpenAI returned no content" },
        { status: 502 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
      else {
        return Response.json(
          { error: "Model output was not JSON", raw },
          { status: 500 }
        );
      }
    }

    parsed.overlay_url = dataUrl;

    return Response.json(parsed, { status: 200 });

  } catch (err) {
    console.error("❌ Infer route error:", err);
    return Response.json(
      { error: "Server error", details: String(err) },
      { status: 500 }
    );
  }
}
