import OpenAI from "openai";
import type {
  AssistantConnectionStatus,
  HintRequest,
  HintResponse,
  HintStreamEvent,
  ReviewRequest,
  ReviewResponse
} from "@leetcode-interviewer/shared";
import { buildHintPrompt, buildReviewPrompt, buildStreamingHintPrompt } from "./prompts";
import { loadAssistantSettings } from "./openai-settings";

export async function testOpenAIConnection(): Promise<AssistantConnectionStatus> {
  const settings = await loadAssistantSettings();
  if (!settings.apiKey) {
    return {
      configured: false,
      ok: false,
      message: "Add your OpenAI API key to enable hints and review.",
      model: settings.model
    };
  }

  try {
    const client = createClient(settings.apiKey);
    await client.responses.create({
      model: settings.model,
      input: "Reply with OK.",
      max_output_tokens: 8
    });

    return {
      configured: true,
      ok: true,
      message: "Connection looks good.",
      model: settings.model
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      message: formatOpenAIError(error, "OpenAI connection test failed."),
      model: settings.model
    };
  }
}

export async function generateHintResponse(input: HintRequest): Promise<HintResponse> {
  const client = await loadConfiguredClient();

  return generateStructuredResponse(client, {
    model: client.model,
    name: "hint_response",
    systemInstructions:
      "You are a strict interview-mode assistant. Be concise, non-spoiling, and structured.",
    prompt: buildHintPrompt(input),
    maxOutputTokens: 220,
    schema: hintResponseSchema,
    validate: isHintResponse
  });
}

export async function* streamHintResponse(input: HintRequest): AsyncGenerator<HintStreamEvent, void> {
  let client: ConfiguredClient;

  try {
    client = await loadConfiguredClient();
  } catch (error) {
    yield {
      type: "error",
      error: {
        code: "OPENAI_NOT_CONFIGURED",
        message: formatOpenAIError(error, "OpenAI is not configured.")
      }
    };
    return;
  }

  try {
    const stream = await client.instance.responses.create({
      model: client.model,
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
    yield {
      type: "error",
      error: {
        code: "OPENAI_HINT_STREAM_FAILED",
        message: formatOpenAIError(error, "Streaming hint generation failed.")
      }
    };
  }
}

export async function generateReviewResponse(input: ReviewRequest): Promise<ReviewResponse> {
  const client = await loadConfiguredClient();

  return generateStructuredResponse(client, {
    model: client.model,
    name: "review_response",
    systemInstructions:
      "You are a strict interview reviewer. Be concise, code-aware, and avoid generic advice.",
    prompt: buildReviewPrompt(input),
    maxOutputTokens: 320,
    schema: reviewResponseSchema,
    validate: isReviewResponse
  });
}

async function generateStructuredResponse<T>(
  client: ConfiguredClient,
  options: {
    model: string;
    name: string;
    systemInstructions: string;
    prompt: string;
    maxOutputTokens: number;
    schema: Record<string, unknown>;
    validate(value: unknown): value is T;
  }
): Promise<T> {
  const response = await client.instance.responses.create({
    model: options.model,
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

async function loadConfiguredClient(): Promise<ConfiguredClient> {
  const settings = await loadAssistantSettings();
  if (!settings.apiKey) {
    throw new Error("OpenAI API key is missing. Add it in the extension settings.");
  }

  return {
    instance: createClient(settings.apiKey),
    model: settings.model
  };
}

function createClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
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

function formatOpenAIError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
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

type ConfiguredClient = {
  instance: OpenAI;
  model: string;
};
