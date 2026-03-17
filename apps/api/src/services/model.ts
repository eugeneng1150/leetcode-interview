import OpenAI from "openai";
import type {
  HintRequest,
  HintResponse,
  ReviewRequest,
  ReviewResponse
} from "@leetcode-interviewer/shared";
import { buildHintPrompt } from "../prompts/hint.js";
import { buildReviewPrompt } from "../prompts/review.js";
import { generateHintResponse as generateLocalHintResponse, generateReviewResponse as generateLocalReviewResponse } from "./local-interview.js";

const DEFAULT_OPENAI_MODEL = "gpt-4.1-mini";

let client: OpenAI | null | undefined;

export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getConfiguredModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_OPENAI_MODEL;
}

export async function generateHintResponse(input: HintRequest): Promise<HintResponse> {
  if (!isOpenAIConfigured()) {
    return generateLocalHintResponse(input);
  }

  try {
    return await generateStructuredResponse({
      name: "hint_response",
      prompt: buildHintPrompt(input),
      schema: hintResponseSchema,
      validate: isHintResponse
    });
  } catch (error) {
    if (!shouldFallbackToLocal()) {
      throw error;
    }

    console.error("OpenAI hint generation failed. Falling back to local heuristics.", error);
    return generateLocalHintResponse(input);
  }
}

export async function generateReviewResponse(input: ReviewRequest): Promise<ReviewResponse> {
  if (!isOpenAIConfigured()) {
    return generateLocalReviewResponse(input);
  }

  try {
    return await generateStructuredResponse({
      name: "review_response",
      prompt: buildReviewPrompt(input),
      schema: reviewResponseSchema,
      validate: isReviewResponse
    });
  } catch (error) {
    if (!shouldFallbackToLocal()) {
      throw error;
    }

    console.error("OpenAI review generation failed. Falling back to local heuristics.", error);
    return generateLocalReviewResponse(input);
  }
}

async function generateStructuredResponse<T>(options: {
  name: string;
  prompt: string;
  schema: Record<string, unknown>;
  validate(value: unknown): value is T;
}): Promise<T> {
  const openai = getClient();
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await openai.responses.create({
    model: getConfiguredModel(),
    input: options.prompt,
    text: {
      format: {
        type: "json_schema",
        name: options.name,
        strict: true,
        schema: options.schema
      }
    }
  });

  const payload = response.output_text?.trim();
  if (!payload) {
    throw new Error("OpenAI returned an empty response.");
  }

  const parsed = JSON.parse(payload) as unknown;
  if (!options.validate(parsed)) {
    throw new Error("OpenAI returned JSON that did not match the expected schema.");
  }

  return parsed;
}

function getClient(): OpenAI | null {
  if (client !== undefined) {
    return client;
  }

  if (!process.env.OPENAI_API_KEY) {
    client = null;
    return client;
  }

  client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}

function shouldFallbackToLocal(): boolean {
  return (process.env.LEETCODE_INTERVIEWER_FALLBACK_TO_LOCAL ?? "true").toLowerCase() !== "false";
}

function isHintResponse(value: unknown): value is HintResponse {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.hint === "string" && typeof value.followUpQuestion === "string";
}

function isReviewResponse(value: unknown): value is ReviewResponse {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.clarityFeedback === "string" &&
    typeof value.timeComplexity === "string" &&
    typeof value.spaceComplexity === "string" &&
    typeof value.improvementSuggestion === "string"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

const hintResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    hint: {
      type: "string"
    },
    followUpQuestion: {
      type: "string"
    }
  },
  required: ["hint", "followUpQuestion"]
};

const reviewResponseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    clarityFeedback: {
      type: "string"
    },
    timeComplexity: {
      type: "string"
    },
    spaceComplexity: {
      type: "string"
    },
    improvementSuggestion: {
      type: "string"
    }
  },
  required: ["clarityFeedback", "timeComplexity", "spaceComplexity", "improvementSuggestion"]
};
