import type { ReviewRequest, ReviewResponse } from "@leetcode-interviewer/shared";
import { buildReviewPrompt } from "../prompts/review.js";
import { generatePlaceholderText } from "../services/model.js";

export async function handleReview(input: ReviewRequest): Promise<ReviewResponse> {
  const prompt = buildReviewPrompt(input);
  const clarityFeedback = await generatePlaceholderText("review clarity");

  return {
    clarityFeedback,
    timeComplexity: "Unknown",
    spaceComplexity: "Unknown",
    improvementSuggestion: `Model integration not connected yet. Prompt length: ${prompt.length}.`
  };
}
