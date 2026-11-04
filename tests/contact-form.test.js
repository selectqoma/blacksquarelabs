import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";

test("enquiry form preserves failed submissions and deduplicates retries", async () => {
  const listeners = {};
  const message = { value: "Customer requirements", disabled: false };
  const button = { textContent: "Send enquiry", disabled: false };
  const status = { textContent: "", focus() {} };
  let reset = false, resolveFetch;
  const requests = [], tracked = [];
  const form = { action: "/api/contact", elements: [message, button], addEventListener(name, callback) { listeners[name] = callback; }, querySelector(selector) { return selector.includes("button") ? button : status; }, reportValidity() { return true; }, setAttribute() {}, removeAttribute() {}, reset() { reset = true; message.value = ""; } };
  const context = vm.createContext({
    document: { querySelectorAll: () => [form], getElementById: () => null },
    FormData: class { *[Symbol.iterator]() { yield ["message", message.value]; yield ["source", "homepage"]; } },
    location: { search: "?utm_campaign=first-pilots" }, URLSearchParams,
    crypto: { randomUUID: () => "test-request" }, AbortSignal,
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return new Promise((resolve) => { resolveFetch = resolve; }); },
    bslTrack: (...args) => { tracked.push(args); },
  });
  vm.runInContext(readFileSync(new URL("../contact-form.js", import.meta.url), "utf8"), context);
  const event = { preventDefault() {} };
  const sending = listeners.submit(event);
  assert.equal(message.disabled, true);
  await listeners.submit(event);
  assert.equal(requests.length, 1);
  resolveFetch({ ok: false, json: async () => ({ error: "Temporary failure" }) });
  await sending;
  assert.equal(reset, false);
  assert.equal(message.value, "Customer requirements");
  assert.equal(message.disabled, false);
  assert.match(status.textContent, /Temporary failure/);
  assert.equal(tracked.length, 0);
  const retry = listeners.submit(event);
  assert.equal(requests[1].request_id, requests[0].request_id);
  assert.equal(requests[1].campaign, "first-pilots");
  resolveFetch({ ok: true, json: async () => ({ status: "accepted" }) });
  await retry;
  assert.equal(reset, true);
  assert.equal(button.disabled, false);
  assert.match(status.textContent, /accepted/);
  assert.equal(tracked.length, 1);
  assert.equal(tracked[0][0], "form_submitted");
  assert.equal(tracked[0][1].source, "homepage");
});

test("assistant validates and prepares a visible brief without sending, resetting retry identity", async () => {
  const listeners = {}, attributes = {}, registered = {}, requests = [];
  const fields = Object.fromEntries(["name", "email", "company", "source", "message"].map((name) => [name, { value: "", disabled: false }]));
  fields.source.value = "homepage";
  fields.message.value = "An earlier draft";
  const button = { textContent: "Send enquiry", disabled: false };
  const status = { textContent: "", focus() {} };
  const ready = { hidden: true, scrollIntoView(options) { this.scrollBehavior = options.behavior; }, focus() { this.focused = true; } };
  const badge = { textContent: "Ready to fill in" };
  const elements = Object.values(fields).concat(button);
  elements.namedItem = (name) => fields[name];
  const form = {
    action: "/api/contact", elements,
    addEventListener(name, callback) { listeners[name] = callback; },
    dispatchEvent(event) { listeners[event.type]?.(event); },
    querySelector(selector) { return selector.includes("button") ? button : status; },
    reportValidity() { return true; },
    setAttribute(name, value) { attributes[name] = value; },
    getAttribute(name) { return attributes[name]; },
    removeAttribute(name) { delete attributes[name]; },
  };
  let sequence = 0, registrationSignal, pagehide;
  const context = vm.createContext({
    document: {
      querySelectorAll: () => [form],
      getElementById: (id) => ({ businessIntakeForm: form, intakeReady: ready, webmcpStatus: badge })[id],
      modelContext: { registerTool(tool, options) { registered[tool.name] = tool; registrationSignal = options.signal; } },
    },
    window: { matchMedia: () => ({ matches: true }), addEventListener(name, callback) { if (name === "pagehide") pagehide = callback; } },
    FormData: class { *[Symbol.iterator]() { for (const [name, field] of Object.entries(fields)) yield [name, field.value]; } },
    location: { search: "" }, URL, URLSearchParams, Event, AbortController, AbortSignal,
    crypto: { randomUUID: () => `request-${++sequence}` },
    fetch: async (_url, options) => { requests.push(JSON.parse(options.body)); return { ok: false, json: async () => ({ error: "Temporary failure" }) }; },
    console,
  });
  vm.runInContext(readFileSync(new URL("../contact-form.js", import.meta.url), "utf8"), context);
  vm.runInContext(readFileSync(new URL("../contact-assistant.js", import.meta.url), "utf8"), context);
  await Promise.resolve();
  const prepare = registered.prepare_call_request.execute;
  const intake = {
    business_name: " Example Labs ", website: "https://example.com", offer: "A RAG assistant with unreliable citations",
    ideal_customer: "Internal support team", primary_market: "Belgium", desired_action: "other",
    contact_name: "Example Engineer", contact_email: "engineer@example.com",
  };
  assert.equal(registered.get_call_intake_questions.execute().questions.length, 8);
  for (const invalid of [null, [], { ...intake, offer: " " }, { ...intake, offer: "x".repeat(601) }, { ...intake, website: "javascript:alert(1)" }, { ...intake, contact_email: "invalid" }, { ...intake, desired_action: "constructor" }]) {
    assert.throws(() => prepare(invalid));
    assert.equal(fields.message.value, "An earlier draft");
  }
  form.setAttribute("aria-busy", "true");
  assert.throws(() => prepare(intake), /wait until the current submission/);
  form.removeAttribute("aria-busy");
  const submit = () => listeners.submit({ preventDefault() {} });
  await submit();
  await submit();
  assert.equal(requests[0].request_id, requests[1].request_id);
  const result = prepare(intake);
  assert.equal(result.status, "call_request_prepared");
  assert.match(result.next_step, /Nothing has been sent or booked/);
  assert.equal(requests.length, 2);
  assert.equal(fields.company.value, "Example Labs");
  assert.equal(fields.source.value, "assistant");
  assert.match(fields.message.value, /RAG assistant/);
  assert.match(fields.message.value, /Website: https:\/\/example.com\//);
  assert.equal(ready.hidden, false);
  assert.equal(ready.focused, true);
  assert.equal(ready.scrollBehavior, "auto");
  await submit();
  assert.notEqual(requests[2].request_id, requests[1].request_id);
  assert.equal(requests[2].source, "assistant");
  pagehide();
  assert.equal(registrationSignal.aborted, true);
});
