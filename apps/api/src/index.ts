import { handleHint } from "./routes/hint.js";
import { handleReview } from "./routes/review.js";

export const apiHandlers = {
  hint: handleHint,
  review: handleReview
};
