// Vercel serverless function — validates the app password
export default function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return res.status(200).json({ ok: true }); // no password set = open access

  const provided = req.headers["x-app-password"];
  if (provided && provided === appPassword) {
    res.status(200).json({ ok: true });
  } else {
    res.status(401).json({ error: "Invalid password" });
  }
}
