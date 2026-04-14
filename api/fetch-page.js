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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 9000);
    let response;
    try {
      response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
        },
        redirect: "follow",
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }
    const html = await response.text();
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("X-Upstream-Status", String(response.status));
    res.status(200).send(html);
  } catch (err) {
    const isTimeout = err.name === "AbortError";
    res.status(502).json({ error: isTimeout ? "Request timed out fetching page" : "Failed to fetch page: " + err.message });
  }
}
