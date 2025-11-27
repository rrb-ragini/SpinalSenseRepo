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

/**
 * Defensive infer handler:
 * - Always returns JSON
 * - Logs raw OpenAI response
 * - Returns raw_output when parsing fails
 */
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

    const prompt = `
You are a professional radiology assistant.
Return STRICT JSON only (no explanation text). The JSON shape should be:

{
  "can_measure": true|false,
  "cobb_angle": <number|null>,
  "severity": "<none|mild|moderate|severe|null>",
  "explanation": "<short text>"
}

If you cannot measure, set "can_measure": false and include "explanation".
`;

    // Try two model names depending on account access.
    // If gpt-4o-mini fails (empty), try gpt-4o.
    const modelCandidates = ["gpt-4o-mini", "gpt-4o"];

    let response = null;
    let lastError = null;

    for (const model of modelCandidates) {
      try {
        console.log(`Calling OpenAI with model=${model}`);
        response = await client.chat.completions.create({
          model,
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
        // if response present, break
        if (response) break;
      } catch (err) {
        lastError = err;
        console.error(`OpenAI call failed for model ${model}:`, String(err));
      }
    }

    // If we never got a response
    if (!response) {
      console.error("No OpenAI response; lastError:", lastError);
      return new Response(JSON.stringify({
        error: "No response from OpenAI",
        details: String(lastError ?? "unknown")
      }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // Log the raw response object for debugging in Vercel
    try {
      console.log("OpenAI raw response:", JSON.stringify(response, null, 2));
    } catch (e) {
      console.log("OpenAI raw response (stringify failed):", String(e));
    }

    // Defensive extraction: SDK may return message content as string or structured
    const raw = response?.choices?.[0]?.message?.content ?? null;
    // If raw is undefined/null, also look for text field
    const altRaw = response?.choices?.[0]?.message ?? response?.choices?.[0]?.text ?? null;

    const rawStr = typeof raw === "string" ? raw : (typeof altRaw === "string" ? altRaw : (raw ? JSON.stringify(raw) : null));

    if (!rawStr) {
      // Nothing usable, return the full response under raw_output
      return new Response(JSON.stringify({
        error: "OpenAI returned no usable content",
        raw_output: response
      }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // Try parse JSON; if fails extract JSON block
    let parsed = null;
    try {
      parsed = JSON.parse(rawStr);
    } catch (err) {
      const match = rawStr.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (err2) {
          parsed = null;
        }
      }
    }

    if (!parsed) {
      // Return raw output so frontend can show it
      return new Response(JSON.stringify({
        error: "Could not parse model output as JSON",
        raw_output: rawStr
      }), { status: 502, headers: { "content-type": "application/json" } });
    }

    // Normalize fields
    parsed.can_measure = !!parsed.can_measure;
    parsed.cobb_angle = parsed.cobb_angle != null ? Number(parsed.cobb_angle) : null;
    parsed.severity = parsed.severity ?? null;
    parsed.explanation = parsed.explanation ?? null;
    parsed.overlay_url = dataUrl;

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "content-type": "application/json" } });

  } catch (err) {
    console.error("Infer route top-level error:", err);
    return new Response(JSON.stringify({ error: "Server error", details: String(err) }), { status: 500, headers: { "content-type": "application/json" } });
  }
}
