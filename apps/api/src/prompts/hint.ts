import type { HintRequest } from "@leetcode-interviewer/shared";

export function buildHintPrompt(input: HintRequest): string {
  return [
    "You are an interviewer helping a candidate solve a LeetCode problem.",
    "Return a progressive hint and one follow-up question.",
    "Do not reveal the full solution or exact code.",
    `Problem: ${input.problemTitle}`,
    `Description: ${input.problemDescription}`,
    `Candidate notes: ${input.userAttempt}`,
    `Hint level: ${input.hintLevel}`
  ].join("\n");
}
