import type { ServerResponse } from "node:http";
import type { ApiError, HintRequest, HintResponse } from "@leetcode-interviewer/shared";
import { generateHintResponse, streamHintResponse } from "../services/model.js";

export async function handleHint(input: HintRequest): Promise<HintResponse | ApiError> {
  if (input.hintLevel < 1) {
    return {
      code: "INVALID_HINT_LEVEL",
      message: "hintLevel must be at least 1."
    };
  }

  return generateHintResponse(input);
}

export async function handleHintStream(input: HintRequest, response: ServerResponse): Promise<void> {
  if (input.hintLevel < 1) {
    response.write(
      `${JSON.stringify({
        type: "error",
        error: {
          code: "INVALID_HINT_LEVEL",
          message: "hintLevel must be at least 1."
        }
      })}\n`
    );
    return;
  }

  for await (const event of streamHintResponse(input)) {
    response.write(`${JSON.stringify(event)}\n`);
  }
}
