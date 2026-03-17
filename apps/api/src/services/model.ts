import OpenAI from "openai";
import type {
  ApiError,
  HintRequest,
  HintResponse,
  HintStreamEvent,
  ReviewRequest,
  ReviewResponse
} from "@leetcode-interviewer/shared";
import { buildHintPrompt, buildStreamingHintPrompt } from "../prompts/hint.js";
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
      systemInstructions:
        "You are a strict interview-mode assistant. Be concise, non-spoiling, and structured.",
      prompt: buildHintPrompt(input),
      maxOutputTokens: 220,
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

export async function* streamHintResponse(input: HintRequest): AsyncGenerator<HintStreamEvent, void> {
  if (!isOpenAIConfigured()) {
    const fallback = generateLocalHintResponse(input);
    yield {
      type: "hint_delta",
      delta: fallback.hint,
      hint: fallback.hint
    };
    yield {
      type: "completed",
      data: fallback
    };
    return;
  }

  try {
    const openai = getClient();
    if (!openai) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const stream = await openai.responses.create({
      model: getConfiguredModel(),
      input: [
        {
          role: "system",
          content: [
            {
              type: "input_text",
              text: "You are a strict interview-mode assistant. Be concise, non-spoiling, and structured."
            }
          ]
        },
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: buildStreamingHintPrompt(input)
            }
          ]
        }
      ],
      max_output_tokens: 180,
      stream: true
    });

    let rawOutput = "";
    let emittedHint = "";

    for await (const event of stream) {
      if (event.type !== "response.output_text.delta") {
        continue;
      }

      rawOutput += event.delta;
      const parsed = parseStreamingHintPayload(rawOutput);
      if (parsed.hint.length <= emittedHint.length) {
        continue;
      }

      const delta = parsed.hint.slice(emittedHint.length);
      emittedHint = parsed.hint;

      if (!delta) {
        continue;
      }

      yield {
        type: "hint_delta",
        delta,
        hint: emittedHint
      };
    }

    yield {
      type: "completed",
      data: parseCompletedStreamingHintPayload(rawOutput)
    };
  } catch (error) {
    if (!shouldFallbackToLocal()) {
      yield {
        type: "error",
        error: toApiError(error)
      };
      return;
    }

    console.error("OpenAI hint generation failed. Falling back to local heuristics.", error);
    const fallback = generateLocalHintResponse(input);
    yield {
      type: "hint_delta",
      delta: fallback.hint,
      hint: fallback.hint
    };
    yield {
      type: "completed",
      data: fallback
    };
  }
}

export async function generateReviewResponse(input: ReviewRequest): Promise<ReviewResponse> {
  if (!isOpenAIConfigured()) {
    return generateLocalReviewResponse(input);
  }

  try {
    return await generateStructuredResponse({
      name: "review_response",
      systemInstructions:
        "You are a strict interview reviewer. Be concise, code-aware, and avoid generic advice.",
      prompt: buildReviewPrompt(input),
      maxOutputTokens: 320,
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
  systemInstructions: string;
  prompt: string;
  maxOutputTokens: number;
  schema: Record<string, unknown>;
  validate(value: unknown): value is T;
}): Promise<T> {
  const openai = getClient();
  if (!openai) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await openai.responses.create({
    model: getConfiguredModel(),
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: options.systemInstructions
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: options.prompt
          }
        ]
      }
    ],
    max_output_tokens: options.maxOutputTokens,
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

function parseStreamingHintPayload(rawOutput: string): HintResponse {
  return {
    hint: extractTagContent(rawOutput, "hint"),
    followUpQuestion: extractTagContent(rawOutput, "follow_up_question")
  };
}

function parseCompletedStreamingHintPayload(rawOutput: string): HintResponse {
  const parsed = parseStreamingHintPayload(rawOutput);
  if (!parsed.hint || !parsed.followUpQuestion) {
    throw new Error("OpenAI returned an incomplete streamed hint response.");
  }

  return parsed;
}

function extractTagContent(rawOutput: string, tagName: string): string {
  const openTag = `<${tagName}>`;
  const closeTag = `</${tagName}>`;
  const start = rawOutput.indexOf(openTag);
  if (start < 0) {
    return "";
  }

  const contentStart = start + openTag.length;
  const end = rawOutput.indexOf(closeTag, contentStart);
  const content = end >= 0 ? rawOutput.slice(contentStart, end) : rawOutput.slice(contentStart);
  return content.trim();
}

function toApiError(error: unknown): ApiError {
  return {
    code: "OPENAI_HINT_STREAM_FAILED",
    message: error instanceof Error ? error.message : "Streaming hint generation failed."
  };
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
