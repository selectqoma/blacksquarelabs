# Blacksquare Labs plugin data handling

## Data flow

1. The user asks an AI assistant to prepare for a Blacksquare Labs consultation.
2. The assistant may call `get_call_intake_questions`, which takes no user data.
3. The assistant may call `prepare_call_request` with business name, optional website, offer, ideal customer, market, and desired action.
4. The server validates those fields and returns them as a structured, reviewable brief plus the Blacksquare Labs call-planner URL.
5. The MCP server does not store the brief, collect contact details, send a message, create a lead, or book a meeting.
6. If the user continues on the website, they review the business details and separately choose whether to provide contact information and send an email.

## Processors and operational data

- Vercel hosts the website and MCP server and may retain standard operational and security logs.
- OpenAI or another AI provider transmits the tool request under its own terms when the user invokes the plugin there.
- Resend is used only for submissions made through the separate website contact form.
- The MCP handler logs the HTTP method and an error message on failures; it does not deliberately log request bodies.

## Controls

- No MCP authentication or account linkage.
- No cookies on the MCP endpoint.
- No contact details in MCP tool schemas.
- Strict schema validation and conservative field-length limits.
- Optional website accepts only `http` and `https` URLs.
- All tools are annotated read-only, non-destructive, and closed-world.
- No hidden side effect: the user must act on the website before contacting Blacksquare Labs.
