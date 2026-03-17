import { DAILY_FREE_HINT_LIMIT, type HintRequest, type HintResponse } from "@leetcode-interviewer/shared";
import { buildHintPrompt } from "../prompts/hint.js";
import { generatePlaceholderText } from "../services/model.js";
import type { ApiError } from "../types/api.js";

export async function handleHint(input: HintRequest): Promise<HintResponse | ApiError> {
  if (input.hintLevel < 1 || input.hintLevel > DAILY_FREE_HINT_LIMIT) {
    return {
      code: "INVALID_HINT_LEVEL",
      message: `hintLevel must be between 1 and ${DAILY_FREE_HINT_LIMIT}.`
    };
  }

  const prompt = buildHintPrompt(input);
  const hint = await generatePlaceholderText(`hint level ${input.hintLevel}`);

  return {
    hint,
    followUpQuestion: `Prompt prepared with ${prompt.length} characters.`
  };
}
