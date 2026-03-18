import type {
  ApiError,
  AssistantConnectionStatus,
  AssistantSettingsSummary,
  HintRequest,
  HintStreamEvent,
  ReviewRequest,
  SaveAssistantSettingsInput
} from "@leetcode-interviewer/shared";
import {
  clearAssistantSettings,
  loadAssistantSettingsSummary,
  saveAssistantSettings
} from "./openai-settings";
import {
  generateHintResponse,
  generateReviewResponse,
  streamHintResponse,
  testOpenAIConnection
} from "./openai";

chrome.runtime?.onInstalled?.addListener(() => {
  console.log("LeetCode Interviewer Mode installed");
});

chrome.runtime?.onConnect?.addListener?.((port: RuntimePort) => {
  if (port.name !== "hint-stream") {
    return;
  }

  let disconnected = false;
  port.onDisconnect.addListener(() => {
    disconnected = true;
  });

  port.onMessage.addListener((message: unknown) => {
    if (!isHintStreamStartMessage(message)) {
      return;
    }

    void streamHintToPort(port, message.payload, () => disconnected);
  });
});

chrome.runtime?.onMessage?.addListener?.((message: unknown, _sender: unknown, sendResponse: (value: unknown) => void) => {
  if (!isRuntimeMessage(message)) {
    return false;
  }

  void handleRuntimeMessage(message)
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

async function handleRuntimeMessage(
  message: RuntimeMessage
): Promise<RuntimeSuccessResponse | RuntimeErrorResponse> {
  try {
    switch (message.kind) {
      case "hint":
        return {
          ok: true,
          data: await generateHintResponse(message.payload)
        };
      case "review":
        return {
          ok: true,
          data: await generateReviewResponse(message.payload)
        };
      case "settings:get":
        return {
          ok: true,
          data: await loadAssistantSettingsSummary()
        };
      case "settings:save":
        return {
          ok: true,
          data: await saveAssistantSettings(message.payload)
        };
      case "settings:clear":
        return {
          ok: true,
          data: await clearAssistantSettings()
        };
      case "settings:test":
        return {
          ok: true,
          data: await testOpenAIConnection()
        };
      default:
        return {
          ok: false,
          error: {
            code: "UNKNOWN_BACKGROUND_MESSAGE",
            message: "Unsupported background request."
          }
        };
    }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "OPENAI_REQUEST_FAILED",
        message: error instanceof Error ? error.message : "OpenAI request failed."
      }
    };
  }
}

async function streamHintToPort(
  port: RuntimePort,
  payload: HintRequest,
  isDisconnected: () => boolean
): Promise<void> {
  for await (const event of streamHintResponse(payload)) {
    if (isDisconnected()) {
      return;
    }

    port.postMessage(event);

    if (event.type === "completed" || event.type === "error") {
      return;
    }
  }
}

type RuntimeMessage =
  | {
      kind: "hint";
      payload: HintRequest;
    }
  | {
      kind: "review";
      payload: ReviewRequest;
    }
  | {
      kind: "settings:get";
    }
  | {
      kind: "settings:save";
      payload: SaveAssistantSettingsInput;
    }
  | {
      kind: "settings:clear";
    }
  | {
      kind: "settings:test";
    };

type HintStreamStartMessage = {
  kind: "start";
  payload: HintRequest;
};

type RuntimePort = {
  name: string;
  onDisconnect: {
    addListener(listener: () => void): void;
  };
  onMessage: {
    addListener(listener: (message: unknown) => void): void;
  };
  postMessage(message: HintStreamEvent): void;
};

type RuntimeSuccessResponse = {
  ok: true;
  data: unknown;
};

type RuntimeErrorResponse = {
  ok: false;
  error: ApiError;
};

function isRuntimeMessage(value: unknown): value is RuntimeMessage {
  if (!isRecord(value) || typeof value.kind !== "string") {
    return false;
  }

  switch (value.kind) {
    case "hint":
      return "payload" in value && isHintRequest(value.payload);
    case "review":
      return "payload" in value && isReviewRequest(value.payload);
    case "settings:get":
    case "settings:clear":
    case "settings:test":
      return true;
    case "settings:save":
      return "payload" in value && isSaveAssistantSettingsInput(value.payload);
    default:
      return false;
  }
}

function isHintStreamStartMessage(value: unknown): value is HintStreamStartMessage {
  if (!isRecord(value)) {
    return false;
  }

  return value.kind === "start" && "payload" in value && isHintRequest(value.payload);
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

function isSaveAssistantSettingsInput(value: unknown): value is SaveAssistantSettingsInput {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.apiKey === "string" && typeof value.model === "string";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
