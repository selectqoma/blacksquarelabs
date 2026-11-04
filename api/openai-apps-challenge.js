export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "text/plain; charset=utf-8");

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end("Method not allowed");
  }

  const token = process.env.OPENAI_APPS_CHALLENGE;
  if (!token) return res.status(404).end("Challenge not configured");
  return res.status(200).end(token);
}
