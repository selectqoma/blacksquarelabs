import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  CONSULTATION_URL,
  callIntakeShape,
  createConsultationBrief,
  intakeQuestions,
} from "./intake.js";

const questionSchema = z.object({
  field: z.string(),
  ask: z.string(),
  optional: z.boolean(),
});

const briefSchema = z.object({
  business_name: z.string(),
  website: z.string().nullable(),
  offer: z.string(),
  ideal_customer: z.string(),
  primary_market: z.string(),
  desired_action: z.string(),
});

export function createMcpServer() {
  const server = new McpServer(
    { name: "blacksquare-labs", version: "1.0.0" },
    {
      instructions:
        "Help product and engineering teams prepare a call with Blacksquare Labs about taking an AI system from prototype to production. Ask only for missing business details and never invent answers. First use get_call_intake_questions when guidance is needed, then use prepare_call_request. The tools do not send messages, store a lead, or book a meeting. Direct the client to the returned call-planner URL for contact details and final submission.",
    },
  );

  server.registerTool(
    "get_call_intake_questions",
    {
      title: "Get call intake questions",
      description:
        "Use when a product or engineering team is considering Blacksquare Labs for production AI engineering and needs the business details required before planning a call.",
      inputSchema: {},
      outputSchema: {
        questions: z.array(questionSchema),
        next_tool: z.literal("prepare_call_request"),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async () => {
      const result = {
        questions: intakeQuestions,
        next_tool: "prepare_call_request",
      };
      return {
        structuredContent: result,
        content: [
          {
            type: "text",
            text: "Ask the client the six intake questions, skipping the optional website only if they do not have one. Use their answers with prepare_call_request.",
          },
        ],
      };
    },
  );

  server.registerTool(
    "prepare_call_request",
    {
      title: "Prepare a production AI engineering call brief",
      description:
        "Use after a client asks about production AI engineering with Blacksquare Labs and has answered every required intake question. Validate and organize only their answers, then return a reviewable brief and the Blacksquare Labs call-planner link. This does not send, store, or book anything.",
      inputSchema: callIntakeShape,
      outputSchema: {
        status: z.literal("brief_ready"),
        brief: briefSchema,
        next_step: z.object({
          label: z.string(),
          url: z.url(),
          instruction: z.string(),
        }),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
    },
    async (input) => {
      const result = createConsultationBrief(input);
      return {
        structuredContent: result,
        content: [
          {
            type: "text",
            text: `${result.brief.business_name}'s consultation brief is ready. Open ${CONSULTATION_URL} to review the details, add contact information, and plan the call. Nothing has been submitted yet.`,
          },
        ],
      };
    },
  );

  return server;
}
