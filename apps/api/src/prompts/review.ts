import type { ReviewRequest } from "@leetcode-interviewer/shared";

export function buildReviewPrompt(input: ReviewRequest): string {
  return [
    "You are reviewing a candidate's interview attempt.",
    "Return structured feedback with clarity, time complexity, space complexity, and one improvement suggestion.",
    `Problem: ${input.problemTitle}`,
    `Approach: ${input.approach}`,
    `Code: ${input.code}`
  ].join("\n");
}
