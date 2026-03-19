import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 3001;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "4mb" }));

app.get("/api/fetch-page", async (req, res) => {
  const appPassword = process.env.APP_PASSWORD;
  if (appPassword && req.headers["x-app-password"] !== appPassword) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const { url } = req.query;
  if (!url || !/^https?:\/\//i.test(url)) {
    return res.status(400).json({ error: "Invalid URL" });
  }
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BlogAuditBot/1.0)" },
      redirect: "follow",
    });
    const html = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200).send(html);
  } catch (err) {
    res.status(502).json({ error: "Failed to fetch page: " + err.message });
  }
});

app.post("/api/verify", (req, res) => {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return res.status(200).json({ ok: true });
  const provided = req.headers["x-app-password"];
  if (provided && provided === appPassword) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
});

app.post("/api/messages", async (req, res) => {
  const appPassword = process.env.APP_PASSWORD;
  if (appPassword && req.headers["x-app-password"] !== appPassword) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "GROQ_API_KEY not set in .env" });
  }

  // Convert Anthropic-style request body → Groq/OpenAI chat completions format
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
    // Re-wrap in Anthropic-compatible shape so the frontend needs no changes
    const text = data.choices?.[0]?.message?.content || "";
    res.status(upstream.status).json({ content: [{ text }] });
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(502).json({ error: "Failed to reach Groq API" });
  }
});

app.listen(PORT, () => {
  console.log(`BlogAuditAI proxy running at http://localhost:${PORT}`);
});
