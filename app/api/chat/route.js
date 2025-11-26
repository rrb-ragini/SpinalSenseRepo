export const runtime = "nodejs";

export async function POST(req) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages must be an array" }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "OPENAI_API_KEY missing" }, { status: 500 });
    }

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.3,
      }),
    });

    if (!openaiRes.ok) {
      const error = await openaiRes.text();
      return Response.json({ error }, { status: 500 });
    }

    const data = await openaiRes.json();
    const assistant = data?.choices?.[0]?.message;

    if (!assistant) {
      return Response.json(
        { error: "No assistant message returned from OpenAI" },
        { status: 500 }
      );
    }

    return Response.json({ assistant });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
