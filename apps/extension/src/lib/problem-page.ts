import type { ProblemContext } from "@leetcode-interviewer/shared";

export function isSupportedProblemPage(url: URL): boolean {
  return /^\/problems\/[^/]+\/?$/.test(url.pathname);
}

export function extractProblemContext(doc: Document, url: URL): ProblemContext | null {
  const title =
    doc.querySelector("[data-cy='question-title']")?.textContent?.trim() ??
    doc.querySelector("h1")?.textContent?.trim() ??
    null;

  const description =
    doc.querySelector("[data-track-load='description_content']")?.textContent?.trim() ??
    doc.querySelector("[data-key='description-content']")?.textContent?.trim() ??
    null;

  const difficultyText =
    doc.querySelector("[diff]")?.textContent?.trim() ??
    doc.querySelector("[class*='difficulty']")?.textContent?.trim() ??
    null;

  if (!title || !description) {
    return null;
  }

  return {
    problemTitle: title,
    problemDescription: description,
    problemUrl: url.toString(),
    difficulty: normalizeDifficulty(difficultyText)
  };
}

function normalizeDifficulty(value: string | null): ProblemContext["difficulty"] {
  if (value === "Easy" || value === "Medium" || value === "Hard") {
    return value;
  }

  return null;
}
