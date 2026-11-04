import assert from "node:assert/strict";
import test from "node:test";
import handler from "../api/contact.js";

test("contact validates input and confirms only provider acceptance", async (t) => {
  const previousKey = process.env.RESEND_API_KEY;
  t.after(() => { if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey; });
  process.env.RESEND_API_KEY = "test-only";
  let sent;
  const fetchMock = t.mock.method(globalThis, "fetch", async (_url, options) => {
    sent = options;
    return { ok: true, json: async () => ({ id: "test-message" }) };
  });
  const body = { name: "Example Buyer", email: "buyer@example.com", message: "We receive incomplete product enquiries.", source: "homepage", request_id: "647be9a1-58e9-4aec-a8c0-4f9be0c13782" };
  async function request(overrides = {}) {
    const res = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(value) { this.value = value; return this; }, end(value) { this.value = value; return this; }, redirect(code, url) { this.code = code; this.value = url; return this; } };
    await handler({ method: "POST", headers: { accept: "application/json", host: "blacksquarelabs.dev", origin: "https://blacksquarelabs.dev" }, body, ...overrides }, res);
    return res;
  }
  assert.equal((await request()).value.status, "accepted");
  assert.equal(JSON.parse(sent.body).reply_to, body.email);
  assert.match(JSON.parse(sent.body).text, /Source: homepage/);
  assert.equal(sent.headers["Idempotency-Key"], `contact/${body.request_id}`);
  const calls = fetchMock.mock.callCount();
  for (const invalid of [undefined, {}, { ...body, email: "invalid" }, { ...body, name: "\n" }, { ...body, message: "x".repeat(5001) }, { ...body, _honey: "spam" }]) {
    assert.equal((await request({ body: invalid })).code, 400);
  }
  assert.equal((await request({ headers: { accept: "application/json", host: "blacksquarelabs.dev", origin: "https://example.com" } })).code, 403);
  assert.equal((await request({ method: "GET" })).code, 405);
  assert.equal(fetchMock.mock.callCount(), calls);
  delete process.env.RESEND_API_KEY;
  assert.equal((await request()).code, 503);
  process.env.RESEND_API_KEY = "test-only";
  fetchMock.mock.mockImplementation(async () => ({ ok: false, json: async () => ({ message: "provider error" }) }));
  assert.equal((await request()).code, 502);
  fetchMock.mock.mockImplementation(async () => { throw new Error("network failure"); });
  assert.equal((await request()).code, 502);
  fetchMock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({}) }));
  assert.equal((await request()).code, 502);
  fetchMock.mock.mockImplementation(async () => ({ ok: true, json: async () => ({ id: "accepted" }) }));
  assert.equal((await request({ headers: { host: "blacksquarelabs.dev" } })).value, "/thank-you");
});
