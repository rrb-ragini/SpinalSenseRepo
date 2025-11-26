export async function checkModeration(text) {
  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const res = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input: text }),
    });

    const json = await res.json();
    const result = json.results?.[0];

    return {
      flagged: result.flagged,
      categories: result.categories,
      scores: result.category_scores,
    };
  } catch (err) {
    return { flagged: true, error: err };
  }
}
