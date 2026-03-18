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

export type HintStreamEvent =
  | {
      type: "hint_delta";
      delta: string;
      hint: string;
    }
  | {
      type: "completed";
      data: HintResponse;
    }
  | {
      type: "error";
      error: ApiError;
    };

export type ApiError = {
  code: string;
  message: string;
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
  difficulty: Difficulty;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  modeEnabled: boolean;
  hintCount: number;
  reviewRequested: boolean;
  notesPreview: string;
};
