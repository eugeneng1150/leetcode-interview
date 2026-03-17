import type { ServerResponse } from "node:http";
import { DAILY_FREE_HINT_LIMIT, type ApiError, type HintRequest, type HintResponse } from "@leetcode-interviewer/shared";
import { generateHintResponse, streamHintResponse } from "../services/model.js";

export async function handleHint(input: HintRequest): Promise<HintResponse | ApiError> {
  if (input.hintLevel < 1 || input.hintLevel > DAILY_FREE_HINT_LIMIT) {
    return {
      code: "INVALID_HINT_LEVEL",
      message: `hintLevel must be between 1 and ${DAILY_FREE_HINT_LIMIT}.`
    };
  }

  return generateHintResponse(input);
}

export async function handleHintStream(input: HintRequest, response: ServerResponse): Promise<void> {
  if (input.hintLevel < 1 || input.hintLevel > DAILY_FREE_HINT_LIMIT) {
    response.write(
      `${JSON.stringify({
        type: "error",
        error: {
          code: "INVALID_HINT_LEVEL",
          message: `hintLevel must be between 1 and ${DAILY_FREE_HINT_LIMIT}.`
        }
      })}\n`
    );
    return;
  }

  for await (const event of streamHintResponse(input)) {
    response.write(`${JSON.stringify(event)}\n`);
  }
}
