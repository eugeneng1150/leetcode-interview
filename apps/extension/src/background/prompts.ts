import type { HintRequest, ReviewRequest } from "@leetcode-interviewer/shared";
import { compactCandidateCode, compactCandidateNotes, compactProblemText } from "./prompt-utils";

export function buildHintPrompt(input: HintRequest): string {
  const candidateNotes =
    compactCandidateNotes(input.userAttempt, 700) || "No candidate notes provided yet.";
  const problemDescription =
    compactProblemText(input.problemDescription, 1800) || "Problem description unavailable.";
  const hintLevelGuidance = getHintLevelGuidance(input.hintLevel);

  return [
    "You are simulating a strong technical interviewer during a LeetCode-style coding interview.",
    "Your job is to guide, not solve.",
    "",
    "Output goals:",
    "- Be concise and concrete.",
    "- Sound like an interviewer, not a tutor or cheerleader.",
    "- Use the candidate's notes when possible.",
    "- Ask a follow-up question that pushes the candidate to think.",
    "",
    "Do not:",
    "- reveal the full algorithm too early",
    "- provide code or pseudocode",
    "- dump multiple strategies at once",
    "- praise excessively or use motivational filler",
    "",
    "Hint ladder:",
    "- Level 1: give only a light nudge about what to notice.",
    "- Level 2: point toward the right pattern or invariant.",
    "- Level 3 and above: give a stronger directional hint, but still stop short of the full solution.",
    "",
    `Current hint level: ${input.hintLevel}`,
    `Level guidance: ${hintLevelGuidance}`,
    "",
    `Problem title: ${input.problemTitle}`,
    `Problem description excerpt: ${problemDescription}`,
    `Candidate notes excerpt: ${candidateNotes}`,
    "",
    "Return text that fits these fields:",
    "- hint: 1 to 3 sentences, specific but non-spoiling",
    "- followUpQuestion: one sharp interview-style question"
  ].join("\n");
}

export function buildStreamingHintPrompt(input: HintRequest): string {
  const candidateNotes =
    compactCandidateNotes(input.userAttempt, 700) || "No candidate notes provided yet.";
  const problemDescription =
    compactProblemText(input.problemDescription, 1800) || "Problem description unavailable.";
  const hintLevelGuidance = getHintLevelGuidance(input.hintLevel);

  return [
    "You are simulating a strong technical interviewer during a LeetCode-style coding interview.",
    "Guide the candidate without revealing the full solution.",
    "Be concise, specific, and non-spoiling.",
    "",
    "Do not provide code, pseudocode, or the full algorithm.",
    "Do not use motivational filler or tutor-style explanation.",
    "",
    `Current hint level: ${input.hintLevel}`,
    `Level guidance: ${hintLevelGuidance}`,
    `Problem title: ${input.problemTitle}`,
    `Problem description excerpt: ${problemDescription}`,
    `Candidate notes excerpt: ${candidateNotes}`,
    "",
    "Return exactly this format and nothing else:",
    "<hint>",
    "1 to 3 concise interviewer-style sentences",
    "</hint>",
    "<follow_up_question>",
    "one sharp interview-style question",
    "</follow_up_question>"
  ].join("\n");
}

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

function getHintLevelGuidance(level: number): string {
  if (level <= 1) {
    return "Stay high-level. Focus on what the candidate should notice first.";
  }

  if (level === 2) {
    return "Point toward the right pattern, data structure, or invariant.";
  }

  return "Be more explicit about the direction, but do not hand over the full solution steps.";
}
