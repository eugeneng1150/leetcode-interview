import type { ReviewRequest, ReviewResponse } from "@leetcode-interviewer/shared";
import { generateReviewResponse } from "../services/model.js";

export async function handleReview(input: ReviewRequest): Promise<ReviewResponse> {
  return generateReviewResponse(input);
}
