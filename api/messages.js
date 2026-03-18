// Vercel serverless function — proxies requests to Groq API
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const appPassword = process.env.APP_PASSWORD;
  if (appPassword && req.headers["x-app-password"] !== appPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GROQ_API_KEY not set" });

  const { system, messages, max_tokens } = req.body;
  const groqMessages = system
    ? [{ role: "system", content: system }, ...messages]
    : messages;

  try {
    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        max_tokens,
        messages: groqMessages,
      }),
    });

    const data = await upstream.json();
    const text = data.choices?.[0]?.message?.content || "";
    res.status(upstream.status).json({ content: [{ text }] });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Failed to reach Groq API" });
  }
}
