import { DAILY_FREE_HINT_LIMIT, type ApiError, type HintRequest, type HintResponse } from "@leetcode-interviewer/shared";
import { generateHintResponse } from "../services/model.js";

export async function handleHint(input: HintRequest): Promise<HintResponse | ApiError> {
  if (input.hintLevel < 1 || input.hintLevel > DAILY_FREE_HINT_LIMIT) {
    return {
      code: "INVALID_HINT_LEVEL",
      message: `hintLevel must be between 1 and ${DAILY_FREE_HINT_LIMIT}.`
    };
  }

  return generateHintResponse(input);
}
