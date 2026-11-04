import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100).regex(/^[^\r\n]+$/),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(240).optional().default(""),
  message: z.string().trim().min(1).max(5000),
  source: z.enum(["homepage", "contact", "assistant"]).optional().default("contact"),
  campaign: z.string().trim().max(200).optional().default(""),
  request_id: z.string().uuid().optional(),
  _honey: z.string().max(200).optional(),
});

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method not allowed");
  }
  const wantsJson = req.headers.accept?.includes("application/json");
  const fail = (status, error) => wantsJson
    ? res.status(status).json({ error })
    : res.status(status).end(`${error} Return to the form to keep your message, or email the address on the contact page.`);
  if (req.headers.origin) {
    try {
      if (new URL(req.headers.origin).host !== req.headers.host) return fail(403, "Please send your request from this website.");
    } catch {
      return fail(403, "Please send your request from this website.");
    }
  }
  const parsed = contactSchema.safeParse(req.body);
  if (!parsed.success) return fail(400, "Check your name, email and message. Messages can contain up to 5,000 characters.");
  const { name, email, company, message, source, campaign, request_id, _honey } = parsed.data;
  if (_honey) return fail(400, "We could not accept this request. Please contact us by email.");
  if (!process.env.RESEND_API_KEY) return fail(503, "The form is temporarily unavailable. Your request has not been sent.");
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(10000),
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(request_id ? { "Idempotency-Key": `contact/${request_id}` } : {}),
      },
      body: JSON.stringify({
        from: "Blacksquare Labs <hello@blacksquarelabs.dev>",
        to: ["hello@blacksquarelabs.dev"],
        reply_to: email,
        subject: `Project enquiry — ${(company || name).replace(/[\r\n]+/g, " ")}`,
        text: `Name: ${name}\nEmail: ${email}\nCompany / website: ${company || "Not provided"}\nSource: ${source}\nCampaign: ${campaign || "Not provided"}\n\n${message}`,
      }),
    });
    const result = await response.json().catch(() => null);
    if (!response.ok || !result?.id) return fail(502, "We could not confirm your request was sent. Your message is still here; retry or email us.");
  } catch {
    return fail(502, "We could not confirm your request was sent. Your message is still here; retry or email us.");
  }
  return wantsJson ? res.status(200).json({ status: "accepted" }) : res.redirect(303, "/thank-you");
}
