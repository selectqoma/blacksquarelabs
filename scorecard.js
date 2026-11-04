export const scorecardAreas = [
  { id: "evaluation", title: "Quality testing" },
  { id: "reliability", title: "Reliability & failure handling" },
  { id: "data", title: "Data & document search" },
  { id: "cost", title: "Cost & response time" },
  { id: "security", title: "Security & permissions" },
  { id: "operations", title: "Monitoring & operations" },
];

export const scorecardQuestions = [
  { id: "eval_cases", area: "evaluation", question: "Do your tests cover real user tasks, difficult requests and known failures?", gap: "Build a test set from real user tasks, including difficult requests and known failures." },
  { id: "eval_target", area: "evaluation", question: "Have you set measurable quality requirements that each release must meet?", gap: "Agree on measurable quality requirements before the next release." },
  { id: "eval_regression", area: "evaluation", question: "Do you rerun quality tests when prompts, models, document search or tools change?", gap: "Rerun quality tests whenever prompts, models, document search or tools change." },
  { id: "eval_human", area: "evaluation", question: "Have people who know the subject checked that your test scores reflect useful, correct answers?", gap: "Ask people who know the subject to check whether your automated scores reflect answer quality." },
  { id: "failure_paths", area: "reliability", question: "Does the system fail safely when a model, data source or tool is unavailable?", gap: "Define and test safe behavior for unavailable models, data sources and tools." },
  { id: "failure_limits", area: "reliability", question: "Are there limits on retries, time spent waiting and the number of steps an agent can take?", gap: "Set limits on retries, timeouts and agent steps." },
  { id: "failure_fallback", area: "reliability", question: "Can the system decline a request or pass it to a person when it cannot answer safely?", gap: "Let the system decline a request or pass it to a person when it cannot answer safely." },
  { id: "data_quality", area: "data", question: "Have you checked that source data is accurate, up to date and complete enough for user requests?", gap: "Check source data for errors, outdated content and missing information." },
  { id: "data_retrieval", area: "data", question: "Have you tested whether document search finds the right source information, or confirmed that your system does not need it?", gap: "Test whether document search finds the right source information, or document why it is unnecessary." },
  { id: "data_evidence", area: "data", question: "Can you trace factual answers to trusted sources, or check them against a reliable reference?", gap: "Make factual answers traceable to trusted sources or a reliable reference." },
  { id: "cost_request", area: "cost", question: "Do you measure the total cost of a task, including retries, tools and model calls?", gap: "Measure complete task cost, including retries, tool use and model calls." },
  { id: "cost_latency", area: "cost", question: "Have you measured response times for typical and slow requests against an agreed target?", gap: "Measure response times for typical and slow requests against the target users need." },
  { id: "cost_load", area: "cost", question: "Have you tested the traffic you expect and set usage or spending limits?", gap: "Test expected traffic and enforce usage or spending limits." },
  { id: "security_access", area: "security", question: "Does your application enforce each user's and customer's access permissions whenever the system reads data or calls a tool?", gap: "Enforce each user's and customer's access permissions in application code whenever the system reads data or calls a tool." },
  { id: "security_actions", area: "security", question: "Do actions such as changing records, sending information or spending money require human approval or follow explicit application rules?", gap: "Require human approval or explicit application rules for actions such as changing records, sending information or spending money." },
  { id: "security_injection", area: "security", question: "Have you tested attempts to override the system's instructions through user input, documents and tool responses?", gap: "Test attempts to override instructions through user input, retrieved documents and tool responses." },
  { id: "security_data", area: "security", question: "Have you reviewed which sensitive data reaches models, logs and providers, and how long it is kept?", gap: "Check where sensitive data is sent, provider settings and how long the data is kept." },
  { id: "ops_traces", area: "operations", question: "Can you follow a failed request through document search, model calls and tool actions without exposing sensitive data?", gap: "Record the steps of each request so failures can be investigated without exposing sensitive data." },
  { id: "ops_alerts", area: "operations", question: "Do you monitor quality, errors, response time and spending, with someone responsible for alerts?", gap: "Monitor quality, errors, response time and spending, and assign someone to respond to alerts." },
  { id: "ops_rollback", area: "operations", question: "Can your team restore a previous release and follow written instructions for incidents and handover?", gap: "Document who maintains the system, how to handle incidents and how to restore a previous release. Test those steps." },
];

export function scoreAnswers(answers = {}) {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    throw new TypeError("Answers must be an object keyed by question ID.");
  }
  for (const [id, value] of Object.entries(answers)) {
    if (!scorecardQuestions.some((question) => question.id === id)) throw new TypeError(`Unknown question: ${id}`);
    if (value != null && value !== "yes" && value !== "no") throw new TypeError(`Invalid answer for ${id}: use yes or no.`);
  }
  const yes = scorecardQuestions.filter(({ id }) => Object.hasOwn(answers, id) && answers[id] === "yes");
  const gaps = scorecardQuestions.filter(({ id }) => Object.hasOwn(answers, id) && answers[id] === "no")
    .sort((a, b) => Number(b.area === "security") - Number(a.area === "security"));
  const answered = yes.length + gaps.length;
  return {
    score: yes.length,
    total: scorecardQuestions.length,
    answered,
    unanswered: scorecardQuestions.length - answered,
    gaps,
    securityGaps: gaps.filter(({ area }) => area === "security"),
    complete: answered === scorecardQuestions.length,
  };
}

