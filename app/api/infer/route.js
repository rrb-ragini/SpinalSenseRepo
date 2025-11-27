// app/api/infer/route.js
import OpenAI from "openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.error("OPENAI_API_KEY missing at runtime");
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
      return new Response(JSON.stringify({ error: "Server misconfigured - OPENAI_API_KEY missing." }), { status: 500, headers: { "content-type": "application/json" } });
    }

    // --- Use one explicit model name (no looping, no string iteration)
    const model = "gpt-4o"; // you asked for a better model

    console.log("Calling OpenAI with model:", model);

    // send image + prompt using the Vision-capable chat completion API
    let response;
    try {
      response = await client.chat.completions.create({
        model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `You are a professional radiology assistant.
Return STRICT JSON ONLY with this shape:

{
  "can_measure": true|false,
  "cobb_angle": <number|null>,
  "severity": "<none|mild|moderate|severe|null>",
  "explanation": "<short text>"
}

If you cannot measure, set can_measure=false and provide a short explanation.`
              },
              { type: "input_image", image_url: dataUrl }
            ]
          }
        ],
        max_tokens: 800
      });
    } catch (err) {
      // catch model-not-found or other API errors and return them clearly
      console.error("OpenAI call failed:", err);
      // If OpenAI SDK error contains structured info, include it
      const info = err?.error ?? String(err);
      return new Response(JSON.stringify({ error: "OpenAI call failed", details: info }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // log raw response for debugging
    try { console.log("OpenAI raw response:", JSON.stringify(response)); } catch (e) { console.log("OpenAI raw response (stringify failed)"); }

    const raw = response?.choices?.[0]?.message?.content ?? response?.choices?.[0]?.text ?? null;
    const rawStr = typeof raw === "string" ? raw : (raw ? JSON.stringify(raw) : null);

    if (!rawStr) {
      // return the entire response so frontend can show it
      return new Response(JSON.stringify({ error: "OpenAI returned no usable text", raw_response: response }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // Try parse JSON or extract JSON block
    let parsed = null;
    try {
      parsed = JSON.parse(rawStr);
    } catch (e) {
      const m = rawStr.match(/\{[\s\S]*\}/);
      if (m) {
        try { parsed = JSON.parse(m[0]); } catch (e2) { parsed = null; }
      }
    }

    if (!parsed) {
      // return raw output so you can see what the model returned
      return new Response(JSON.stringify({ error: "Could not parse model output as JSON", raw_output: rawStr }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // normalize and respond
    parsed.can_measure = !!parsed.can_measure;
    parsed.cobb_angle = parsed.cobb_angle != null ? Number(parsed.cobb_angle) : null;
    parsed.overlay_url = dataUrl;

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "content-type": "application/json" } });
  } catch (err) {
    console.error("Infer route top-level error:", err);
    return new Response(JSON.stringify({ error: "Server error", details: String(err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
