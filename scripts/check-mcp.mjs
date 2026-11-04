import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const endpoint = process.argv[2] ?? "https://blacksquarelabs.dev/mcp";
const client = new Client({ name: "blacksquare-labs-check", version: "1.0.0" });

try {
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint)));
  const tools = await client.listTools();
  const expected = ["get_call_intake_questions", "prepare_call_request"];
  const actual = tools.tools.map((tool) => tool.name).sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Unexpected tools: ${actual.join(", ")}`);
  }
  const questions = await client.callTool({ name: "get_call_intake_questions", arguments: {} });
  if (questions.structuredContent?.questions?.length !== 6) {
    throw new Error("Intake questions did not match the expected contract.");
  }
  console.log(`MCP check passed for ${endpoint}`);
} finally {
  await client.close();
}
