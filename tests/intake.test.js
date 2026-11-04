import assert from "node:assert/strict";
import test from "node:test";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../lib/mcp-server.js";

async function connectedClient() {
  const server = createMcpServer();
  const client = new Client({ name: "blacksquare-labs-test", version: "1.0.0" });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await Promise.all([server.connect(serverTransport), client.connect(clientTransport)]);
  return { client, server };
}

const validIntake = {
  business_name: "Example Studio",
  website: "https://example.com/",
  offer: "Design and implementation services for growing companies.",
  ideal_customer: "Operations leaders at European service businesses.",
  primary_market: "Europe",
  desired_action: "book",
};

test("advertises the two review-safe intake tools", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const result = await client.listTools();
  assert.deepEqual(result.tools.map((tool) => tool.name), [
    "get_call_intake_questions",
    "prepare_call_request",
  ]);
  for (const tool of result.tools) {
    assert.equal(tool.annotations.readOnlyHint, true);
    assert.equal(tool.annotations.openWorldHint, false);
    assert.equal(tool.annotations.destructiveHint, false);
  }
});

test("returns the intake questions and intended next tool", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const result = await client.callTool({ name: "get_call_intake_questions", arguments: {} });
  assert.equal(result.structuredContent.questions.length, 6);
  assert.equal(result.structuredContent.next_tool, "prepare_call_request");
});

test("prepares a consultation brief without submitting anything", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const result = await client.callTool({ name: "prepare_call_request", arguments: validIntake });
  assert.equal(result.structuredContent.status, "brief_ready");
  assert.equal(result.structuredContent.brief.business_name, "Example Studio");
  assert.equal(result.structuredContent.next_step.url, "https://blacksquarelabs.dev/#call-intake");
  assert.match(result.content[0].text, /Nothing has been submitted yet/);
});

test("accepts an intake without an optional website", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const { website: _website, ...withoutWebsite } = validIntake;
  const result = await client.callTool({ name: "prepare_call_request", arguments: withoutWebsite });
  assert.equal(result.structuredContent.brief.website, null);
});

test("rejects unsupported website protocols", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const result = await client.callTool({
    name: "prepare_call_request",
    arguments: { ...validIntake, website: "file:///private/customer-list" },
  });
  assert.equal(result.isError, true);
});

test("rejects a missing required business name", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const { business_name: _businessName, ...missingName } = validIntake;
  const result = await client.callTool({ name: "prepare_call_request", arguments: missingName });
  assert.equal(result.isError, true);
});

test("rejects an unknown desired action", async (t) => {
  const { client, server } = await connectedClient();
  t.after(async () => Promise.all([client.close(), server.close()]));
  const result = await client.callTool({
    name: "prepare_call_request",
    arguments: { ...validIntake, desired_action: "publish_private_data" },
  });
  assert.equal(result.isError, true);
});
