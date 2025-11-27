import OpenAI from "openai";

export async function POST(req) {
  try {
    const { messages } = await req.json();

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful spine assistant." },
        ...messages,
      ],
    });

    return Response.json({
      message: completion.choices[0].message.content,
    });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
