# Styling research — 23 October 2026

## Direction and sources

- [Linear: A calmer interface for a product in motion](https://linear.app/now/behind-the-latest-design-refresh). Keep the strongest visual weight on the headline and primary action; quieter supporting elements and fewer separators preserve hierarchy.
- [Vercel: Geist colors](https://vercel.com/geist/colors). Use distinct tones for surfaces, borders and text. Keep the foundation monochrome: white and near-white surfaces, graphite sections, and readable neutral text.
- [Apple: Materials](https://developer.apple.com/design/human-interface-guidelines/materials). Apply glass sparingly to the header and foreground visuals. Use tinted surfaces behind text and opaque fallbacks; avoid stacking translucent layers. This adapts platform guidance to the website rather than reproducing a native material.
- [W3C: Contrast minimum](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html). Check text against the composited background: at least 4.5:1 for normal text and 3:1 for large text. Transparency makes the underlying content part of that check.

## Decisions applied

1. Use white and graphite with a restrained cobalt family: `#375DFB` for concentrated accents and `#92AAFF` for pale highlights on dark surfaces. Replace the previous cyan, lilac and rose mixture.
2. Keep most type, borders and surfaces neutral. Reserve color for the primary action, focus states, small workflow signals and selected edges of the architecture illustration.
3. Keep glass on the header and foreground visuals, with sufficiently opaque reading surfaces and solid fallbacks. Respect reduced motion and reduced transparency preferences.
4. Lead with the requested headline, “AI operating system for your business.” Supporting copy continues to describe commissioned integration work; the phrase does not imply an off-the-shelf product or universal tool compatibility.

These are design references and desktop research, not user testing or evidence of business results. White on `#375DFB` computes to 5.10:1; `#92AAFF` on `#0C0D10` computes to 8.71:1. These isolated pairs do not certify the full rendered page or translucent surfaces. Reference-site screenshots were not compared; this research used published guidance. The local implementation was then checked in the browser at desktop and mobile widths.

The 23 October direction supersedes conflicting headline and color choices below. The site source remains `scripts/build-site.mjs`; these research notes are excluded from production.

---

# Website copy research — 19 October 2026

## Current direction

Position Blacksquare Labs around end-to-end AI integration across a business: an agentic core, natural language interaction, and connections to the tools and data a team already uses. Preserve the independent engineering practice, existing engagement arrangements and the illustrative status of examples.

This research establishes terminology and writing choices. It does not verify Blacksquare Labs' delivery history, supported integrations or client results.

## Primary sources and terminology

- [Microsoft: What is AI orchestration?](https://www.microsoft.com/en-us/ai/ai-101/orchestration). Defines orchestration as coordination of agents, models, APIs and business systems across processes, including context, handoffs and oversight. This is the precise technical meaning behind the website's “agentic core.” The same source notes that API availability, data access and integration gaps affect implementation.
- [Microsoft: Agentic Automation Adoption Guide](https://adoption.microsoft.com/files/agents/AgenticAutomationAdoptionGuide.pdf). Describes natural language interaction with business processes and agents coordinating actions. It also describes combining agents with existing automation. Use “natural language interface,” “conversational interface” and “agentic automation” where they explain a concrete user task.
- [Model Context Protocol: Introduction](https://modelcontextprotocol.io/docs/getting-started/intro). Describes MCP as an open standard connecting AI applications to external systems, tools and data. Name MCP alongside APIs, connectors and custom integrations, where supported; it is not a promise that every application already has a connection.
- [Anthropic: Building effective agents](https://www.anthropic.com/engineering/building-effective-agents). Distinguishes predefined workflows from agents that dynamically direct their processes and tool use. Use agents where flexible decisions are useful, with existing workflows for predictable steps. The article's tooling discussion has evolved since publication, but this architectural distinction supports the copy.
- [Microsoft: Core business process transformation](https://learn.microsoft.com/en-us/agents/adoption-patterns/pattern-core-business-process). Frames adoption around complete business processes and measurable business outcomes. Describe the workflow and its intended outcome without inventing performance improvements or evidence of prior delivery.

## Decisions applied

1. Lead with end-to-end AI integration. Explain the service through workflow discovery, connected systems, implementation, testing, deployment and handover.
2. Define the agentic core through its behavior: coordinate context, tools, actions and human handoffs across a business process.
3. Make natural language interaction concrete: ask a question, gather account context, prepare a proposal or initiate onboarding.
4. Say “the tools you use” and explain integration methods. Avoid an unsupported universal compatibility guarantee such as “works with every tool.”
5. Use connected tools and workflow imagery to support the positioning. Keep examples labelled as illustrative and avoid invented results or client endorsements.
6. Keep Technical Review a review of existing code and architecture, with findings and a test plan. Implementation remains separate. Preserve the three-month minimum for ongoing technical leadership.
7. Explain permissions, approval points, testing and monitoring where they help a buyer understand what will be delivered, without making them the headline proposition.

The source is `scripts/build-site.mjs`. This note is excluded from production with the rest of `scripts/`.

---

# Historical research — 25 September 2026

The notes below document the previous positioning and are retained for history. The 19 October direction above supersedes conflicting headline and service emphasis choices.

## Purpose

Explain what a client can commission from Blacksquare Labs. Keep the accepted headline, “Senior engineering for AI projects”, and the existing design. Avoid slogans, assumed problems, invented credentials, client results and published prices.

This is desk research of service pages and case studies, not interviews with Blacksquare Labs buyers. Other companies’ projects inform the level of detail; they are not evidence of Blacksquare Labs’ experience.

## Sources and observations

- [Winder.AI: Temple University research assistant](https://winder.ai/transforming-legal-research-ai-legal-text-analysis/). Describes the existing research product, the legal documents it reads and the passages researchers need to find. Useful because the reader can identify the actual feature and user task.
- [thoughtbot: Knect](https://thoughtbot.com/case-studies/knect). Separates feasibility work, API experiments and a proof-of-concept application. Useful for distinguishing a prototype from a deployed product and explaining the work between them.
- [thoughtbot: healthcare content application](https://thoughtbot.com/case-studies/generative-ai). Identifies the employees’ document work and the features implemented. Use the workflow and feature detail as a writing pattern; do not borrow outcome claims.
- [Bitovi: AI for software teams](https://www.bitovi.com/ai-for-software-teams). Names tool connections and examples of work an assistant can perform. Useful for explaining an agent through its actions, not a list of technical categories.
- [GOV.UK: writing for user interfaces](https://www.gov.uk/service-manual/design/writing-for-user-interfaces). Recommends descriptive headings, short direct sentences and clear language even for specialist users.

## Decisions applied

1. Replace the Quality / Testing / Delivery problem cards with examples of commissioned work: a document assistant, an agent connected to existing software, and completion of an existing prototype.
2. Give each example a task, an input or connected system, and a visible result. Describe source links, draft replies and reviewed ticket updates instead of abstract improvements to “quality”.
3. Use first person for the work of the independent engineer. Keep the company name and accepted positioning; do not restore the founder’s name.
4. Explain engagement formats separately from software examples: five-day review, defined project and recurring engineering days.
5. Name development deliverables: implementation, tests, deployment configuration, operating documentation and a walkthrough. Keep the review’s test plan distinct from implementing a test suite.
6. Replace the repeated homepage process section with project deliverables and remove the duplicate four-step video recap.
7. Preserve the illustrative status of the support-assistant video. No borrowed client names, results or testimonials appear in the site.
8. Keep technical detail in service pages and the deployment checklist where it helps someone assess the work. Do not remove necessary information about permissions or human approval.

The source is `scripts/build-site.mjs`. This note is excluded from production with the rest of `scripts/`.
