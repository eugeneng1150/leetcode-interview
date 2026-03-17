chrome.runtime?.onInstalled?.addListener(() => {
  console.log("LeetCode Interviewer Mode installed");
});

const LOCAL_API_BASE_URL = "http://127.0.0.1:8787";

chrome.runtime?.onConnect?.addListener?.((port: RuntimePort) => {
  if (port.name !== "hint-stream") {
    return;
  }

  const controller = new AbortController();

  port.onDisconnect.addListener(() => {
    controller.abort();
  });

  port.onMessage.addListener((message: unknown) => {
    if (!isHintStreamStartMessage(message)) {
      return;
    }

    void streamHintToPort(port, message.payload, controller.signal);
  });
});

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

async function streamHintToPort(port: RuntimePort, payload: unknown, signal: AbortSignal): Promise<void> {
  try {
    const response = await fetch(`${LOCAL_API_BASE_URL}/api/hint/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      signal
    });

    if (!response.ok) {
      const errorPayload = (await safeReadJson(response)) as unknown;
      port.postMessage({
        type: "error",
        error: isApiError(errorPayload)
          ? errorPayload
          : {
              code: "API_REQUEST_FAILED",
              message: `Local API returned HTTP ${response.status}.`
            }
      });
      return;
    }

    if (!response.body) {
      port.postMessage({
        type: "error",
        error: {
          code: "LOCAL_API_UNAVAILABLE",
          message: "Local API did not provide a readable response body."
        }
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      buffer = flushPortBuffer(buffer, port);
    }

    buffer += decoder.decode();
    flushPortBuffer(buffer, port);
  } catch (error) {
    if (signal.aborted) {
      return;
    }

    port.postMessage({
      type: "error",
      error: {
        code: "LOCAL_API_UNAVAILABLE",
        message:
          error instanceof Error
            ? `${error.message}. Start the local API with npm run dev:api.`
            : "Local API is unavailable. Start the local API with npm run dev:api."
      }
    });
  }
}

function flushPortBuffer(buffer: string, port: RuntimePort): string {
  const lines = buffer.split("\n");
  const trailing = lines.pop() ?? "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      port.postMessage(JSON.parse(trimmed));
    } catch (error) {
      port.postMessage({
        type: "error",
        error: {
          code: "INVALID_STREAM_PAYLOAD",
          message: error instanceof Error ? error.message : "Hint stream payload was malformed."
        }
      });
      return "";
    }
  }

  return trailing;
}

async function safeReadJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

type ApiRuntimeMessage = {
  kind: "hint" | "review";
  payload: unknown;
};

type HintStreamStartMessage = {
  kind: "start";
  payload: unknown;
};

type RuntimePort = {
  name: string;
  onDisconnect: {
    addListener(listener: () => void): void;
  };
  onMessage: {
    addListener(listener: (message: unknown) => void): void;
  };
  postMessage(message: unknown): void;
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

function isHintStreamStartMessage(value: unknown): value is HintStreamStartMessage {
  if (!isRecord(value)) {
    return false;
  }

  return value.kind === "start" && "payload" in value;
}
