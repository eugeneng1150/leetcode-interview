import { createServer } from "node:http";
import type { IncomingMessage, ServerResponse } from "node:http";
import type {
  ApiError,
  HintRequest,
  HintResponse,
  ReviewRequest,
  ReviewResponse
} from "@leetcode-interviewer/shared";
import { handleHint } from "./routes/hint.js";
import { handleReview } from "./routes/review.js";
import { getConfiguredModel, isOpenAIConfigured } from "./services/model.js";

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 8787;
const host = process.env.LEETCODE_INTERVIEWER_API_HOST ?? DEFAULT_HOST;
const port = parsePort(process.env.LEETCODE_INTERVIEWER_API_PORT);

const server = createServer(async (request, response) => {
  applyCors(response);

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  if (!request.url) {
    writeJson(response, 400, {
      code: "INVALID_REQUEST",
      message: "Request URL is missing."
    });
    return;
  }

  const url = new URL(request.url, `http://${host}:${port}`);

  try {
    if (request.method !== "POST") {
      writeJson(response, 405, {
        code: "METHOD_NOT_ALLOWED",
        message: "Only POST is supported."
      });
      return;
    }

    if (url.pathname === "/api/hint") {
      const body = await readJsonBody(request);
      if (!isHintRequest(body)) {
        writeJson(response, 400, {
          code: "INVALID_REQUEST",
          message: "Hint request body is invalid."
        });
        return;
      }

      const result = await handleHint(body);
      if (isApiError(result)) {
        writeJson(response, 400, result);
        return;
      }

      writeJson(response, 200, result);
      return;
    }

    if (url.pathname === "/api/review") {
      const body = await readJsonBody(request);
      if (!isReviewRequest(body)) {
        writeJson(response, 400, {
          code: "INVALID_REQUEST",
          message: "Review request body is invalid."
        });
        return;
      }

      const result = await handleReview(body);
      writeJson(response, 200, result);
      return;
    }

    writeJson(response, 404, {
      code: "NOT_FOUND",
      message: `No route matches ${url.pathname}.`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error.";
    writeJson(response, 500, {
      code: "SERVER_ERROR",
      message
    });
  }
});

server.listen(port, host, () => {
  console.log(`LeetCode Interviewer API listening on http://${host}:${port}`);
  if (isOpenAIConfigured()) {
    console.log(`OpenAI mode enabled with model ${getConfiguredModel()}.`);
  } else {
    console.log("OpenAI API key not configured. Using local heuristic fallback.");
  }
});

function parsePort(value: string | undefined): number {
  if (!value) {
    return DEFAULT_PORT;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : DEFAULT_PORT;
}

function applyCors(response: ServerResponse): void {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function writeJson(
  response: ServerResponse,
  statusCode: number,
  body: ApiError | HintResponse | ReviewResponse
): void {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];

  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const payload = Buffer.concat(chunks).toString("utf8").trim();
  if (!payload) {
    throw new Error("Request body is empty.");
  }

  return JSON.parse(payload);
}

function isHintRequest(value: unknown): value is HintRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.problemTitle === "string" &&
    typeof value.problemDescription === "string" &&
    typeof value.userAttempt === "string" &&
    typeof value.hintLevel === "number"
  );
}

function isReviewRequest(value: unknown): value is ReviewRequest {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.problemTitle === "string" &&
    typeof value.approach === "string" &&
    typeof value.code === "string"
  );
}

function isApiError(value: unknown): value is ApiError {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.code === "string" && typeof value.message === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
