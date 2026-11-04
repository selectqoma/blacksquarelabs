import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { renderScorecard, scoreAnswers, scorecardAreas, scorecardQuestions } from "../scorecard.js";

test("scorecard covers six areas with 20 unique questions and accessible answer pairs", () => {
  assert.equal(scorecardQuestions.length, 20);
  assert.equal(new Set(scorecardQuestions.map(({ id }) => id)).size, 20);
  assert.equal(scorecardAreas.length, 6);
  for (const area of scorecardAreas) assert.ok(scorecardQuestions.some(({ area: id }) => area.id === id));
  const html = renderScorecard();
  assert.equal((html.match(/type="radio"/g) || []).length, 40);
  assert.equal((html.match(/<fieldset/g) || []).length, 6);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /Not assessed/);
  assert.doesNotMatch(html, /type="email"/);
});

test("unanswered questions are separate from No answers and security gaps lead", () => {
  assert.deepEqual(scoreAnswers(), { score: 0, total: 20, answered: 0, unanswered: 20, gaps: [], securityGaps: [], complete: false });
  const answers = { eval_cases: "no", eval_target: "yes", security_access: "no", data_quality: null, ops_traces: undefined };
  const result = scoreAnswers(answers);
  assert.equal(result.score, 1);
  assert.equal(result.answered, 3);
  assert.equal(result.unanswered, 17);
  assert.equal(result.complete, false);
  assert.deepEqual(result.gaps.map(({ id }) => id), ["security_access", "eval_cases"]);
  assert.deepEqual(result.securityGaps.map(({ id }) => id), ["security_access"]);
  assert.deepEqual(answers, { eval_cases: "no", eval_target: "yes", security_access: "no", data_quality: null, ops_traces: undefined });
  assert.equal(scoreAnswers(Object.create({ eval_cases: "yes" })).answered, 0);
});

test("all answers complete the assessment, while invalid input is rejected", () => {
  for (const answer of ["yes", "no"]) {
    const result = scoreAnswers(Object.fromEntries(scorecardQuestions.map(({ id }) => [id, answer])));
    assert.equal(result.score, answer === "yes" ? 20 : 0);
    assert.equal(result.gaps.length, answer === "no" ? 20 : 0);
    assert.equal(result.answered, 20);
    assert.equal(result.unanswered, 0);
    assert.equal(result.complete, true);
  }
  for (const invalid of [null, [], "yes", 20, { unknown: "yes" }, { eval_cases: true }, { eval_cases: "" }, { eval_cases: "YES" }]) {
    assert.throws(() => scoreAnswers(invalid), TypeError);
  }
});

test("browser updates instantly, tracks completion once, resets and prints", () => {
  const handlers = {};
  const output = { innerHTML: "" };
  const summary = { textContent: "" };
  let answers = {}, prints = 0;
  const events = [];
  const form = { addEventListener: (event, handler) => { handlers[event] = handler; } };
  const container = { querySelector(selector) {
    if (selector === "form") return form;
    if (selector === "[data-scorecard-result]") return output;
    if (selector === "[data-scorecard-summary]") return summary;
    return { addEventListener: (_event, handler) => { handlers.print = handler; } };
  } };
  const context = vm.createContext({
    document: { querySelectorAll: () => [container] },
    FormData: class { *[Symbol.iterator]() { yield* Object.entries(answers); } },
    window: { bslTrack: (...args) => events.push(args), print: () => { prints++; } },
  });
  vm.runInContext(readFileSync(new URL("../scorecard.js", import.meta.url), "utf8").replace(/^export /gm, ""), context);
  assert.match(output.innerHTML, /Not assessed/);
  assert.equal(summary.textContent, "0 of 20 answered · Not assessed");
  answers = { eval_cases: "yes" };
  handlers.change();
  assert.match(output.innerHTML, /1 of 20 answered · 19 unanswered/);
  assert.equal(summary.textContent, "1 of 20 answered · 1/20 practices confirmed");
  assert.equal(events.length, 0);
  answers = Object.fromEntries(scorecardQuestions.map(({ id }) => [id, "yes"]));
  handlers.change();
  assert.equal(events.length, 1);
  assert.equal(events[0][0], "scorecard_completed");
  assert.equal(events[0][1].score, 20);
  answers.security_access = "no";
  handlers.change();
  assert.equal(events.length, 1);
  assert.match(output.innerHTML, /1 security & permissions gap/);
  handlers.reset();
  assert.match(output.innerHTML, /Not assessed/);
  assert.equal(summary.textContent, "0 of 20 answered · Not assessed");
  handlers.change();
  assert.equal(events.length, 2);
  handlers.print();
  assert.equal(prints, 1);
});
