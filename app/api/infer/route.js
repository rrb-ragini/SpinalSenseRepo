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
      return new Response(JSON.stringify({ error: "No file uploaded." }), { status: 400, headers: { "content-type": "application/json" } });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mime = file.type || "image/png";
    const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

    const client = getClient();
    if (!client) {
      return new Response(JSON.stringify({ error: "Server missing OPENAI_API_KEY." }), { status: 500, headers: { "content-type": "application/json" } });
    }

    const prompt = `
You are a professional radiology assistant.
Return STRICT JSON ONLY as the top-level content (no extra text).
If you can measure Cobb angle, return:
{
  "can_measure": true,
  "cobb_angle": <number>,
  "severity": "<none|mild|moderate|severe>",
  "explanation": "<short text>"
}
If you cannot measure, return:
{
  "can_measure": false,
  "cobb_angle": null,
  "severity": null,
  "explanation": "<reason>"
}
`;

    // NOTE: use input_text + input_image for image-enabled chat completions
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "input_text", text: prompt },
            { type: "input_image", image_url: dataUrl }
          ]
        }
      ],
      max_tokens: 800
    });

    // Log full response for debugging (visible in Vercel logs)
    console.log("OpenAI raw response:", JSON.stringify(response, null, 2));

    // Extract model text output (the SDK shape may vary; defensive)
    const raw = response?.choices?.[0]?.message?.content;
    if (!raw || (typeof raw !== "string" && !Array.isArray(raw))) {
      // Model returned no usable content — return a JSON error body so frontend .json() works
      return new Response(JSON.stringify({
        error: "Model returned empty or unexpected output",
        raw_output: response
      }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // raw can be string or structured content; convert string if needed
    const rawStr = typeof raw === "string" ? raw : JSON.stringify(raw);

    // Try JSON.parse; if fails, try to find a JSON object in the text
    let parsed = null;
    try {
      parsed = JSON.parse(rawStr);
    } catch (e) {
      const m = rawStr.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch (e2) {
          // parsing failure
          parsed = null;
        }
      }
    }

    if (!parsed) {
      // return helpful JSON with raw output so frontend doesn't crash
      return new Response(JSON.stringify({
        error: "Could not parse model output as JSON",
        raw_output: rawStr
      }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // Normalize fields
    parsed.can_measure = !!parsed.can_measure;
    parsed.cobb_angle = parsed.cobb_angle != null ? Number(parsed.cobb_angle) : null;
    parsed.overlay_url = dataUrl;

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "content-type": "application/json" } });

  } catch (err) {
    console.error("❌ Infer API ERROR:", err);
    return new Response(JSON.stringify({ error: "Analysis failed", details: String(err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
