// app/api/vision/route.js
export const runtime = "nodejs";

const SYSTEM_PROMPT = `
You are SpinalSense — a spine-only AI assistant that analyzes spinal X-rays.
Follow these rules exactly:
- Only discuss spine topics: scoliosis, Cobb angle, posture, ergonomics, physiotherapy basics.
// - NEVER give medical diagnosis, prescribe drugs or surgeries, or provide clinical treatment.
- Refuse profanity, sexual, violent, political, or off-topic requests.
- Always append this exact disclaimer at the end:
  "Disclaimer: I am an AI assistant, not a medical professional. This is an estimation for educational purposes only. For diagnosis or treatment, consult a licensed clinician."

When analyzing an X-ray image:
1) Identify the most tilted superior endplate (upper vertebra) and the most tilted inferior endplate (lower vertebra).
2) Estimate the Cobb angle in degrees to 1 decimal place.
3) Indicate curve direction: left or right.
4) Classify severity:
   - 0–9°: No scoliosis
   - 10–19°: Mild
   - 20–39°: Moderate
   - 40°+: Severe
5) Provide safe, low-risk exercise & posture suggestions, and mention red flags that require clinical attention.
6) Return a short JSON object at the end in the format:
   {
     "cobb_angle": 12.3,
     "direction": "right",
     "severity": "mild",
     "upper_endplate": "T10",
     "lower_endplate": "L2",
     "advice": "..."
   }
Then also provide a one-paragraph human-readable summary (for display).
`;

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file") || form.get("xray") || form.get("image");
    if (!file) {
      return new Response(JSON.stringify({ error: "Image file required (field name 'file' or 'xray')" }), { status: 400, headers: { "content-type": "application/json" }});
    }

    const arr = await file.arrayBuffer();
    const b64 = Buffer.from(arr).toString("base64");
    const dataUrl = `data:${file.type};base64,${b64}`;

    const body = {
      model: "gpt-4o-mini", // or "gpt-4o" if available for vision in your plan
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: "Please analyze the attached X-ray image and provide JSON and a short summary." },
        // Attach image in the user message as simple text with data URL — OpenAI Vision handles data URLs in many setups.
        { role: "user", content: dataUrl }
      ],
      max_tokens: 800,
      temperature: 0.2
    };

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!openaiRes.ok) {
      const text = await openaiRes.text();
      return new Response(JSON.stringify({ error: "OpenAI error", detail: text }), { status: 502, headers: { "content-type": "application/json" }});
    }

    const json = await openaiRes.json();
    const assistant = json?.choices?.[0]?.message?.content ?? "";
    // Try to extract JSON block at the end (best-effort)
    let extracted = null;
    try {
      // find last JSON-looking block
      const jsonMatch = assistant.match(/(\{[\s\S]*\})\s*$/);
      if (jsonMatch) {
        extracted = JSON.parse(jsonMatch[1]);
      }
    } catch (e) {
      extracted = null;
    }

    return new Response(JSON.stringify({ assistant_text: assistant, parsed: extracted }), { status: 200, headers: { "content-type": "application/json" }});
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "content-type": "application/json" }});
  }
}
