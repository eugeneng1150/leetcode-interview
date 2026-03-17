export const DAILY_FREE_HINT_LIMIT = 3;
export const FREE_REVIEW_LIMIT_PER_SESSION = 1;

export type Difficulty = "Easy" | "Medium" | "Hard" | null;

export type ProblemContext = {
  problemTitle: string;
  problemDescription: string;
  problemUrl: string;
  difficulty: Difficulty;
};

export type HintRequest = {
  problemTitle: string;
  problemDescription: string;
  userAttempt: string;
  hintLevel: number;
};

export type HintResponse = {
  hint: string;
  followUpQuestion: string;
};

export type ReviewRequest = {
  problemTitle: string;
  approach: string;
  code: string;
};

export type ReviewResponse = {
  clarityFeedback: string;
  timeComplexity: string;
  spaceComplexity: string;
  improvementSuggestion: string;
};

export type SessionSummary = {
  problemUrl: string;
  problemTitle: string;
  startedAt: string;
  endedAt: string;
  modeEnabled: boolean;
  hintCount: number;
  reviewRequested: boolean;
};
