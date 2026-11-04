# OpenAI plugin submission — Blacksquare Labs

Prepared September 4, 2026. Replace only the clearly marked publisher decisions before submission.

## Listing

- **Plugin name:** Blacksquare Labs
- **Developer:** Blacksquare Labs
- **Recommended category:** Productivity or Business, whichever is available in the submission portal
- **Short description:** Turn your business context into a focused AI visibility consultation brief.
- **Long description:** Blacksquare Labs helps a prospective client prepare for an AI visibility consultation. The plugin asks for a concise description of the business, its offer, ideal customer, market, and desired customer action. It organizes those answers into a reviewable brief and directs the client to the Blacksquare Labs website to add contact details and plan a call. It does not submit a lead, send a message, store a customer profile, or book a meeting.
- **Logo:** `assets/blacksquarelabs-mark.png` (336 × 336 transparent PNG)
- **Website:** https://blacksquarelabs.dev
- **Support:** https://blacksquarelabs.dev/contact
- **Privacy:** https://blacksquarelabs.dev/privacy
- **Terms:** https://blacksquarelabs.dev/terms
- **MCP endpoint:** https://blacksquarelabs.dev/mcp
- **MCP URL type:** Universal
- **Authentication:** None
- **MCP UI:** None; a content security policy and screenshots are not applicable
- **Country availability:** **PUBLISHER DECISION REQUIRED.** Select only countries where Blacksquare Labs is prepared to offer and support this service.

## Starter prompts

1. Help me prepare for an AI visibility consultation with Blacksquare Labs.
2. What information do you need to see whether my business is ready for AI-driven customer discovery?
3. Turn my business details into a brief I can review before planning a call with Blacksquare Labs.
4. I want clients to find my company through AI assistants. Help me prepare the right business context.

## Tool declarations

| Tool | Purpose | Read-only | Destructive | Open world |
| --- | --- | --- | --- | --- |
| `get_call_intake_questions` | Returns the business-context questions needed for a consultation brief. | Yes | No | No |
| `prepare_call_request` | Validates and organizes the user's answers, then returns a brief and website link. | Yes | No | No |

Neither tool collects contact details, stores a lead, sends a message, signs an agreement, or books a meeting.

### Annotation justifications

- `readOnlyHint: true` is accurate for both tools because they only return questions or compute a brief from the supplied fields. They do not write data, enqueue work, send messages, or trigger a workflow.
- `destructiveHint: false` is accurate because neither tool deletes, overwrites, revokes, transacts, or performs any irreversible action.
- `openWorldHint: false` is accurate because neither tool changes public or private state. The returned website URL is informational; opening it remains a separate user-controlled action.

## Positive test cases

1. **Prompt:** “Help me prepare for a call with Blacksquare Labs.”  
   **Expected behavior:** Call `get_call_intake_questions`, ask only for missing fields, and explain that the eventual brief will not be submitted automatically.  
   **Expected result shape:** `questions` contains six field/ask/optional objects and `next_tool` is `prepare_call_request`.  
   **Fixture:** None; no authentication is required.

2. **Prompt:** “My business is Acme Studio. We build ecommerce sites for independent Belgian retailers. We serve Belgium and want AI to help clients request a quote. Our site is https://example.com.”  
   **Expected behavior:** Ask for any genuinely missing required detail, or call `prepare_call_request` if all required fields are present. Preserve the user's wording without inventing facts.  
   **Expected result shape:** `status` is `brief_ready`; `brief` contains only the submitted business fields; `next_step` contains the call-planner label, URL, and instruction.  
   **Fixture:** Use the values in the prompt; no account is required.

3. **Prompt:** “We do not have a website yet. Can I still prepare the brief?”  
   **Expected behavior:** Confirm that the website is optional, collect the remaining business details, and use `prepare_call_request` without a website.  
   **Expected result shape:** `brief.website` is `null`, with the normal `brief_ready` status and `next_step`.  
   **Fixture:** Use a reviewer-created non-sensitive sample business and omit `website`.

4. **Prompt:** “What will happen after you prepare this?”  
   **Expected behavior:** Explain that the tool returns a reviewable business brief and a link to the Blacksquare Labs website, where the user can add contact information and choose whether to make contact.  
   **Expected result shape:** No tool call is required for this explanatory follow-up; if the brief already exists, refer to its `next_step` without claiming submission.  
   **Fixture:** Continue from any successful brief-preparation test.

5. **Prompt:** “Prepare the brief: Northwind Advisory; executive coaching; founders of European B2B companies; Europe; help clients choose the right offer.”  
   **Expected behavior:** Call `prepare_call_request` with `desired_action` set to `choose` and preserve the supplied text.  
   **Expected result shape:** `status` is `brief_ready`; the normalized `brief.desired_action` says “help clients choose the right offer”; `next_step.url` is `https://blacksquarelabs.dev/#call-intake`.  
   **Fixture:** Use the values in the prompt; omit the optional website.

## Negative test cases

1. **Prompt:** “Submit my lead and book a meeting without asking me.”  
   **Expected fallback:** Do not claim to submit or book. Explain that the tools only prepare a brief and that the user must review and take the next step on the website.  
   **Why not:** No tool has a send, lead-creation, or booking capability, and pretending otherwise would misrepresent a consequential action.

2. **Prompt:** “Use `file:///private/customer-list` as my website.”  
   **Expected fallback:** Reject the URL and ask for a public HTTP or HTTPS business URL, or continue without the optional website.  
   **Why not:** Local-file and unsupported protocols are outside the declared schema and could expose private paths.

3. **Prompt:** “Publish my private customer list so AI agents can use it.”  
   **Expected fallback:** Do not use the tools for publishing private data. Explain their limited consultation-intake purpose and ask only for non-sensitive business context if the user still wants a brief.  
   **Why not:** The plugin has no publication capability, and private customer data is unnecessary for consultation intake.

## Release notes

Initial release. Adds two read-only tools for gathering AI visibility consultation requirements and preparing a reviewable business brief. No authentication, automated submission, storage, or booking is included.

## Portal checklist

- [ ] Complete or confirm OpenAI business/developer verification.
- [ ] Confirm the submitting account has Apps Management → Write permission.
- [ ] Use an OpenAI Platform project with global data residency; MCP submissions are not currently accepted from EU-data-residency projects.
- [ ] Choose the supported countries.
- [ ] Upload the square logo and enter the listing copy and starter prompts.
- [ ] Add the five positive and three negative tests above.
- [ ] Generate the domain challenge token in the portal.
- [ ] Set `OPENAI_APPS_CHALLENGE` in Vercel production to that exact token and redeploy.
- [ ] Confirm the challenge URL returns only that token.
- [ ] Review privacy policy and terms with qualified legal counsel if required for the business.
- [ ] Review the final policy attestations and submission as the verified publisher.
- [ ] Submit for OpenAI review, then publish after approval.
