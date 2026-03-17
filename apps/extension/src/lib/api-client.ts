import type {
  ApiError,
  HintRequest,
  HintResponse,
  ReviewRequest,
  ReviewResponse
} from "@leetcode-interviewer/shared";

export class ApiClientError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApiClientError";
    this.code = code;
  }
}

export async function requestHint(input: HintRequest): Promise<HintResponse> {
  const payload = await sendApiMessage("hint", input);
  if (!isHintResponse(payload)) {
    throw new ApiClientError("INVALID_API_RESPONSE", "Hint response was malformed.");
  }

  return payload;
}

export async function requestReview(input: ReviewRequest): Promise<ReviewResponse> {
  const payload = await sendApiMessage("review", input);
  if (!isReviewResponse(payload)) {
    throw new ApiClientError("INVALID_API_RESPONSE", "Review response was malformed.");
  }

  return payload;
}

async function sendApiMessage(
  kind: "hint",
  payload: HintRequest
): Promise<unknown>;
async function sendApiMessage(
  kind: "review",
  payload: ReviewRequest
): Promise<unknown>;
async function sendApiMessage(kind: "hint" | "review", payload: HintRequest | ReviewRequest): Promise<unknown> {
  const response = await chrome.runtime.sendMessage({
    kind,
    payload
  });

  if (!isRuntimeResponse(response)) {
    throw new ApiClientError(
      "INVALID_BACKGROUND_RESPONSE",
      "Extension background service returned an invalid response."
    );
  }

  if (!response.ok) {
    throw new ApiClientError(response.error.code, response.error.message);
  }

  return response.data;
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

function isRuntimeResponse(value: unknown): value is RuntimeSuccessResponse | RuntimeErrorResponse {
  if (!isRecord(value) || typeof value.ok !== "boolean") {
    return false;
  }

  if (value.ok) {
    return "data" in value;
  }

  return "error" in value && isApiError(value.error);
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

type RuntimeSuccessResponse = {
  ok: true;
  data: unknown;
};

type RuntimeErrorResponse = {
  ok: false;
  error: ApiError;
};
