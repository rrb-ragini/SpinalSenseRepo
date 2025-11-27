import OpenAI from "openai";

export const runtime = "nodejs"; // Needed to allow Buffer & uploads

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req) {
  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!file) {
      return Response.json(
        { error: "No file found. Expected form key: 'file'." },
        { status: 400 }
      );
    }

    // Convert File → Base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Call OpenAI Vision (gpt-4o mini recommended for speed)
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `You are a spine radiology expert. Analyze this X-ray and:
- Detect presence and severity of scoliosis.
- Identify top and bottom endplates for Cobb angle measurement.
- Compute Cobb angle numerically.
- Return VERY STRICT structured JSON ONLY. Format:

{
  "cobb_angle": <number>,
  "severity": "<none/mild/moderate/severe>",
  "explanation": "<short clinical explanation>",
  "can_measure": true/false
}

If image quality is low, set "can_measure": false and explain why.`
            },
            {
              type: "input_image",
              image_url: dataUrl,
            },
          ],
        }
      ],
      max_tokens: 300
    });

    const raw = response.choices[0].message.content;

    // Try to parse JSON safely
    let result = null;
    try {
      result = JSON.parse(raw);
    } catch (err) {
      return Response.json(
        {
          error: "Model returned non-JSON output.",
          raw_output: raw
        },
        { status: 500 }
      );
    }

    if (!result.can_measure) {
      return Response.json(
        {
          error: "Could not interpret this X-ray.",
          explanation: result.explanation || "Image looks unclear or unreadable."
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        cobb_angle: result.cobb_angle || 0,
        explanation: result.explanation || "",
        severity: result.severity || "unknown",
        overlay_url: dataUrl // optional preview
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Inference error:", error);
    return Response.json(
      { error: "Unexpected server error.", details: error.message },
      { status: 500 }
    );
  }
}
