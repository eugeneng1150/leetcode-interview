chrome.runtime?.onInstalled?.addListener(() => {
  console.log("LeetCode Interviewer Mode installed");
});

const LOCAL_API_BASE_URL = "http://127.0.0.1:8787";

chrome.runtime?.onMessage?.addListener?.((message: unknown, _sender: unknown, sendResponse: (value: unknown) => void) => {
  if (!isApiRuntimeMessage(message)) {
    return false;
  }

  void handleApiRuntimeMessage(message)
    .then((response) => {
      sendResponse(response);
    })
    .catch((error) => {
      sendResponse({
        ok: false,
        error: {
          code: "BACKGROUND_REQUEST_FAILED",
          message: error instanceof Error ? error.message : "Unknown background request failure."
        }
      });
    });

  return true;
});

async function handleApiRuntimeMessage(
  message: ApiRuntimeMessage
): Promise<ApiRuntimeSuccessResponse | ApiRuntimeErrorResponse> {
  const path = message.kind === "hint" ? "/api/hint" : "/api/review";

  try {
    const response = await fetch(`${LOCAL_API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(message.payload)
    });

    const payload = (await response.json()) as unknown;
    if (!response.ok || isApiError(payload)) {
      return {
        ok: false,
        error: isApiError(payload)
          ? payload
          : {
              code: "API_REQUEST_FAILED",
              message: `Local API returned HTTP ${response.status}.`
            }
      };
    }

    return {
      ok: true,
      data: payload
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "LOCAL_API_UNAVAILABLE",
        message:
          error instanceof Error
            ? `${error.message}. Start the local API with npm run dev:api.`
            : "Local API is unavailable. Start the local API with npm run dev:api."
      }
    };
  }
}

type ApiRuntimeMessage = {
  kind: "hint" | "review";
  payload: unknown;
};

type ApiRuntimeSuccessResponse = {
  ok: true;
  data: unknown;
};

type ApiRuntimeErrorResponse = {
  ok: false;
  error: {
    code: string;
    message: string;
  };
};

function isApiRuntimeMessage(value: unknown): value is ApiRuntimeMessage {
  if (!isRecord(value)) {
    return false;
  }

  return (
    (value.kind === "hint" || value.kind === "review") &&
    "payload" in value
  );
}

function isApiError(value: unknown): value is { code: string; message: string } {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.code === "string" && typeof value.message === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
