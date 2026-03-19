export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

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
}