function renderResult(result) {
  return `<p class="eyebrow">Your assessment</p>
    <p class="scorecard-score">${result.answered ? `${result.score}<span> / ${result.total}</span>` : "Not assessed"}</p>
    <p>${result.answered ? "Practices confirmed by your answers." : "Answer the questions to see what is in place and what needs work."}</p>
    <p class="scorecard-progress">${result.answered} of ${result.total} answered · ${result.unanswered} unanswered</p>
    ${result.securityGaps.length ? `<p class="scorecard-gap"><strong>${result.securityGaps.length} security & permissions ${result.securityGaps.length === 1 ? "gap" : "gaps"}.</strong> Review these before giving the system sensitive data or permission to change records, send information or spend money.</p>` : ""}
    ${result.gaps.length ? `<h3>Address these first</h3><ul>${result.gaps.slice(0, 3).map(({ area, gap }) => `<li class="scorecard-gap">${area === "security" ? "<strong>Security:</strong> " : ""}${gap}</li>`).join("")}</ul><p>${result.gaps.length} ${result.gaps.length === 1 ? "gap identified" : "gaps identified"}${result.gaps.length > 3 ? "; showing the first 3" : ""}.</p>` : result.answered ? `<p>${result.complete ? "All 20 practices are self-reported as in place. Validate them with evidence and real-world testing." : "No gaps reported so far. Unanswered questions still need assessment."}</p>` : ""}
    <p>This score reflects your answers. It does not certify that the system is ready or secure. A single serious gap may still prevent a safe release.</p>`;
}

export function renderScorecard() {
  return `<section class="section" data-scorecard aria-labelledby="scorecard-heading">
    <div class="shell">
      <p class="eyebrow">20 questions · About 5 minutes</p>
      <h2 id="scorecard-heading">Assess your system</h2>
      <p>Choose Yes only when the practice is in place and you have evidence. Choose No if it needs work, or leave a question unanswered if you need to check. Your answers stay in this page; no email is required.</p>
      <noscript><p>Enable JavaScript for instant scoring. You can still use the questions as a checklist.</p></noscript>
      <p class="scorecard-mobile-summary" data-scorecard-summary>0 of 20 answered · Not assessed</p>
      <div class="scorecard-layout">
        <form class="scorecard-form" aria-label="Production-readiness assessment">
          ${scorecardAreas.map((area) => `<fieldset class="scorecard-group"><legend>${area.title}</legend>${scorecardQuestions.filter((question) => question.area === area.id).map(({ id, question }) => `<div class="scorecard-question" role="radiogroup" aria-labelledby="question-${id}"><p id="question-${id}">${question}</p><div class="scorecard-options">${["yes", "no"].map((answer) => `<label><input type="radio" name="${id}" value="${answer}" aria-labelledby="question-${id} answer-${id}-${answer}"><span id="answer-${id}-${answer}">${answer === "yes" ? "Yes" : "No"}</span></label>`).join("")}</div></div>`).join("")}</fieldset>`).join("")}
          <button class="button button-secondary scorecard-reset" type="reset">Reset answers</button>
        </form>
        <aside class="scorecard-result">
          <div data-scorecard-result role="status" aria-live="polite" aria-atomic="true">${renderResult(scoreAnswers())}</div>
          <button class="button button-secondary" type="button" data-scorecard-print>Print / save as PDF</button>
          <a class="button" href="/technical-review">See the technical review <span aria-hidden="true">↗</span></a>
        </aside>
      </div>
    </div>
  </section>`;
}

if (typeof document !== "undefined") {
  document.querySelectorAll("[data-scorecard]").forEach((container) => {
    const form = container.querySelector("form");
    const output = container.querySelector("[data-scorecard-result]");
    const summary = container.querySelector("[data-scorecard-summary]");
    let completionTracked = false;
    function update(answers) {
      const result = scoreAnswers(answers);
      output.innerHTML = renderResult(result);
      summary.textContent = `${result.answered} of ${result.total} answered · ${result.answered ? `${result.score}/${result.total} practices confirmed` : "Not assessed"}`;
      if (result.complete && !completionTracked) {
        completionTracked = true;
        window.bslTrack?.("scorecard_completed", { score: result.score });
      }
    }
    form.addEventListener("change", () => update(Object.fromEntries(new FormData(form))));
    form.addEventListener("submit", (event) => event.preventDefault());
    form.addEventListener("reset", () => {
      completionTracked = false;
      update({});
    });
    container.querySelector("[data-scorecard-print]").addEventListener("click", () => window.print());
    update(Object.fromEntries(new FormData(form)));
  });
}
