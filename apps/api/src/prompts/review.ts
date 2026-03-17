import type { ReviewRequest } from "@leetcode-interviewer/shared";
import { compactCandidateCode, compactCandidateNotes } from "./input-limits.js";

export function buildReviewPrompt(input: ReviewRequest): string {
  const approach = compactCandidateNotes(input.approach, 700);
  const code = compactCandidateCode(input.code, 3200);
  const codeStatus = code ? "Candidate code was provided." : "No candidate code was provided.";
  const approachStatus = approach || "No candidate notes were provided.";

  return [
    "You are a technical interviewer reviewing a candidate's LeetCode interview attempt.",
    "Your review should be practical, restrained, and grounded in the actual notes and code.",
    "",
    "Review goals:",
    "- Assess how clearly the candidate explained the approach.",
    "- Estimate time complexity from the likely algorithm in the notes/code.",
    "- Estimate space complexity from the likely algorithm in the notes/code.",
    "- Give exactly one next improvement that would make the interview answer stronger.",
    "",
    "Do not:",
    "- give a full rewritten solution",
    "- invent implementation details that are not supported by the notes or code",
    "- be vague, generic, or overly flattering",
    "- mention that you are an AI or a language model",
    "",
    "Style guidance:",
    "- Be concise.",
    "- Prefer specific interview feedback over classroom-style explanation.",
    "- If code is missing, say what is missing without pretending you saw it.",
    "- If the candidate likely chose the wrong pattern, say so directly but briefly.",
    "",
    `Problem title: ${input.problemTitle}`,
    `Candidate notes: ${approachStatus}`,
    `Code status: ${codeStatus}`,
    `Candidate code: ${code || "No code provided."}`,
    "",
    "Return text that fits these fields:",
    "- clarityFeedback: 1 to 2 sentences",
    "- timeComplexity: one short estimate with brief justification",
    "- spaceComplexity: one short estimate with brief justification",
    "- improvementSuggestion: one concrete next step"
  ].join("\n");
}
