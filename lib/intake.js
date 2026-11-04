import { z } from "zod";

export const CONSULTATION_URL = "https://blacksquarelabs.dev/#call-intake";

export const desiredActions = {
  discover: "help users find and understand the business",
  choose: "help users choose the right offer",
  quote: "turn user needs into a quote request",
  book: "help users plan or book a call",
  other: "help users with another task",
};

const websiteSchema = z
  .string()
  .trim()
  .max(240)
  .url()
  .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
    message: "Website must use http or https.",
  });

export const callIntakeShape = {
  business_name: z.string().trim().min(1).max(100),
  website: websiteSchema.optional(),
  offer: z.string().trim().min(1).max(600),
  ideal_customer: z.string().trim().min(1).max(400),
  primary_market: z.string().trim().min(1).max(160),
  desired_action: z.enum(["discover", "choose", "quote", "book", "other"]),
};

export const callIntakeSchema = z.object(callIntakeShape).strict();

export const intakeQuestions = [
  { field: "business_name", ask: "What is the business called?", optional: false },
  { field: "website", ask: "What is its website, if it has one?", optional: true },
  { field: "offer", ask: "What does the product or service do, what AI system exists today, and what is stopping it from reaching production?", optional: false },
  { field: "ideal_customer", ask: "Who are its customers or internal users?", optional: false },
  { field: "primary_market", ask: "Which market or geography does it serve?", optional: false },
  {
    field: "desired_action",
    ask: "Should AI help users discover something, choose an offer, request a quote, book a call, or complete another task?",
    optional: false,
  },
];

export function createConsultationBrief(input) {
  const intake = callIntakeSchema.parse(input);
  const desiredAction = desiredActions[intake.desired_action];

  return {
    status: "brief_ready",
    brief: {
      business_name: intake.business_name,
      website: intake.website ?? null,
      offer: intake.offer,
      ideal_customer: intake.ideal_customer,
      primary_market: intake.primary_market,
      desired_action: desiredAction,
    },
    next_step: {
      label: "Plan a call with Blacksquare Labs",
      url: CONSULTATION_URL,
      instruction:
        "Open the call planner, review the business details, add contact information there, and submit only when the client is ready.",
    },
  };
}
