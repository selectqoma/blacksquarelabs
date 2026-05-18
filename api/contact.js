export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end("Method not allowed");
  }

  const { name, email, company, message, _honey } = req.body;

  if (_honey) {
    return res.redirect(303, "/thank-you");
  }

  if (!name || !email || !message) {
    return res.status(400).end("Missing required fields");
  }

  const emailBody = `
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse;width:100%">
      <tr><td style="padding:8px;color:#888;width:120px">Name</td><td style="padding:8px">${escape(name)}</td></tr>
      <tr><td style="padding:8px;color:#888">Email</td><td style="padding:8px"><a href="mailto:${escape(email)}">${escape(email)}</a></td></tr>
      <tr><td style="padding:8px;color:#888">Company</td><td style="padding:8px">${escape(company) || "—"}</td></tr>
      <tr><td style="padding:8px;color:#888;vertical-align:top">Message</td><td style="padding:8px;white-space:pre-wrap">${escape(message)}</td></tr>
    </table>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Blacksquare Labs <hello@blacksquarelabs.dev>",
      to: ["hello@blacksquarelabs.dev"],
      reply_to: email,
      subject: `Audit request — ${company || name}`,
      html: emailBody,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    console.error("Resend error:", err);
    return res.status(500).end("Failed to send message. Please try again.");
  }

  return res.redirect(303, "/thank-you");
}

function escape(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
